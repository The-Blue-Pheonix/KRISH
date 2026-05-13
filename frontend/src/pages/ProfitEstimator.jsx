import React, { useEffect, useMemo, useState } from 'react';
import { fetchProfitEstimate } from '../services/api';
import { DollarSign, Loader2 } from 'lucide-react';

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '--';
  return `₹${Number(value).toLocaleString('en-IN')}`;
};

export default function ProfitEstimator() {
  const [city, setCity] = useState('');
  const [soil, setSoil] = useState('');
  const [crop, setCrop] = useState('');
  const [area, setArea] = useState(1.0);
  const [marketPrice, setMarketPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCity(localStorage.getItem('farmCity') || 'Kolkata');
    setSoil(localStorage.getItem('farmSoil') || 'Alluvial');
    setCrop(localStorage.getItem('farmCrop') || 'Rice');
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProfitEstimate(
        city,
        soil,
        crop,
        area,
        marketPrice
      );
      setEstimate(result);
    } catch (err) {
      setError('Unable to fetch profit estimate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const breakdown = useMemo(() => {
    if (!estimate?.cost_breakdown) return null;
    return estimate.cost_breakdown;
  }, [estimate]);

  return (
    <div className="space-y-6">
      <div className="dashboard-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Profit Estimator Studio</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Fast deterministic estimates using MSP prices.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full mt-2 p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg font-medium"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Soil Type</label>
            <select
              value={soil}
              onChange={(e) => setSoil(e.target.value)}
              className="w-full mt-2 p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg font-medium"
            >
              <option value="Alluvial">Alluvial</option>
              <option value="Laterite">Laterite</option>
              <option value="Black">Black</option>
              <option value="Red">Red</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Crop</label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full mt-2 p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg font-medium"
            >
              <option value="Rice">Rice</option>
              <option value="Wheat">Wheat</option>
              <option value="Cotton">Cotton</option>
              <option value="Corn">Corn</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Land Area (Acres)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="w-full mt-2 p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg font-medium"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Local Market Price (Optional)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={marketPrice}
              onChange={(e) => setMarketPrice(e.target.value)}
              className="w-full mt-2 p-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg font-medium"
              placeholder="Overrides MSP"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Calculate Profit'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {estimate && (
        <div className="dashboard-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Gross Revenue</p>
              <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-2">{formatCurrency(estimate.gross_revenue)}</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Total Cost</p>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-2">{formatCurrency(estimate.total_cost)}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Net Profit</p>
              <p className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-2">{formatCurrency(estimate.net_profit)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Expected Yield</p>
              <p className="text-lg font-black text-neutral-800 dark:text-neutral-100 mt-2">{estimate.expected_yield_quintals} qtl</p>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">ROI</p>
              <p className="text-lg font-black text-neutral-800 dark:text-neutral-100 mt-2">{estimate.roi_percent}%</p>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Breakeven Yield</p>
              <p className="text-lg font-black text-neutral-800 dark:text-neutral-100 mt-2">{estimate.breakeven_yield} qtl</p>
            </div>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
            <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Cost Breakdown
            </div>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {breakdown ? (
                ["seed", "fertilizer", "pesticide", "labor", "irrigation"].map((key) => (
                  <div key={key} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="capitalize text-neutral-600 dark:text-neutral-300">{key}</span>
                    <span className="font-bold text-neutral-800 dark:text-neutral-100">{formatCurrency(breakdown[key])}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">Cost breakdown unavailable.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
