import React, { useContext } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Layers, Mic, Image as ImageIcon, Video } from 'lucide-react';
import { StudioContext } from './context/StudioContext';

import VoiceStudio from './pages/VoiceStudio';
import ImageStudio from './pages/ImageStudio';
import VideoStudio from './pages/VideoStudio';

export default function App() {
  const { hfToken, setHfToken } = useContext(StudioContext);

  return (
    <div className="min-h-screen p-4 md:p-8 relative flex flex-col items-center">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00f3ff] rounded-full blur-[200px] opacity-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#b026ff] rounded-full blur-[200px] opacity-10" />
      </div>

      <div className="w-full max-w-7xl">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-black/40 p-6 rounded-3xl border border-[#333] backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black border border-[#00f3ff] rounded-xl neon-border-cyan">
              <Layers className="w-8 h-8 text-[#00f3ff]" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-widest text-white neon-text-cyan flex items-center gap-3">
                Neon <span className="text-[#b026ff] neon-text-purple">Studio</span>
              </h1>
              <p className="text-[#888] font-mono text-xs tracking-widest mt-1">Unified AI Hub: Voice, Image & Video</p>
            </div>
          </div>
          
          <div className="flex bg-black border border-[#333] rounded-xl p-1 w-full md:w-auto">
            <NavLink
              to="/voice"
              className={({ isActive }) => `flex-1 md:flex-none px-8 py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                isActive 
                ? 'bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/50 shadow-[0_0_15px_rgba(0,243,255,0.3)]' 
                : 'text-[#666] hover:text-white border border-transparent'
              }`}
            >
              <Mic className="w-4 h-4" /> Voice
            </NavLink>
            <NavLink
              to="/video"
              className={({ isActive }) => `flex-1 md:flex-none px-8 py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                isActive 
                ? 'bg-[#ffe600]/20 text-[#ffe600] border border-[#ffe600]/50 shadow-[0_0_15px_rgba(255,230,0,0.3)]' 
                : 'text-[#666] hover:text-white border border-transparent'
              }`}
            >
              <Video className="w-4 h-4" /> Video
            </NavLink>
            <NavLink
              to="/image"
              className={({ isActive }) => `flex-1 md:flex-none px-8 py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                isActive 
                ? 'bg-[#b026ff]/20 text-[#b026ff] border border-[#b026ff]/50 shadow-[0_0_15px_rgba(176,38,255,0.3)]' 
                : 'text-[#666] hover:text-white border border-transparent'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Image
            </NavLink>
          </div>
        </div>

        {/* Global Token Input */}
        <div className="mb-8 p-4 bg-black/60 border border-[#222] rounded-2xl flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:w-1/3">
            <label className="block text-xs font-bold text-[#666] uppercase mb-1">Global Hugging Face Token</label>
            <input
              type="password"
              value={hfToken}
              onChange={(e) => setHfToken(e.target.value)}
              placeholder="hf_..."
              className="w-full bg-black border border-[#333] text-white p-3 rounded-xl focus:outline-none focus:border-[#00f3ff] font-mono text-xs"
            />
          </div>
          <p className="text-[#555] text-[10px] font-mono uppercase max-w-md">
            Providing a token unlocks faster image generation (FLUX.1) and bypasses strict rate limits on public Hugging Face spaces.
          </p>
        </div>

        {/* Routed Pages */}
        <Routes>
          <Route path="/" element={<Navigate to="/voice" replace />} />
          <Route path="/voice" element={<VoiceStudio />} />
          <Route path="/image" element={<ImageStudio />} />
          <Route path="/video" element={<VideoStudio />} />
        </Routes>

      </div>
    </div>
  );
}
