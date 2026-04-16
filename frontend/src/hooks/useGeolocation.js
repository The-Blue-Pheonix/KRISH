import { useEffect, useState } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const getLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocode coordinates to get city name using OpenStreetMap
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            
            // Extract city name from different possible properties
            const city = 
              data.address?.city || 
              data.address?.town || 
              data.address?.village || 
              data.address?.county ||
              data.name ||
              'Unknown';

            setLocation({
              latitude,
              longitude,
              city,
              address: data.address,
              fullAddress: data.display_name
            });
            setError(null);
          } catch (err) {
            setError('Failed to fetch location details');
            // Still set coordinates even if geocoding fails
            setLocation({
              latitude,
              longitude,
              city: 'Location',
              address: null,
              fullAddress: null
            });
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    };

    getLocation();
  }, []);

  return { location, loading, error };
};
