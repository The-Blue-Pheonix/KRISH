import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PlaceholderPage from './pages/PlaceholderPage';
import AIAssistant from './pages/AIAssistant';
import ProtectedRoute from './components/ProtectedRoute';
import { supabase } from './services/supabaseClient';

// Dashboard imports
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import FarmingGuide from './pages/FarmingGuide';
import FarmMap from './pages/FarmMap';
import CropInsights from './pages/CropInsights';
import ProfitEstimator from './pages/ProfitEstimator';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session on app load
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect home to dashboard if authenticated */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <Home />} 
        />
        
        {/* Redirect to dashboard if already logged in */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" replace /> : <Signup />} 
        />
        
        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="ai" element={<AIAssistant />} />
          <Route path="farm" element={<FarmMap />} />
          <Route path="crops" element={<CropInsights />} />
          <Route path="profit" element={<ProfitEstimator />} />
          <Route path="guide" element={<FarmingGuide />} />
          <Route path="settings" element={<PlaceholderPage title="Account Settings" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
