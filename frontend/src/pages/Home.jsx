import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Wind, BarChart2, Droplet, Star, Users, Mic, MapPin, CloudRain, Sparkles, Send, Sprout, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function Home() {
  const [chatInput, setChatInput] = useState("");

  const scrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f5ee] font-sans overflow-x-hidden relative selection:bg-[#1b3d2f] selection:text-white">
      
      {/* 1. HERO SECTION WITH AUTHENTIC FARM BACKGROUND */}
      <div className="absolute top-0 w-full h-[850px] z-0 pointer-events-none overflow-hidden bg-[#f0f5ee]">
        {/* Authentic Farm Landscape Image perfectly faded into background color using CSS mask */}
        <img 
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2500&auto=format&fit=crop" 
          alt="Lush green farm landscape" 
          className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
          style={{ 
            WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', 
            maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' 
          }}
        />
        {/* Minimal gradient overlays to preserve vibrant colors while fading at the bottom */}
        <div className="absolute inset-0 bg-[#e3f0de]/20 mix-blend-overlay"></div>
      </div>
      
      <Navbar />

      {/* Hero Content */}
      <main className="relative z-10 pt-16 px-4">
        <div className="text-center max-w-4xl mx-auto relative">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-[#1b3d2f] leading-[1.1] tracking-tight mb-6"
          >
            The Future of <span className="text-[#1b3d2f]">Farming</span> <br />
            with <span className="text-[#1b3d2f]">Smart AI</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-[#2a4e3c] mb-10 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-sm"
          >
            Harness the power of hyper-local weather, soil data, and AI for precise farming decisions.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8"
          >
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo('how-it-works')}
              className="px-8 py-3.5 bg-[#1b3d2f] text-white font-semibold rounded-full shadow-xl shadow-[#1b3d2f]/20"
            >
              Try for Free
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo('footer')}
              className="px-8 py-3.5 bg-[#dceecc] text-[#1b3d2f] font-semibold rounded-full border border-[#c1dcab] shadow-sm"
            >
              Talk to an Expert
            </motion.button>
          </motion.div>

        </div>

        {/* Floating Icons Background logic (Absolute positioning) within Hero */}
        <motion.div 
          animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute top-[25%] left-[10%] bg-white/95 p-3.5 rounded-full shadow-md hidden lg:block border border-white/40">
          <Leaf className="w-7 h-7 text-[#1b3d2f]" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }}
          className="absolute top-[40%] left-[5%] bg-white/95 p-2.5 rounded-full shadow-md hidden lg:block border border-white/40">
          <Wind className="w-5 h-5 text-[#1b3d2f]" />
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
          className="absolute top-[30%] right-[12%] bg-white/95 p-3.5 rounded-full shadow-md hidden lg:block border border-white/40">
          <Droplet className="w-6 h-6 text-[#1b3d2f]" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
          className="absolute top-[45%] right-[8%] bg-white/95 p-2.5 rounded-full shadow-md hidden lg:block border border-white/40">
          <Droplet className="w-4 h-4 text-[#1b3d2f]" />
        </motion.div>

        {/* 2. BENTO GRID */}
        <div id="features" className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 px-4 mt-8 pb-32">
          
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            {/* Plant mesh card */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative bg-[#1b3d2f] rounded-[2.5rem] overflow-hidden shadow-xl aspect-[3/4] cursor-pointer group"
            >
              <motion.img 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=800&auto=format&fit=crop" 
                alt="Smart Plant" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1b3d2f] via-[#1b3d2f]/40 to-transparent"></div>
              
              {/* Fake UI Overlay on Plant image */}
              <div className="absolute inset-0 flex flex-col justify-between p-8">
                 <div className="self-end bg-white/10 backdrop-blur-md px-3 py-1 rounded border border-white/20 text-xs text-white/80">
                   Sensors Active
                 </div>
                 <div className="w-full flex justify-between items-end">
                    <div className="h-20 w-[1px] bg-emerald-400/50"></div>
                    <div className="h-32 w-[1px] bg-emerald-400/50"></div>
                 </div>
              </div>
            </motion.div>

            {/* Languages Card */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#def0c6] rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between aspect-square cursor-pointer"
            >
              <div>
                <h3 className="text-[5.5rem] leading-none font-bold text-[#1b3d2f] tracking-tighter mb-4">5+</h3>
                <p className="text-xl text-[#1b3d2f] font-medium leading-snug">
                  Supported Indian <br/>Languages
                </p>
              </div>
              
              <div className="flex items-end justify-between mt-8 relative">
                <div className="grid grid-cols-2 gap-3 w-[70%]">
                  <div className="bg-white/90 px-4 py-2.5 rounded-xl text-center text-sm font-semibold text-[#1b3d2f] shadow-sm flex items-center justify-center">हिंदी</div>
                  <div className="bg-white/60 px-4 py-2.5 rounded-xl text-center text-sm font-semibold text-[#6d4187] shadow-sm flex items-center justify-center">తెలుగు</div>
                  <div className="bg-white/60 px-4 py-2.5 rounded-xl text-center text-sm font-semibold text-[#486380] shadow-sm flex items-center justify-center">मराठी</div>
                  <div className="bg-white/60 px-4 py-2.5 rounded-xl text-center text-sm font-semibold text-[#1b3d2f] shadow-sm flex items-center justify-center">ಕನ್ನಡ</div>
                </div>
                <motion.div 
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="bg-transparent p-1"
                >
                  <Mic className="w-8 h-8 text-[#1b3d2f]" strokeWidth={2.5} />
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-6">
            
            {/* Accuracy Card */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#244234] rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col justify-center aspect-[5/3.2] cursor-pointer"
            >
              <motion.h3 
                whileHover={{ scale: 1.05, originX: 0 }}
                className="text-[4.5rem] leading-none font-bold mb-3 tracking-tighter">
                95%+
              </motion.h3>
              <p className="text-[1.35rem] text-white/90 font-medium mb-8 leading-tight">Advice Accuracy<br/>(Simulated)</p>
              
              <div className="flex items-center text-white/60 text-[0.95rem] font-medium">
                <Users className="w-5 h-5 mr-3" />
                Tested across 10+ regions
              </div>
            </motion.div>

            {/* Real-time Dashboards Card */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white rounded-[2.5rem] p-8 pb-0 shadow-xl flex flex-col relative overflow-hidden aspect-[5/3.8] cursor-pointer group"
            >
               <div className="z-10 relative w-[65%] shrink-0">
                 <h3 className="text-3xl font-bold text-[#1b3d2f] mb-3 leading-tight tracking-tight">Real-time<br/>Dashboards</h3>
                 <p className="text-[#1b3d2f]/70 text-[0.95rem] font-medium leading-snug">
                   Track Weather, Soil & AI recommendations on the go.
                 </p>
               </div>
               
               {/* Dashboard Mockups Simulated */}
               <motion.div 
                 className="absolute -right-6 -bottom-6 w-[65%] h-[90%] flex space-x-2 z-0"
               >
                 {/* Mobile Mockup */}
                 <motion.div 
                    whileHover={{ y: -20, rotate: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-[100px] h-[180px] bg-[#f9f8f4] border-4 border-slate-900 rounded-[1rem] shadow-2xl mt-12 relative overflow-hidden shrink-0 transform -rotate-2"
                 >
                    <div className="h-6 bg-[#ebbe75] w-full mb-2"></div>
                    <div className="px-2 py-1 space-y-2">
                       <div className="h-1.5 w-full bg-[#d5e0ca] rounded"></div>
                       <div className="h-1.5 w-full bg-slate-200 rounded"></div>
                       <div className="h-1.5 w-3/4 bg-slate-200 rounded"></div>
                    </div>
                 </motion.div>
                 {/* Tablet Mockup */}
                 <motion.div 
                    whileHover={{ y: -10, rotate: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="w-[180px] h-[220px] bg-[#f9f8f4] border-4 border-slate-900 rounded-tl-[1rem] rounded-tr-[1rem] shadow-2xl mt-4 relative overflow-hidden transform rotate-1"
                 >
                    <div className="h-[90px] bg-[#d5e0ca] w-full flex items-center justify-center flex-col">
                       <span className="text-[2rem] font-bold text-slate-800 leading-none">28°C</span>
                       <div className="mt-2 text-[0.5rem] text-slate-800 font-bold bg-white/50 px-2 rounded-full">AI Recommendation ↓</div>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2">
                       <div className="h-10 bg-white border border-slate-200 rounded-lg"></div>
                       <div className="h-10 bg-white border border-slate-200 rounded-lg"></div>
                    </div>
                 </motion.div>
               </motion.div>
            </motion.div>

            {/* Optimize Yield Card */}
            <motion.div 
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#1e3c2e] rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl aspect-square flex flex-col justify-between cursor-pointer group"
            >
              <div className="relative w-44 h-[110px] mt-6 mx-auto">
                <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                  <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="#2a4e3c" strokeWidth="12" strokeLinecap="round" />
                  <motion.path 
                    initial={{ strokeDasharray: "0 150" }}
                    whileInView={{ strokeDasharray: "120 150" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    d="M 5 50 A 45 45 0 0 1 70 15" fill="none" stroke="#def0c6" strokeWidth="12" strokeLinecap="round" 
                  />
                </svg>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 z-10">
                  <motion.div 
                    whileHover={{ scale: 1.2, rotate: 180 }}
                    transition={{ duration: 0.5 }}
                    className="bg-[#1e3c2e] p-2.5 rounded-full border-[6px] border-[#1e3c2e]"
                  >
                    <div className="bg-transparent text-[#def0c6]">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 15h12m-6-8v8m-4 0v4m8-4v4m-10-8h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z"/>
                        <circle cx="7" cy="15" r="4"/>
                        <circle cx="17" cy="15" r="4"/>
                      </svg>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="z-10 mt-auto pb-4">
                <h3 className="text-[2.5rem] md:text-[2.8rem] font-bold text-[#def0c6] leading-[1.05] tracking-tight">
                  Optimize <br/>
                  Your Yield, <br/>
                  <span className="opacity-90">Boost Farm <br/>
                  Health</span>
                </h3>
              </div>
              
              <div className="absolute -bottom-4 -right-4 w-16 h-16 transform rotate-45 bg-white/5"></div>
              <Sparkles className="absolute bottom-6 right-6 w-10 h-10 text-white/20 group-hover:text-[#def0c6] transition-colors" strokeWidth={1} />
            </motion.div>

          </div>
        </div>

        {/* 3. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="max-w-[1000px] mx-auto py-20 px-4 border-t border-[#1b3d2f]/10 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-[#1b3d2f] mb-4">How Smart Farming Works</h2>
            <p className="text-lg text-[#395c47] font-medium">Three simple steps to maximize your crop yield and profits.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-white rounded-3xl p-8 shadow-sm flex flex-col items-center text-center cursor-pointer"
            >
              <div className="w-16 h-16 bg-[#def0c6] rounded-full flex items-center justify-center mb-6 text-[#1b3d2f] font-bold text-2xl">1</div>
              <h4 className="text-xl font-bold text-[#1b3d2f] mb-3">Sync Location</h4>
              <p className="text-[#395c47] text-sm leading-relaxed">
                Open the app and allow location access. We instantly pull highly accurate hyper-local weather patterns.
              </p>
              <MapPin className="w-10 h-10 text-[#1b3d2f]/20 mt-6" />
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-white rounded-3xl p-8 shadow-sm flex flex-col items-center text-center cursor-pointer"
            >
              <div className="w-16 h-16 bg-[#def0c6] rounded-full flex items-center justify-center mb-6 text-[#1b3d2f] font-bold text-2xl">2</div>
              <h4 className="text-xl font-bold text-[#1b3d2f] mb-3">Soil & Crop Input</h4>
              <p className="text-[#395c47] text-sm leading-relaxed">
                Answer two simple questions about your soil moisture or let the AI simulate field conditions reliably.
              </p>
              <CloudRain className="w-10 h-10 text-[#1b3d2f]/20 mt-6" />
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-white rounded-3xl p-8 shadow-sm flex flex-col items-center text-center cursor-pointer"
            >
              <div className="w-16 h-16 bg-[#def0c6] rounded-full flex items-center justify-center mb-6 text-[#1b3d2f] font-bold text-2xl">3</div>
              <h4 className="text-xl font-bold text-[#1b3d2f] mb-3">Get AI Advice</h4>
              <p className="text-[#395c47] text-sm leading-relaxed">
                Receive direct, actionable advice in your local language—"Irrigate now", "Wait for rain", or "Apply Fertilizer".
              </p>
              <Sprout className="w-10 h-10 text-[#1b3d2f]/20 mt-6" />
            </motion.div>
          </div>
        </section>

        {/* 4. SMART AI ASSISTANT DEMO PROMPT */}
        <section id="ai-assistant" className="max-w-[1000px] mx-auto py-10 px-4 mb-20 relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01 }}
            className="bg-[#1b3d2f] rounded-[2.5rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden"
          >
             
             {/* Background glow logic inside CTA */}
             <div 
               className="absolute top-0 right-0 w-64 h-64 bg-[#def0c6] rounded-full mix-blend-overlay filter blur-3xl opacity-20 pointer-events-none"
             ></div>

             <div className="md:w-1/2 mb-10 md:mb-0 z-10 pr-0 md:pr-10">
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4 tracking-tight">
                  Meet Your <br/>Personal <span className="text-[#def0c6]">Farm Expert</span>
                </h2>
                <p className="text-[#e2ecdd] font-medium mb-8">
                  Available 24/7. Ask questions in your mother tongue and get simplified, highly accurate farming advice.
                </p>
                <div className="flex space-x-3">
                  <div className="bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">Profit Estimator</div>
                  <div className="bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">Crop Recommender</div>
                </div>
             </div>

             <div className="md:w-1/2 w-full z-10">
               <motion.div 
                 whileHover={{ scale: 1.02 }}
                 className="bg-white rounded-2xl p-2 pl-6 flex items-center justify-between shadow-xl"
               >
                 <input 
                   type="text" 
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                        alert("Krishi AI Backend not connected yet! You asked: " + chatInput);
                        setChatInput("");
                     }
                   }}
                   placeholder="Ask Krishi AI anything..." 
                   className="w-full text-[#1b3d2f] font-medium outline-none bg-transparent placeholder-[#1b3d2f]/40"
                 />
                 <motion.button 
                   whileHover={{ scale: 1.1 }}
                   whileTap={{ scale: 0.9 }}
                   onClick={() => {
                     if (chatInput) {
                        alert("Krishi AI Backend not connected yet! You asked: " + chatInput);
                        setChatInput("");
                     }
                   }}
                   className="bg-[#1b3d2f] p-4 rounded-xl text-white hover:bg-[#153422] transition-colors shadow-md"
                 >
                   <Send className="w-5 h-5" />
                 </motion.button>
               </motion.div>
               
               {/* Quick demo pills */}
               <div className="mt-4 flex flex-wrap gap-2">
                 <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setChatInput("Which crop is best for me?")}
                   className="bg-white/10 hover:bg-white/20 text-white/90 text-sm px-4 py-2 rounded-lg backdrop-blur-sm transition-colors border border-white/10"
                 >
                   "Which crop is best for me?"
                 </motion.button>
                 <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => setChatInput("Should I water my field today?")}
                   className="bg-white/10 hover:bg-white/20 text-white/90 text-sm px-4 py-2 rounded-lg backdrop-blur-sm transition-colors border border-white/10"
                 >
                   "Should I water my field today?"
                 </motion.button>
               </div>
             </div>
          </motion.div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
