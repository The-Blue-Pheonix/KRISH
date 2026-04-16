import React, { useState, useEffect } from 'react';
import { fetchPrediction, getRecommendedSoil } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import { 
  CloudSun, 
  MapPin, 
  Droplets, 
  Wind,
  Tractor,
  Sprout,
  CheckCircle2,
  AlertCircle,
  Target,
  ChevronRight,
  TrendingUp,
  Leaf,
  BookOpen,
  Loader2,
  Info
} from 'lucide-react';

export default function Dashboard() {
  const { location, loading: geoLoading, error: geoError } = useGeolocation();
  const [city, setCity] = useState("Kolkata");
  const [soil, setSoil] = useState("Alluvial");
  const [recommendedSoil, setRecommendedSoil] = useState("Alluvial");
  const [loading, setLoading] = useState(true);
  const [soilLoading, setSoilLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Auto-fetch location from GPS and update city
  useEffect(() => {
    if (location?.city && location.city !== 'Unknown') {
      setCity(location.city);
    }
  }, [location]);

  // Fetch recommended soil when city changes
  useEffect(() => {
    if (city) {
      const fetchSoil = async () => {
        setSoilLoading(true);
        try {
          const result = await getRecommendedSoil(city);
          const suggested = result.recommended_soil || "Alluvial";
          setRecommendedSoil(suggested);
          // Auto-fill soil if it hasn't been manually changed
          setSoil(suggested);
          console.log(`🌱 Auto-detected soil for ${city}: ${suggested}`);
        } catch (err) {
          console.error("Error fetching soil:", err);
          setRecommendedSoil("Alluvial");
        } finally {
          setSoilLoading(false);
        }
      };
      fetchSoil();
    }
  }, [city]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass GPS coordinates if available, otherwise use city name
      const result = await fetchPrediction(
        city, 
        soil, 
        location?.latitude || null, 
        location?.longitude || null
      );
      setData(result);
    } catch (err) {
      setError("Connecting to backend failed. Make sure your Python backend is running format: uvicorn app.main:app");
      setData({
        location: city,
        weather: { temperature: 28, humidity: 72, rainfall: 4 },
        predicted_crop: "Rice",
        soil_condition: "Wet",
        irrigation: "No",
        ai_recommendation: "Hold off on watering today since moisture sits high (72%). Ensure the field has appropriate drainage; your rice crop is growing optimally."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); 

  const handleApplyParams = (e) => {
    e.preventDefault();
    loadData();
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Sprout className="text-emerald-600 dark:text-emerald-400 animate-spin" size={48} />
        <p className="text-neutral-600 dark:text-neutral-400 font-medium">Fetching farm analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 transition-colors">Good Morning! 👋</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 transition-colors">Optimize Your Farm Operations with Real-Time Insights</p>
        </div>
        
        {/* Quick Location Settings */}
        <form onSubmit={handleApplyParams} className="dashboard-card p-1.5 flex items-center gap-1 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 dark:bg-slate-700/50 rounded-lg whitespace-nowrap transition-colors relative">
             <div className="relative">
               {geoLoading && <Loader2 className="absolute -left-6 animate-spin text-emerald-600" size={14} />}
               <MapPin size={16} className={geoError ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'} />
             </div>
             <input 
               type="text" 
               value={city}
               onChange={(e) => setCity(e.target.value)}
               className="bg-transparent border-none text-neutral-700 dark:text-neutral-200 focus:ring-0 w-24 text-sm font-medium p-0"
               placeholder="City"
               title={geoError ? `GPS Error: ${geoError}` : location ? `GPS detected: ${location.fullAddress}` : 'Enable GPS for location'}
             />
          </div>
          <div className="relative group">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 dark:bg-slate-700/50 rounded-lg whitespace-nowrap transition-colors">
               {soilLoading && <Loader2 className="animate-spin text-emerald-600" size={14} />}
               {!soilLoading && <Sprout size={16} className="text-emerald-600 dark:text-emerald-400" />}
               <select 
                 value={soil}
                 onChange={(e) => setSoil(e.target.value)}
                 className="bg-transparent border-none text-neutral-700 dark:text-neutral-200 focus:ring-0 text-sm font-medium p-0 pr-6"
                 title={`Detected: ${recommendedSoil} (click to change)`}
               >
                 <option value="Alluvial">Alluvial</option>
                 <option value="Laterite">Laterite</option>
                 <option value="Black">Black</option>
                 <option value="Red">Red</option>
                 <option value="Terai">Terai</option>
               </select>
            </div>
            {/* Tooltip showing detected soil */}
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 dark:bg-slate-700 text-white dark:text-slate-100 text-xs px-2 py-1 rounded whitespace-nowrap z-50">
              📍 Detected: <strong>{recommendedSoil}</strong> (you can change)
            </div>
          </div>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors ml-1 whitespace-nowrap">
            Apply
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-xl text-sm border border-amber-200 dark:border-amber-800/50 flex items-center gap-2 transition-colors">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {geoError && !location && (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm border border-blue-200 dark:border-blue-800/50 flex items-center gap-2 transition-colors">
          <AlertCircle size={18} />
          📍 GPS Access: {geoError}. You can manually select your location above.
        </div>
      )}

      {/* Top 3 Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Large Weather Card */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors">
              <MapPin size={12} /> {data?.location ?? city}
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between">
             <div>
               <h2 className="text-sm text-neutral-500 dark:text-neutral-400 font-medium transition-colors">Today's Temp</h2>
               <div className="flex items-baseline gap-1 mt-1">
                 <span className="text-4xl font-bold text-neutral-900 dark:text-white transition-colors">{data?.weather?.temperature ?? '--'}°</span>
                 <span className="text-xl font-medium text-neutral-500 dark:text-neutral-400">C</span>
               </div>
             </div>
             <CloudSun size={56} className="text-amber-500 drop-shadow-sm" />
          </div>

          <div className="mt-8 flex items-center gap-6 pt-4 border-t border-neutral-100 dark:border-slate-700 text-sm text-neutral-600 dark:text-neutral-300 transition-colors">
             <div className="flex items-center gap-1.5 font-medium"><Droplets size={16} className="text-blue-500 dark:text-blue-400"/> {data?.weather?.humidity ?? '--'}% Hum</div>
             <div className="flex items-center gap-1.5 font-medium"><Wind size={16} className="text-sky-500 dark:text-sky-400"/> {data?.weather?.rainfall ?? '--'}mm Rain</div>
          </div>
        </div>

        {/* Soil & Irrigation Action */}
        <div className="dashboard-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-neutral-800 dark:text-neutral-100 font-bold transition-colors">Soil Health</h3>
             <Target className="text-neutral-400" size={20} />
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30 transition-colors">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg text-blue-600 dark:text-blue-400 transition-colors">
                   <Droplets size={20} />
                 </div>
                 <div>
                   <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-0.5 transition-colors">Condition</p>
                   <p className="text-lg font-bold text-blue-900 dark:text-blue-300 transition-colors">{data?.soil_condition ?? '--'}</p>
                 </div>
               </div>
               <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-900/40 px-3 py-1 rounded-full shadow-sm transition-colors">
                 Estimated
               </span>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${data?.irrigation === 'Yes' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'}`}>
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg transition-colors ${data?.irrigation === 'Yes' ? 'bg-amber-100 dark:bg-amber-800/30 text-amber-600 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-800/30 text-emerald-600 dark:text-emerald-400'}`}>
                   <CheckCircle2 size={20} />
                 </div>
                 <div>
                   <p className={`text-xs font-semibold mb-0.5 transition-colors ${data?.irrigation === 'Yes' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>Irrigation Action</p>
                   <p className={`text-lg font-bold transition-colors ${data?.irrigation === 'Yes' ? 'text-amber-900 dark:text-amber-300' : 'text-emerald-900 dark:text-emerald-300'}`}>
                     {data?.irrigation === 'Yes' ? 'Irrigate' : (data?.irrigation === 'No' ? 'Do Not Water' : 'Monitor')}
                   </p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="dashboard-card p-6 bg-emerald-700 dark:bg-emerald-800 text-white border-transparent relative overflow-hidden flex flex-col md:col-span-2 xl:col-span-1 transition-colors">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>
           
           <div className="flex flex-col h-full relative z-10">
             <div className="flex items-center gap-2 mb-4">
               <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm"><Sprout size={16} /></span>
               <h3 className="font-semibold text-emerald-50 tracking-wide text-sm uppercase">Krishi AI Recommendation</h3>
             </div>
             
             <div className="flex-1 mt-2">
               <p className="text-base font-medium leading-relaxed drop-shadow-sm line-clamp-4">
                 {data?.ai_recommendation || "Analyzing farm data for best action..."}
               </p>
             </div>
             
             <button 
               onClick={() => window.location.href = '/dashboard/ai'}
               className="mt-6 w-full py-2.5 bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors shadow-sm"
             >
               Ask AI Assistant
             </button>
           </div>
        </div>
      </div>

      {/* Main Middle Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Predicted Crop / Field Image */}
        <div className="lg:col-span-2 dashboard-card overflow-hidden flex flex-col">
           <div className="relative h-72 w-full">
             <img 
               src="https://images.unsplash.com/photo-1625246333195-78d9c38ad849?q=80&w=1740&auto=format&fit=crop" 
               className="w-full h-full object-cover" 
               alt="Farm Field" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
             <div className="absolute bottom-4 left-6 right-6">
               <h2 className="text-white text-2xl font-bold shadow-sm mb-1">Recommended Cultivation: {data?.predicted_crop ?? '...'}</h2>
               <p className="text-emerald-100 text-sm font-medium">Suitable for {soil} soil type</p>
             </div>
           </div>
           
           <div className="p-6 bg-white dark:bg-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
              <div className="grid grid-cols-3 gap-4 sm:gap-8 w-full sm:w-auto">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide transition-colors">Crop Health</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Excellent
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide transition-colors">Pesticide Use</p>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-1 transition-colors">Low</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide transition-colors">Suggested Sowing</p>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-1 transition-colors">Within 7 days</p>
                </div>
              </div>
              <button className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-600 px-4 py-2 rounded-lg transition-colors bg-emerald-50 dark:bg-emerald-900/20 whitespace-nowrap w-full sm:w-auto text-center">
                Detailed Analysis
              </button>
           </div>
        </div>

        {/* Task List replacing charts for now */}
        <div className="lg:col-span-1 dashboard-card p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 transition-colors">Upcoming Tasks</h3>
            <button className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">View all</button>
          </div>
          
          <div className="space-y-4 flex-1">
            {[
              { name: `Prepare for ${data?.predicted_crop ?? 'Crop'} sowing`, date: 'Tomorrow', due: '1d due', icon: <Tractor size={18} /> },
              { name: 'Watering Plants', date: 'May 8', due: '2d due', icon: <Droplets size={18} /> },
              { name: 'Crop Treatment', date: 'May 10', due: '4d due', icon: <Sprout size={18} /> },
              { name: 'Soil PH Test', date: 'May 15', due: '9d due', icon: <Leaf size={18} /> },
            ].map((task, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 hover:bg-neutral-50 dark:hover:bg-slate-700/50 rounded-xl border border-transparent hover:border-neutral-100 dark:hover:border-slate-600 transition-all group cursor-pointer">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-neutral-400 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                     {task.icon}
                   </div>
                   <div>
                     <p className="text-neutral-900 dark:text-neutral-200 font-semibold text-sm transition-colors">{task.name}</p>
                     <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5 transition-colors">{task.date}</p>
                   </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30 transition-colors">
                    {task.due}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Lower Section: Profit & Community Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        
        {/* Expected Yield & Profit Preview Card */}
        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 transition-colors">
               <TrendingUp className="text-emerald-500" size={20}/> Profit Estimator Overview
            </h3>
            <button className="p-1 rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors"><ChevronRight size={20}/></button>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 transition-colors mb-6">Based on {data?.predicted_crop ?? 'your crop'} market values</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 transition-colors">
               <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1 uppercase">Est. Revenue</p>
               <p className="text-xl font-bold text-emerald-900 dark:text-emerald-300">₹45,000</p>
               <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1">+12% from last season</p>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-slate-700/50 rounded-xl border border-neutral-100 dark:border-slate-600 transition-colors">
               <p className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold mb-1 uppercase">Maintenance Cost</p>
               <p className="text-xl font-bold text-neutral-900 dark:text-neutral-200">₹12,400</p>
               <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">Water, Fertilizer, Labor</p>
            </div>
          </div>
        </div>

        {/* Wiki/Guide Snapshot */}
        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 transition-colors">
               <BookOpen className="text-emerald-500" size={20}/> Farming Guide Highlight
            </h3>
            <button className="p-1 rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors"><ChevronRight size={20}/></button>
          </div>
          
          <div className="flex gap-4 p-4 rounded-xl hover:bg-neutral-50 dark:hover:bg-slate-700/50 border border-transparent hover:border-neutral-100 dark:hover:border-slate-600 transition-colors cursor-pointer group">
             <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
               <img src="https://images.unsplash.com/photo-1592982537447-6f2ea3054f9a?w=400&q=80" alt="Soil Tips" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 transition-colors group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Best Practices for {soil} Soil</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 transition-colors">Learn how to maximize nutrient retention and improve water drainage systems specifically engineered for your local soil type context.</p>
             </div>
          </div>
        </div>

      </div>

    </div>
  );
}
