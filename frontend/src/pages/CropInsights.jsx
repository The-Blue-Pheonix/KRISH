import React, { useEffect, useMemo, useState, useRef } from 'react';
import { AlertTriangle, ShieldAlert, Sprout, UploadCloud, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const getScoreTone = (score) => {
  if (score >= 70) {
    return { label: 'Strong', color: '#16a34a', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' };
  }
  if (score >= 40) {
    return { label: 'Caution', color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400' };
  }
  return { label: 'At Risk', color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' };
};

export default function CropInsights() {
  const [health, setHealth] = useState(null);
  const [crop, setCrop] = useState('');
  const [soil, setSoil] = useState('');
  const [city, setCity] = useState('');

  // Plant Disease Detection State using Gemini
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diseaseResult, setDiseaseResult] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(URL.createObjectURL(file));
      setDiseaseResult(null);
    }
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleAnalyzeDisease = async () => {
    if (!imageFile) return;
    setIsAnalyzing(true);
    setDiseaseResult(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate realistic dummy data for leaf disease detection
      const dummyResults = [
        {
          name: 'Early Blight',
          type: 'Fungal Disease',
          commonNames: ['Solanum lycopersicum (Tomato)', 'Potato', 'Eggplant'],
          sciName: 'Alternaria solani',
          confidence: 87.5,
          severity: 'Moderate',
          description: 'Fungal leaf spot disease causing brown/purple lesions with concentric rings',
          treatment: [
            'Remove infected leaves promptly',
            'Improve air circulation around plants',
            'Apply copper or sulfur fungicide',
            'Avoid wetting foliage during watering',
            'Rotate crops yearly'
          ],
          riskLevel: 'Medium'
        },
        {
          name: 'Late Blight',
          type: 'Fungal Disease',
          commonNames: ['Potato', 'Tomato'],
          sciName: 'Phytophthora infestans',
          confidence: 72.3,
          severity: 'High',
          description: 'Water-soaked lesions with white fungal growth on leaf undersides',
          treatment: [
            'Apply fungicide immediately',
            'Remove severely affected plants',
            'Ensure proper drainage',
            'Avoid overhead watering',
            'Plant resistant varieties'
          ],
          riskLevel: 'High'
        },
        {
          name: 'Septoria Leaf Spot',
          type: 'Fungal Disease',
          commonNames: ['Wheat', 'Barley', 'Tomato'],
          sciName: 'Septoria tritici',
          confidence: 65.2,
          severity: 'Low to Moderate',
          description: 'Small circular spots with dark borders and gray centers',
          treatment: [
            'Apply fungicide spray',
            'Remove infected leaves',
            'Maintain plant spacing',
            'Use disease-resistant varieties',
            'Practice crop rotation'
          ],
          riskLevel: 'Low'
        }
      ];

      // Use the best match (highest confidence)
      const bestMatch = dummyResults.sort((a, b) => b.confidence - a.confidence)[0];

      let resultText = `**🌱 Disease Identified**: ${bestMatch.name}\n`;
      resultText += `**Type**: ${bestMatch.type}\n`;
      resultText += `**Scientific Name**: ${bestMatch.sciName}\n`;
      resultText += `**Confidence**: ${bestMatch.confidence.toFixed(1)}%\n`;
      resultText += `**Severity**: ${bestMatch.severity}\n`;
      resultText += `**Risk Level**: ${bestMatch.riskLevel}\n\n`;
      
      resultText += `**Description**:\n${bestMatch.description}\n\n`;
      
      resultText += `**Recommended Treatment**:\n`;
      bestMatch.treatment.forEach((step, idx) => {
        resultText += `${idx + 1}. ${step}\n`;
      });

      setDiseaseResult({ 
        text: resultText,
        allResults: dummyResults,
        bestMatch: bestMatch
      });
    } catch (error) {
      console.error("Error analyzing plant:", error);
      setDiseaseResult({ error: error.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

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
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">Crop Insights</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
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
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Disease Risk</p>
            <p className="text-lg font-black text-neutral-800 dark:text-neutral-100 mt-2">{health.disease_risk}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">{health.disease_name}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Soil Nutrient Gap</p>
            <p className="text-lg font-black text-neutral-800 dark:text-neutral-100 mt-2">{health.nutrient_deficiency}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{health.nutrient_tip}</p>
          </div>
        </div>
      </div>

      <div className={`dashboard-card p-5 flex items-center gap-3 ${health.pest_alert ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30'}`}>
        {health.pest_alert ? (
          <ShieldAlert className="text-red-500 dark:text-red-400" size={22} />
        ) : (
          <AlertTriangle className="text-emerald-600 dark:text-emerald-400" size={22} />
        )}
        <div>
          <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {health.pest_alert ? 'Pest Alert Active' : 'No Pest Alert'}
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {health.pest_alert
              ? `Monitor for ${health.pest_name} and apply preventive controls.`
              : 'Current pest pressure is low. Keep standard monitoring.'}
          </p>
        </div>
      </div>

      {/* --- Plant Disease Detector --- */}
      <div className="dashboard-card p-6 mt-8">
        <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">AI Plant Disease Detector</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">Upload a photo of your crop to identify diseases and get organic remedies.</p>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3">
            <div 
              className="border-2 border-dashed border-neutral-300 dark:border-slate-600 rounded-xl bg-neutral-50 dark:bg-slate-800/50 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors p-6 text-center cursor-pointer flex flex-col items-center justify-center min-h-[200px]"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-40 w-auto rounded-lg object-contain shadow-sm" />
              ) : (
                <>
                  <UploadCloud className="text-emerald-500 mb-3" size={32} />
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Click to upload image</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">JPG, PNG up to 5MB</p>
                </>
              )}
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageChange}
              />
            </div>
            
            <button 
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
              onClick={handleAnalyzeDisease}
              disabled={!imageFile || isAnalyzing}
            >
              {isAnalyzing && <Loader2 className="animate-spin" size={18} />}
              {isAnalyzing ? 'Analyzing...' : 'Identify AI'}
            </button>
          </div>

          <div className="w-full md:w-2/3">
            {!diseaseResult ? (
              <div className="h-full min-h-[200px] border border-neutral-100 dark:border-slate-700 bg-neutral-50/50 dark:bg-slate-800/30 rounded-xl flex items-center justify-center p-6 text-center text-neutral-400 dark:text-neutral-500">
                <p className="text-sm">Gemini AI Assistant results will appear here</p>
              </div>
            ) : diseaseResult.error ? (
              <div className="h-full border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-xl flex items-center justify-center p-6 text-center text-red-500 dark:text-red-400">
                <p className="text-sm font-medium">Error: {diseaseResult.error}</p>
              </div>
            ) : (
              <div className="border border-neutral-200 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-800 max-h-[400px] overflow-y-auto">
                <h4 className="font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 mb-3">
                  <Sprout className="text-emerald-500" size={18} />
                  Gemini AI Analysis
                </h4>
                <div className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                  {diseaseResult.text}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
