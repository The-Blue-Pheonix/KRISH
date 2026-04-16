import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PlaceholderPage from './pages/PlaceholderPage';
import AIAssistant from './pages/AIAssistant';

// Dashboard imports
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="ai" element={<AIAssistant />} />
          <Route path="farm" element={<PlaceholderPage title="Your Farm Map" />} />
          <Route path="crops" element={<PlaceholderPage title="Crop Insights & Health" />} />
          <Route path="profit" element={<PlaceholderPage title="Profit Estimator Studio" />} />
          <Route path="guide" element={<PlaceholderPage title="Farming Wiki Guide" />} />
          <Route path="settings" element={<PlaceholderPage title="Account Settings" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
