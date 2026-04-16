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
  Map as MapIcon,
  Loader2
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
      setError("Connecting to backend failed. To get real AI data, run: uvicorn app.main:app");
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
  }, [location?.latitude, location?.longitude]); // Also trigger a load when GPS stabilizes

  const handleApplyParams = (e) => {
    e.preventDefault();
    loadData();
  };

  if (loading && !data) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Sprout className="text-emerald-600 dark:text-emerald-400 animate-spin" size={48} />
        <p className="text-neutral-600 dark:text-neutral-400 font-medium">Fetching farm analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. HERO BANNER */}
      <div className="relative w-full rounded-2xl overflow-visible shadow-sm h-auto md:h-56 flex flex-col justify-between z-20">
        {/* Farm Background Image with solid Greenery overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=1740&auto=format&fit=crop')] bg-cover bg-center rounded-2xl overflow-hidden"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-emerald-800/80 to-transparent rounded-2xl overflow-hidden"></div>
        
        {/* Banner Content */}
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between h-full">
          <div className="mb-6 md:mb-0">
            <div className="inline-flex items-center gap-1.5 bg-white/20 text-emerald-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-3">
              <Sprout size={14} /> Farm Overview
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md">Good Morning! 👋</h1>
            <p className="text-emerald-100 text-sm md:text-base mt-2 font-medium max-w-lg">
              Manage your agricultural operations efficiently with professional insights and AI field optimization.
            </p>
          </div>
          
          {/* Quick Location Settings inside Banner */}
          <form onSubmit={handleApplyParams} className="bg-white p-2 rounded-xl flex items-center gap-2 shadow-lg w-full md:w-auto overflow-visible relative">
            
            <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg whitespace-nowrap">
               <div className="relative flex items-center">
                 {geoLoading && <Loader2 className="absolute -left-6 animate-spin text-emerald-600" size={14} />}
                 <MapPin size={16} className={geoError ? 'text-red-500' : 'text-emerald-600'} />
               </div>
               <input 
                 type="text" 
                 value={city}
                 onChange={(e) => setCity(e.target.value)}
                 className="bg-transparent border-none text-neutral-800 font-bold focus:ring-0 w-20 md:w-24 text-sm p-0 placeholder-neutral-400"
                 placeholder="City"
                 title={geoError ? `GPS Error: ${geoError}` : location ? `GPS detected: ${location.fullAddress}` : 'Enable GPS for location'}
               />
            </div>

            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg whitespace-nowrap overflow-visible">
                 {soilLoading && <Loader2 className="animate-spin text-emerald-600" size={14} />}
                 {!soilLoading && <MapIcon size={16} className="text-emerald-600" />}
                 <select 
                   value={soil}
                   onChange={(e) => setSoil(e.target.value)}
                   className="bg-transparent border-none text-neutral-800 font-bold focus:ring-0 text-sm p-0 pr-6"
                   title={`Detected: ${recommendedSoil} (click to change)`}
                 >
                   <option value="Alluvial">Alluvial</option>
                   <option value="Laterite">Laterite</option>
                   <option value="Black">Black</option>
                   <option value="Red">Red</option>
                   <option value="Terai">Terai</option>
                 </select>
              </div>
              <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                📍 Auto-detected: <strong>{recommendedSoil}</strong>
              </div>
            </div>

            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors ml-1">
              Apply
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm border border-red-200 flex items-center gap-2 mt-4 font-medium dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {geoError && !location && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-200 flex items-center gap-2 font-medium dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-300">
          <AlertCircle size={18} />
          📍 GPS Access: {geoError}. You can manually select your location above.
        </div>
      )}

      {/* 2. CORE METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Weather Card */}
        <div className="dashboard-card p-6 border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-neutral-800 dark:text-neutral-100 font-bold">Local Climate</h3>
             <div className="px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-md text-xs font-bold border border-emerald-100 dark:border-emerald-800">
               {data?.location ?? city}
             </div>
          </div>
          
          <div className="flex items-center justify-between my-2">
             <div className="flex items-baseline gap-1">
               <span className="text-5xl font-black text-neutral-900 dark:text-white">{data?.weather?.temperature ?? '--'}°</span>
             </div>
             <CloudSun size={48} className="text-amber-500" strokeWidth={1.5} />
          </div>

          <div className="mt-6 flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
             <div className="flex items-center gap-2 bg-neutral-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg w-full">
               <Droplets size={16} className="text-blue-500"/> 
               {data?.weather?.humidity ?? '--'}% Hum
             </div>
             <div className="flex items-center gap-2 bg-neutral-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg w-full">
               <Wind size={16} className="text-emerald-500"/> 
               {data?.weather?.rainfall ?? '--'}mm Rain
             </div>
          </div>
        </div>

        {/* Soil Health Action */}
        <div className="dashboard-card p-6 border-t-4 border-t-blue-500 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-neutral-800 dark:text-neutral-100 font-bold">Soil & Irrigation</h3>
             <Target className="text-blue-500" size={20} />
          </div>
          
          <div className="space-y-3 mt-auto">
            {/* Condition Row */}
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/30">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-white dark:bg-slate-800 shadow-sm border border-blue-100 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400">
                   <Leaf size={18} />
                 </div>
                 <div>
                   <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-0.5">Moisture Level</p>
                   <p className="text-lg font-black text-blue-900 dark:text-blue-300">{data?.soil_condition ?? '--'}</p>
                 </div>
               </div>
            </div>

            {/* Irrigation Row */}
            <div className={`flex items-center justify-between p-3 rounded-xl border ${data?.irrigation === 'Yes' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30'}`}>
               <div className="flex items-center gap-3">
                 <div className={`p-2 bg-white dark:bg-slate-800 shadow-sm border rounded-lg ${data?.irrigation === 'Yes' ? 'border-amber-100 text-amber-600' : 'border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'}`}>
                   <CheckCircle2 size={18} />
                 </div>
                 <div>
                   <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${data?.irrigation === 'Yes' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>Recommended Action</p>
                   <p className={`text-lg font-black ${data?.irrigation === 'Yes' ? 'text-amber-900 dark:text-amber-300' : 'text-emerald-900 dark:text-emerald-300'}`}>
                     {data?.irrigation === 'Yes' ? 'Irrigate Field' : (data?.irrigation === 'No' ? 'Do Not Water' : 'Monitor')}
                   </p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* AI Recommendation Spotlight */}
        <div className="dashboard-card p-6 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 flex flex-col w-full md:col-span-2 lg:col-span-1 shadow-inner">
           <div className="flex items-center gap-2 mb-3">
             <span className="p-1.5 bg-emerald-200 dark:bg-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300"><Sprout size={16} /></span>
             <h3 className="font-bold text-emerald-900 dark:text-emerald-100">AI Farm Advisor</h3>
           </div>
           
           <div className="flex-1 my-2 bg-white dark:bg-slate-800 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 relative shadow-sm">
             <div className="absolute top-4 -left-2 w-4 h-4 bg-white dark:bg-slate-800 border-l border-b border-emerald-100 dark:border-emerald-800/50 rotate-45"></div>
             <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 leading-relaxed relative z-10 line-clamp-4">
               {data?.ai_recommendation || "Analyzing farm data to generate best action..."}
             </p>
           </div>
           
           <button 
             onClick={() => window.location.href = '/dashboard/ai'}
             className="mt-4 w-full py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
           >
             Open Smart Chat <ChevronRight size={16}/>
           </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Recommended Crop Deep Dive */}
        <div className="lg:col-span-2 dashboard-card border-none overflow-hidden flex flex-col shadow-md">
           <div className="relative h-64 w-full bg-neutral-100">
             <img 
               src="https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=1600&auto=format&fit=crop" 
               className="w-full h-full object-cover" 
               alt="Suggested Crop Image" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/20 to-transparent"></div>
             <div className="absolute bottom-6 left-6 right-6">
               <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider mb-2 inline-block">Top Recommendation</div>
               <h2 className="text-white text-3xl font-black drop-shadow-lg">{data?.predicted_crop ?? '...'} Cultivation</h2>
               <p className="text-emerald-100 text-sm font-medium mt-1 flex items-center gap-1.5"><MapIcon size={14}/> Highly viable for {soil} soil profiles in this climate</p>
             </div>
           </div>
           
           <div className="p-6 bg-white dark:bg-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full md:w-auto">
                <div className="bg-neutral-50 dark:bg-slate-700/30 p-3 rounded-lg border border-neutral-100 dark:border-slate-600">
                  <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Crop Health</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Optimal
                  </p>
                </div>
                <div className="bg-neutral-50 dark:bg-slate-700/30 p-3 rounded-lg border border-neutral-100 dark:border-slate-600">
                  <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Growth Phase</p>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-1">Sowing</p>
                </div>
                <div className="bg-neutral-50 dark:bg-slate-700/30 p-3 rounded-lg border border-neutral-100 dark:border-slate-600 col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Sowing Timeline</p>
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-1">Within 7 days</p>
                </div>
              </div>
              <button 
                onClick={() => window.location.href='/dashboard/crops'} 
                className="text-sm font-bold text-emerald-700 dark:text-emerald-400 border-2 border-emerald-600 dark:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-6 py-3 rounded-xl transition-colors w-full md:w-auto mt-2 md:mt-0"
              >
                Full Crop Overview
              </button>
           </div>
        </div>

        {/* Task List */}
        <div className="lg:col-span-1 dashboard-card p-0 flex flex-col h-full bg-white dark:bg-slate-800 border-neutral-200 dark:border-slate-700">
          <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-slate-700">
            <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100">Upcoming Tasks</h3>
            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">4 Active</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {[
              { name: `Prepare for ${data?.predicted_crop ?? 'Crop'} sowing`, date: 'Tomorrow', due: '1d due', icon: <Tractor size={18} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' },
              { name: 'Watering Plants', date: 'May 8', due: '2d due', icon: <Droplets size={18} />, color: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30' },
              { name: 'Crop Treatment', date: 'May 10', due: '4d due', icon: <Sprout size={18} />, color: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30' },
              { name: 'Soil PH Test', date: 'May 15', due: '9d due', icon: <Leaf size={18} />, color: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/30' },
            ].map((task, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-700/50 rounded-xl border border-neutral-100 dark:border-slate-700 shadow-sm cursor-pointer transition-colors group">
                <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${task.color}`}>
                     {task.icon}
                   </div>
                   <div>
                     <p className="text-neutral-900 dark:text-neutral-200 font-bold text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{task.name}</p>
                     <p className="text-neutral-500 dark:text-neutral-400 font-medium text-xs mt-0.5">{task.date}</p>
                   </div>
                </div>
                <div className="mt-3 sm:mt-0 text-right">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400">
                    {task.due}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-neutral-100 dark:border-slate-700">
             <button className="w-full py-2 text-sm font-bold text-neutral-500 hover:text-emerald-600 transition-colors">View Complete Schedule</button>
          </div>
        </div>

      </div>

      {/* 4. LOWER METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* Expected Yield & Profit Preview Card */}
        <div className="dashboard-card p-6 border-l-4 border-l-amber-400">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
               <TrendingUp className="text-amber-500" size={20}/> Profit Estimator Overview
            </h3>
            <button className="p-1 rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors"><ChevronRight size={20}/></button>
          </div>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-6">Based on {data?.predicted_crop ?? 'your crop'} current market futures</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
               <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mb-1 uppercase tracking-widest">Est. Revenue</p>
               <p className="text-2xl font-black text-emerald-900 dark:text-emerald-300">₹45,000</p>
               <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 mt-2 bg-emerald-100 dark:bg-emerald-800/50 inline-block px-2 py-0.5 rounded-sm">+12% vs LY</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800/30">
               <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mb-1 uppercase tracking-widest">Maintenance Cost</p>
               <p className="text-2xl font-black text-amber-900 dark:text-amber-300">₹12,400</p>
               <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 mt-2 bg-amber-100 dark:bg-amber-800/50 inline-block px-2 py-0.5 rounded-sm">Includes Labor</p>
            </div>
          </div>
        </div>

        {/* Wiki/Guide Snapshot */}
        <div className="dashboard-card p-6 border-l-4 border-l-blue-400">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
               <BookOpen className="text-blue-500" size={20}/> Farming Guide Highlight
            </h3>
            <button className="p-1 rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors"><ChevronRight size={20}/></button>
          </div>
          
          <div className="flex gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 transition-colors cursor-pointer group">
             <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-neutral-200 dark:border-slate-700">
               <img src="https://images.unsplash.com/photo-1592982537447-6f2ea3054f9a?w=400&q=80" alt="Soil Tips" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div>
                <h4 className="text-sm font-black text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Best Practices for {soil} Soil</h4>
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed line-clamp-2">Master techniques to maximize nutrient retention and build engineered water drainage systems for your local soil type.</p>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-2 inline-block uppercase tracking-wider">Read Full Article &rarr;</span>
             </div>
          </div>
        </div>

      </div>

    </div>
  );
}
