import React, { useState, useRef, useContext } from 'react';
import { Film, Upload, Sparkles, Loader2, Download, Image as ImageIcon } from 'lucide-react';
import { Client } from "@gradio/client";
import { StudioContext } from '../context/StudioContext';

export const VIDEO_STYLES = [
  "Cyberpunk neon style, cinematic camera pan",
  "Studio Ghibli style animation, magical atmosphere",
  "8-bit retro game pixel art, scrolling background",
  "Photorealistic 8k, slow motion tracking shot",
  "Watercolor painting coming to life, fluid dynamics",
  "Vaporwave aesthetic, VHS glitch effects",
  "Dark fantasy, glowing runes, dramatic zoom",
  "Synthwave 80s grid, driving forward",
  "Oil painting style, thick brush strokes moving",
  "Claymation stop motion style",
  "Pencil sketch animation, rough lines",
  "Anime opening style, dynamic action blur",
  "Sci-fi spaceship interior, glowing panels, camera shake",
  "Steampunk gears turning, steam particles",
  "Low poly 3D render, smooth rotation",
  "Pop art comic book style, halftone dots",
  "Neon wireframe rotating",
  "Cinematic drone flyover, 4k resolution",
  "Macro photography, depth of field shift",
  "Glitch art, data moshing effects",
  "Vintage 1920s film reel, scratches and dust",
  "Surreal Salvador Dali style melting effect",
  "Abstract geometric shapes morphing",
  "Bioluminescent deep sea atmosphere",
  "Holographic projection flickering",
  "Gothic horror, fog rolling in",
  "Retro anime 90s style, VHS filter",
  "Cybernetic augmentation scanning effect",
  "Ethereal ghost-like transparency",
  "Kaleidoscope repeating patterns",
  "Origami folding and unfolding",
  "Stained glass window catching light",
  "Neon sign flickering in the rain",
  "Time-lapse starry night sky",
  "Microscopic cellular division",
  "Fluid simulation, ink dropping in water",
  "Double exposure portrait effect",
  "Cinematic bokeh lights moving",
  "Retro synthwave sunset reflection",
  "Glittering diamond particles explosion"
];

