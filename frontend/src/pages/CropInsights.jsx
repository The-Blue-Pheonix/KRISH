import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ShieldAlert, Sprout } from 'lucide-react';

const getScoreTone = (score) => {
  if (score >= 70) {
    return { label: 'Strong', color: '#16a34a', bg: 'bg-emerald-50', text: 'text-emerald-700' };
  }
  if (score >= 40) {
    return { label: 'Caution', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' };
  }
  return { label: 'At Risk', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700' };
};

export default function CropInsights() {
  const [health, setHealth] = useState(null);
  const [crop, setCrop] = useState('');
  const [soil, setSoil] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    const savedHealth = localStorage.getItem('cropHealth');
    const savedCrop = localStorage.getItem('farmCrop') || '';
    const savedSoil = localStorage.getItem('farmSoil') || '';
    const savedCity = localStorage.getItem('farmCity') || '';

    setCrop(savedCrop);
    setSoil(savedSoil);
    setCity(savedCity);

    if (savedHealth) {
      try {
        setHealth(JSON.parse(savedHealth));
      } catch (error) {
        setHealth(null);
      }
    }
  }, []);

  const score = useMemo(() => {
    if (!health) return 0;
    return health.score ?? health.health_score ?? 0;
  }, [health]);

  const tone = useMemo(() => getScoreTone(score), [score]);
  const ringStyle = useMemo(() => {
    const safeScore = Math.max(0, Math.min(score, 100));
    return {
      background: `conic-gradient(${tone.color} ${safeScore * 3.6}deg, #e5e7eb 0deg)`,
    };
  }, [score, tone.color]);

  if (!health) {
    return (
      <div className="dashboard-card p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <Sprout size={22} />
        </div>
        <h2 className="text-xl font-bold text-neutral-800 mb-2">Crop Insights</h2>
        <p className="text-sm text-neutral-500">
          Run a prediction on the dashboard to unlock live crop health insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-card p-6 flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex items-center gap-6">
          <div className="relative w-36 h-36 rounded-full p-2" style={ringStyle}>
            <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-neutral-900 dark:text-white">{score}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Score</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Overall Health</p>
            <p className={`text-2xl font-black ${tone.text}`}>{tone.label}</p>
            <p className="text-sm text-neutral-500 mt-2">
              {crop ? `${crop} crop` : 'Crop'} in {soil || 'selected'} soil • {city || 'Farm'}
            </p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className={`rounded-xl border p-4 ${tone.bg} border-transparent`}>
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Disease Risk</p>
            <p className="text-lg font-black text-neutral-800 mt-2">{health.disease_risk}</p>
            <p className="text-sm text-neutral-600 mt-1">{health.disease_name}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Soil Nutrient Gap</p>
            <p className="text-lg font-black text-neutral-800 dark:text-neutral-100 mt-2">{health.nutrient_deficiency}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{health.nutrient_tip}</p>
          </div>
        </div>
      </div>

      <div className={`dashboard-card p-5 flex items-center gap-3 ${health.pest_alert ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
        {health.pest_alert ? (
          <ShieldAlert className="text-red-500" size={22} />
        ) : (
          <AlertTriangle className="text-emerald-600" size={22} />
        )}
        <div>
          <p className="text-sm font-bold text-neutral-900">
            {health.pest_alert ? 'Pest Alert Active' : 'No Pest Alert'}
          </p>
          <p className="text-xs text-neutral-600">
            {health.pest_alert
              ? `Monitor for ${health.pest_name} and apply preventive controls.`
              : 'Current pest pressure is low. Keep standard monitoring.'}
          </p>
        </div>
      </div>
    </div>
  );
}