export default function VideoStudio() {
  const { hfToken, globalGeneratedImage } = useContext(StudioContext);
  
  const [videoPrompt, setVideoPrompt] = useState(VIDEO_STYLES[0]);
  const [uploadedVideoImage, setUploadedVideoImage] = useState(null);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoError, setVideoError] = useState('');
  const videoInputRef = useRef(null);

  const handleVideoImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setUploadedVideoImage(URL.createObjectURL(file));
      setVideoError('');
    }
  };

  const handleGenerateVideo = async () => {
    const sourceImage = uploadedVideoImage || globalGeneratedImage;
    if (!sourceImage) {
      setVideoError('Please upload an image or generate one in the Image Studio first.');
      return;
    }

    setIsVideoGenerating(true);
    setVideoError('');
    setGeneratedVideo(null);

    try {
      const response = await fetch(sourceImage);
      const imageBlob = await response.blob();
      const clientOptions = hfToken.trim() ? { hf_token: hfToken.trim() } : {};
      
      const app = await Client.connect("multimodalart/stable-video-diffusion", clientOptions);
      
      const result = await app.predict("/video", [
        imageBlob,
        "14 frames (faster)",
        127,
        6
      ]);

      if (result && result.data && result.data[0]) {
        setGeneratedVideo(result.data[0].url || result.data[0]);
      } else {
        throw new Error('Invalid response from Video API.');
      }
    } catch (err) {
      console.error(err);
      setVideoError(err.message || 'Error generating video. The Hugging Face Space might be overloaded.');
    } finally {
      setIsVideoGenerating(false);
    }
  };

  return (
    <div className="bg-black/60 backdrop-blur-xl border border-[#333] rounded-3xl p-8 shadow-[0_0_50px_rgba(255,230,0,0.05)]">
      {videoError && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 text-red-400 rounded-xl font-mono text-sm">
          {videoError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Input & Settings */}
        <div className="space-y-8">
          
          {/* Source Image */}
          <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl">
            <label className="flex items-center justify-between text-sm font-bold text-[#aaa] uppercase tracking-wider mb-4 border-b border-[#222] pb-3">
              <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[#ffe600]" /> Source Image</span>
            </label>
            
            <div className="flex flex-col gap-4">
              {globalGeneratedImage && (
                <button onClick={() => setUploadedVideoImage(globalGeneratedImage)} className="p-3 border border-[#333] rounded-xl hover:border-[#ffe600] transition-colors flex items-center gap-3 text-left">
                  <img src={globalGeneratedImage} alt="Generated" className="w-12 h-12 rounded object-cover" />
                  <span className="text-sm font-bold text-white">Use Image from Image Studio</span>
                </button>
              )}
              
              <div 
                className="p-6 border-2 border-dashed border-[#333] rounded-xl hover:border-[#ffe600] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2"
                onClick={() => videoInputRef.current?.click()}
              >
                <input type="file" accept="image/jpeg, image/png" className="hidden" ref={videoInputRef} onChange={handleVideoImageUpload} />
                <Upload className="w-6 h-6 text-[#666]" />
                <span className="text-sm font-bold text-[#888]">Upload Custom Image</span>
              </div>

              {(uploadedVideoImage || globalGeneratedImage) && (
                <div className="mt-4 p-2 bg-black border border-[#333] rounded-xl">
                  <img src={uploadedVideoImage || globalGeneratedImage} alt="Source" className="w-full h-32 object-contain rounded-lg opacity-80" />
                </div>
              )}
            </div>
          </div>

          {/* Video Style Prompts (40 Presets) */}
          <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl">
            <label className="flex items-center justify-between text-sm font-bold text-[#aaa] uppercase tracking-wider mb-4 border-b border-[#222] pb-3">
              <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#ffe600]" /> 40 Animation Styles</span>
            </label>
            <select 
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              className="w-full bg-black border border-[#333] text-white p-3 rounded-xl focus:outline-none focus:border-[#ffe600] transition-colors font-mono text-xs mb-4"
            >
              {VIDEO_STYLES.map((style, idx) => (
                <option key={idx} value={style}>{style}</option>
              ))}
            </select>
            
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              rows="3"
              className="w-full bg-[#0a0a0a] border border-[#333] text-white p-4 rounded-xl focus:outline-none focus:border-[#ffe600] transition-colors resize-none font-mono text-xs leading-relaxed shadow-inner"
              placeholder="Or write your own custom animation prompt here..."
            />
          </div>

          <button
            onClick={handleGenerateVideo}
            disabled={isVideoGenerating}
            className={`w-full py-5 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              isVideoGenerating
                ? 'bg-[#333] text-[#888] cursor-not-allowed' 
                : 'bg-[#ffe600] text-black shadow-[0_0_15px_rgba(255,230,0,0.5)] hover:bg-[#ffea33] hover:shadow-[0_0_30px_rgba(255,230,0,0.8)]'
            }`}
          >
            {isVideoGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Film className="w-6 h-6" />}
            {isVideoGenerating ? 'Animating...' : 'Generate Video'}
          </button>

        </div>

        {/* Right Column: Output Video */}
        <div className="xl:col-span-2 bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 flex flex-col">
          <div className="flex-1 w-full bg-black border border-[#222] rounded-xl flex items-center justify-center overflow-hidden relative min-h-[400px]">
            
            {isVideoGenerating && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="w-16 h-16 border-4 border-[#333] border-t-[#ffe600] rounded-full animate-spin mb-4" />
                <span className="text-[#ffe600] font-mono text-sm tracking-widest animate-pulse">Rendering Frames (Takes 1-2 mins)...</span>
              </div>
            )}

            {generatedVideo ? (
              <video src={generatedVideo} controls autoPlay loop className="w-full h-full object-contain" />
            ) : (
              <div className="text-[#444] font-mono flex flex-col items-center gap-4 text-center p-8">
                <Film className="w-16 h-16 opacity-50" />
                <p>Your animated video will appear here.<br/>Powered by Stable Video Diffusion</p>
              </div>
            )}
          </div>

          {generatedVideo && (
            <div className="mt-6 flex justify-end">
              <a href={generatedVideo} download={`neon_video_${Date.now()}.mp4`} className="px-6 py-3 bg-[#222] text-white font-bold rounded-xl flex items-center gap-2 hover:bg-[#333] transition-colors border border-[#444]">
                <Download className="w-4 h-4" /> Download Video
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
