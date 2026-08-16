import React, { useState, useRef } from 'react';
import { Mic, Play, Square, Upload, AudioLines, FileAudio, Loader2, Fingerprint, Settings2, Scissors, Timer, Gauge, Image as ImageIcon, Sparkles, Download, Layers, Video, Film } from 'lucide-react';
import { Client } from "@gradio/client";
import { HfInference } from '@huggingface/inference';

// Generate 40 Preset Voices (Placeholders for real audio files)
const PRESET_VOICES = Array.from({ length: 40 }).map((_, i) => {
  const categories = ['Narrator', 'News Anchor', 'Animation', 'Conversational', 'Cinematic'];
  const genders = ['Male', 'Female'];
  
  const cat = categories[i % categories.length];
  const gen = genders[i % genders.length];

  return {
    id: `preset_${i + 1}`,
    name: `Voice ${i + 1} - ${gen} ${cat}`,
    audioUrl: null 
  };
});

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh-cn', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('voice'); // 'voice' | 'image'
  const [hfToken, setHfToken] = useState('');

  // --- VOICE STUDIO STATE ---
  const [voiceText, setVoiceText] = useState('Hello! Now I can not only clone voices, but also paint pictures.');
  const [language, setLanguage] = useState('en');
  const [selectedPreset, setSelectedPreset] = useState(PRESET_VOICES[0].id);
  const [useCustomAudio, setUseCustomAudio] = useState(false);
  const [customAudioFile, setCustomAudioFile] = useState(null);
  
  const [selectedVoiceModel, setSelectedVoiceModel] = useState('F5-TTS'); 
  const [speed, setSpeed] = useState(1.0);
  const [crossFade, setCrossFade] = useState(0.15);
  const [removeSilences, setRemoveSilences] = useState(false);

  const [isVoiceGenerating, setIsVoiceGenerating] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // --- IMAGE STUDIO STATE ---
  const [imagePrompt, setImagePrompt] = useState('A futuristic cyberpunk neon city with flying cars, highly detailed, 8k resolution, cinematic lighting');
  const [selectedImageModel, setSelectedImageModel] = useState('black-forest-labs/FLUX.1-schnell');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [imageError, setImageError] = useState('');

  // --- VIDEO STUDIO STATE ---
  const [videoPrompt, setVideoPrompt] = useState('Cyberpunk neon style, cinematic camera pan');
  const [selectedVideoModel, setSelectedVideoModel] = useState('Stable Video Diffusion');
  const [uploadedVideoImage, setUploadedVideoImage] = useState(null);
  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoError, setVideoError] = useState('');
  const videoInputRef = useRef(null);

  // --- INITIALIZE HF CLIENT ---
  const hf = new HfInference(hfToken.trim() || undefined);

  // --- VOICE LOGIC ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'audio/wav' || file.type === 'audio/mpeg')) {
      setCustomAudioFile(file);
      setUseCustomAudio(true);
      setVoiceError('');
    } else {
      setVoiceError('Please upload a valid .wav or .mp3 file.');
    }
  };

  const handleStopVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleGenerateVoice = async () => {
    if (!voiceText.trim()) {
      setVoiceError('Please enter some text.');
      return;
    }

    const isCloneModel = selectedVoiceModel === 'F5-TTS' || selectedVoiceModel === 'E2-TTS';
    
    if (isCloneModel && useCustomAudio && !customAudioFile) {
      setVoiceError('Please upload a reference audio file for Voice Cloning.');
      return;
    }

    setIsVoiceGenerating(true);
    setVoiceError('');

    try {
      if (isCloneModel) {
        // Voice Cloning via Gradio (F5-TTS/E2-TTS)
        setVoiceStatus('Connecting to Hugging Face Spaces...');
        const clientOptions = hfToken.trim() ? { hf_token: hfToken.trim() } : {};
        const app = await Client.connect("mrfakename/E2-F5-TTS", clientOptions);
        
        setVoiceStatus(`Sending data for ${selectedVoiceModel} inference...`);

        let referenceAudioBlob = null;
        if (useCustomAudio && customAudioFile) {
          referenceAudioBlob = customAudioFile;
        } else {
          throw new Error('Preset voices lack actual audio files. Use "Upload Custom Voice" for cloning demo.');
        }

        const result = await app.predict("/infer", [
          referenceAudioBlob,       
          "", 	                    
          voiceText, 	                  
          selectedVoiceModel, 	          
          removeSilences, 	        
          parseFloat(crossFade), 	  
          parseFloat(speed), 	      
        ]);

        setVoiceStatus('Receiving cloned audio...');

        if (result && result.data && result.data[0]) {
          const audioUrl = result.data[0].url || result.data[0];
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
            setIsPlaying(true);
          }
        } else {
          throw new Error(`Invalid response from ${selectedVoiceModel} API.`);
        }
      } else {
        // Standard TTS via Hugging Face Inference API (Bark / MMS)
        setVoiceStatus(`Generating standard TTS via ${selectedVoiceModel}...`);
        
        const response = await hf.textToSpeech({
          model: selectedVoiceModel,
          inputs: voiceText,
        });

        const audioUrl = URL.createObjectURL(response);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (err) {
      console.error(err);
      setVoiceError(err.message || 'An error occurred during synthesis. Overloaded?');
    } finally {
      setIsVoiceGenerating(false);
      setVoiceStatus('');
    }
  };

  // --- IMAGE LOGIC ---
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setImageError('Please enter an image prompt.');
      return;
    }

    setIsImageGenerating(true);
    setImageError('');
    setGeneratedImage(null);

    try {
      const blob = await hf.textToImage({
        model: selectedImageModel,
        inputs: imagePrompt,
        parameters: {
          negative_prompt: "blurry, low quality, bad anatomy, worst quality",
        }
      });
      
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImage(imageUrl);
    } catch (err) {
      console.error(err);
      setImageError(err.message || 'Error generating image. Try passing a Hugging Face Token.');
    } finally {
      setIsImageGenerating(false);
    }
  };

  // --- VIDEO LOGIC ---
  const handleVideoImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setUploadedVideoImage(URL.createObjectURL(file));
      setVideoError('');
    }
  };

  const handleGenerateVideo = async () => {
    const sourceImage = uploadedVideoImage || generatedImage;
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

  const handleDownloadImage = () => {
    if (generatedImage) {
      const a = document.createElement('a');
      a.href = generatedImage;
      a.download = `neon_studio_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };


  return (
    <div className="min-h-screen p-4 md:p-8 relative flex flex-col items-center">
      <audio ref={audioRef} className="hidden" onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} />

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
              <p className="text-[#888] font-mono text-xs tracking-widest mt-1">Unified AI Hub: Voice Cloning & Image Gen</p>
            </div>
          </div>
          
          <div className="flex bg-black border border-[#333] rounded-xl p-1 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                activeTab === 'voice' 
                ? 'bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/50 shadow-[0_0_15px_rgba(0,243,255,0.3)]' 
                : 'text-[#666] hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" /> Voice
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                activeTab === 'image' 
                ? 'bg-[#b026ff]/20 text-[#b026ff] border border-[#b026ff]/50 shadow-[0_0_15px_rgba(176,38,255,0.3)]' 
                : 'text-[#666] hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Image
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 md:flex-none px-8 py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                activeTab === 'video' 
                ? 'bg-[#ffe600]/20 text-[#ffe600] border border-[#ffe600]/50 shadow-[0_0_15px_rgba(255,230,0,0.3)]' 
                : 'text-[#666] hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" /> Video
            </button>
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
              className="w-full bg-black border border-[#333] text-white p-3 rounded-xl focus:outline-none focus:neon-border-cyan font-mono text-xs"
            />
          </div>
          <p className="text-[#555] text-[10px] font-mono uppercase max-w-md">
            Providing a token unlocks faster image generation (FLUX.1) and bypasses strict rate limits on public Voice Cloning Spaces.
          </p>
        </div>


        {/* =========================================
            VOICE STUDIO TAB 
        ========================================= */}
        {activeTab === 'voice' && (
          <div className="bg-black/60 backdrop-blur-xl border border-[#333] rounded-3xl p-8 shadow-[0_0_50px_rgba(0,243,255,0.05)]">
            
            {voiceError && (
              <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 text-red-400 rounded-xl font-mono text-sm">
                {voiceError}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              
              {/* Main Content (Left Col) */}
              <div className="xl:col-span-2 space-y-8">
                
                {/* Reference Audio Box (Only active for Clone Models) */}
                <div className={`bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl transition-opacity ${(selectedVoiceModel === 'F5-TTS' || selectedVoiceModel === 'E2-TTS') ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <label className="flex items-center justify-between text-sm font-bold text-[#aaa] uppercase tracking-wider mb-6 border-b border-[#222] pb-3">
                    <span className="flex items-center gap-2"><FileAudio className="w-4 h-4 text-[#00f3ff]" /> Reference Voice (Cloning)</span>
                  </label>
                  
                  <div className="flex flex-col gap-6">
                    <div 
                      className={`p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer ${useCustomAudio ? 'border-[#00f3ff] bg-[#00f3ff]/5' : 'border-[#333] hover:border-[#555]'}`}
                      onClick={() => { setUseCustomAudio(true); fileInputRef.current?.click(); }}
                    >
                      <input 
                        type="file" 
                        accept="audio/wav, audio/mpeg" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${useCustomAudio ? 'bg-[#00f3ff] text-black shadow-[0_0_15px_rgba(0,243,255,0.5)]' : 'bg-[#222] text-[#888]'}`}>
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className={`font-bold ${useCustomAudio ? 'text-[#00f3ff]' : 'text-white'}`}>Upload Custom Voice</h4>
                          <p className="text-[#888] text-sm mt-1">
                            {customAudioFile ? customAudioFile.name : 'Upload a 5-10 second clean .wav/.mp3 sample.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px bg-[#222]"></div>
                      <span className="text-[#666] font-bold text-xs uppercase tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-[#222]"></div>
                    </div>

                    <div 
                      className={`p-4 border rounded-xl transition-all cursor-pointer flex items-center gap-4 ${!useCustomAudio ? 'border-[#ff2a85] bg-[#ff2a85]/5' : 'border-[#333] hover:border-[#555]'}`}
                      onClick={() => setUseCustomAudio(false)}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!useCustomAudio ? 'border-[#ff2a85]' : 'border-[#555]'}`}>
                        {!useCustomAudio && <div className="w-2 h-2 bg-[#ff2a85] rounded-full shadow-[0_0_10px_#ff2a85]"></div>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-[#888] uppercase mb-2">Select Preset (Placeholders)</label>
                        <select 
                          value={selectedPreset} 
                          onChange={(e) => { setSelectedPreset(e.target.value); setUseCustomAudio(false); }}
                          className="w-full bg-black border border-[#333] text-white p-3 rounded-lg focus:outline-none focus:neon-border-pink font-mono text-sm"
                        >
                          {PRESET_VOICES.map((voice) => (
                            <option key={voice.id} value={voice.id}>{voice.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Input & Language */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#aaa] uppercase tracking-wider">
                      <AudioLines className="w-4 h-4 text-[#00f3ff]" /> Text Sequence
                    </label>
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-black border border-[#333] text-[#00f3ff] px-3 py-1 rounded-lg focus:outline-none focus:border-[#00f3ff] font-mono text-xs uppercase"
                    >
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={voiceText}
                    onChange={(e) => setVoiceText(e.target.value)}
                    rows="4"
                    className="w-full bg-black border border-[#333] text-white p-4 rounded-xl focus:outline-none focus:neon-border-cyan transition-colors resize-none font-mono text-sm leading-relaxed shadow-inner"
                    placeholder="Enter text to synthesize..."
                  />
                </div>
              </div>

              {/* Settings Panel (Middle Col) */}
              <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl flex flex-col gap-8">
                <label className="flex items-center gap-2 text-sm font-bold text-[#aaa] uppercase tracking-wider border-b border-[#222] pb-3">
                  <Settings2 className="w-4 h-4 text-[#ff2a85]" /> Voice Models
                </label>

                {/* Model Selector */}
                <div>
                  <label className="block text-xs font-bold text-[#666] uppercase mb-3">Generation Engine</label>
                  <div className="space-y-2">
                    {['F5-TTS', 'E2-TTS', 'suno/bark-small', 'facebook/mms-tts-eng'].map((model) => (
                      <button
                        key={model}
                        onClick={() => setSelectedVoiceModel(model)}
                        className={`w-full text-left p-3 rounded-lg border text-sm font-mono transition-all ${
                          selectedVoiceModel === model 
                          ? 'border-[#00f3ff] bg-[#00f3ff]/10 text-white' 
                          : 'border-[#333] text-[#666] hover:border-[#555]'
                        }`}
                      >
                        {model} {model.includes('TTS') ? '(Clone)' : '(Standard)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speed Control (Only Clone) */}
                <div className={`space-y-3 transition-opacity ${selectedVoiceModel.includes('TTS') ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-xs font-bold text-white uppercase"><Gauge className="w-4 h-4 text-[#00f3ff]" /> Speed</label>
                    <span className="text-[#00f3ff] font-mono text-xs">{speed.toFixed(1)}x</span>
                  </div>
                  <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full accent-[#00f3ff]" />
                </div>

                {/* Cross-Fade Control (Only Clone) */}
                <div className={`space-y-3 transition-opacity ${selectedVoiceModel.includes('TTS') ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-xs font-bold text-white uppercase"><Timer className="w-4 h-4 text-[#ff2a85]" /> Cross-Fade</label>
                    <span className="text-[#ff2a85] font-mono text-xs">{crossFade.toFixed(2)}s</span>
                  </div>
                  <input type="range" min="0" max="1.0" step="0.05" value={crossFade} onChange={(e) => setCrossFade(parseFloat(e.target.value))} className="w-full accent-[#ff2a85]" />
                </div>
              </div>

              {/* Actions & Visualizer (Right Col) */}
              <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 flex flex-col justify-between">
                <div className="h-40 bg-black border border-[#222] rounded-xl flex items-center justify-center gap-2 overflow-hidden relative mb-8">
                  {isVoiceGenerating ? (
                    <div className="text-[#00f3ff] font-mono text-sm flex flex-col items-center gap-3 w-full px-4">
                      <Loader2 className="w-8 h-8 animate-spin" /> 
                      <span className="text-center w-full truncate">{voiceStatus}</span>
                    </div>
                  ) : isPlaying ? (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#00f3ff]/10 via-[#ff2a85]/10 to-[#b026ff]/10 animate-pulse" />
                      {[...Array(15)].map((_, i) => (
                        <div key={i} className="w-2 rounded-full audio-bar" style={{ animationDelay: `${Math.random()}s` }} />
                      ))}
                    </>
                  ) : (
                    <div className="text-[#444] font-mono text-sm flex flex-col items-center gap-2 text-center">
                      <Square className="w-6 h-6 mb-2" /> 
                      {selectedVoiceModel.includes('TTS') ? 'Ready for Voice Cloning' : 'Ready for Standard TTS'}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {isPlaying ? (
                    <button onClick={handleStopVoice} className="w-full py-5 rounded-xl font-black uppercase tracking-widest bg-transparent border-2 border-[#ff2a85] text-[#ff2a85] hover:bg-[#ff2a85] hover:text-white transition-all shadow-[0_0_15px_rgba(255,42,133,0.5)] flex items-center justify-center gap-2">
                      <Square className="w-6 h-6 fill-current" /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateVoice}
                      disabled={isVoiceGenerating}
                      className={`w-full py-5 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                        isVoiceGenerating
                          ? 'bg-[#333] text-[#888] cursor-not-allowed' 
                          : 'bg-[#00f3ff] text-black shadow-[0_0_15px_rgba(0,243,255,0.5)] hover:bg-[#00d0ff] hover:shadow-[0_0_30px_rgba(0,243,255,0.8)]'
                      }`}
                    >
                      {isVoiceGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
                      {isVoiceGenerating ? 'Processing...' : 'Synthesize Voice'}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =========================================
            IMAGE STUDIO TAB 
        ========================================= */}
        {activeTab === 'image' && (
          <div className="bg-black/60 backdrop-blur-xl border border-[#333] rounded-3xl p-8 shadow-[0_0_50px_rgba(176,38,255,0.05)]">
            
            {imageError && (
              <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 text-red-400 rounded-xl font-mono text-sm">
                {imageError}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column: Input & Settings */}
              <div className="space-y-8">
                
                {/* Image Prompt */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-[#aaa] uppercase tracking-wider mb-3">
                    <Sparkles className="w-4 h-4 text-[#b026ff]" /> Image Prompt
                  </label>
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows="6"
                    className="w-full bg-[#0a0a0a] border border-[#333] text-white p-5 rounded-2xl focus:outline-none focus:neon-border-purple transition-colors resize-none font-mono text-sm leading-relaxed shadow-inner"
                    placeholder="Describe what you want to see..."
                  />
                </div>

                {/* Model Selector */}
                <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl">
                  <label className="flex items-center justify-between text-sm font-bold text-[#aaa] uppercase tracking-wider mb-4 border-b border-[#222] pb-3">
                    <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[#b026ff]" /> Image Models</span>
                  </label>
                  <div className="space-y-3">
                    {[
                      { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell (Fast & High Quality)' },
                      { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'Stable Diffusion XL 1.0' },
                      { id: 'runwayml/stable-diffusion-v1-5', name: 'Stable Diffusion 1.5' },
                    ].map((model) => (
                      <label key={model.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedImageModel === model.id ? 'border-[#b026ff] bg-[#b026ff]/10' : 'border-[#333] hover:border-[#555]'
                      }`}>
                        <input type="radio" name="imageModel" value={model.id} checked={selectedImageModel === model.id} onChange={() => setSelectedImageModel(model.id)} className="sr-only" />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedImageModel === model.id ? 'border-[#b026ff]' : 'border-[#666]'}`}>
                          {selectedImageModel === model.id && <div className="w-2 h-2 bg-[#b026ff] rounded-full shadow-[0_0_10px_#b026ff]" />}
                        </div>
                        <span className="text-sm font-bold text-white">{model.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateImage}
                  disabled={isImageGenerating}
                  className={`w-full py-5 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    isImageGenerating
                      ? 'bg-[#333] text-[#888] cursor-not-allowed' 
                      : 'bg-[#b026ff] text-white shadow-[0_0_15px_rgba(176,38,255,0.5)] hover:bg-[#c44cff] hover:shadow-[0_0_30px_rgba(176,38,255,0.8)]'
                  }`}
                >
                  {isImageGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                  {isImageGenerating ? 'Painting...' : 'Generate Image'}
                </button>

              </div>

              {/* Right Column: Output Gallery */}
              <div className="xl:col-span-2 bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 flex flex-col">
                <div className="flex-1 w-full bg-black border border-[#222] rounded-xl flex items-center justify-center overflow-hidden relative min-h-[400px]">
                  
                  {isImageGenerating && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                      <div className="w-16 h-16 border-4 border-[#333] border-t-[#b026ff] rounded-full animate-spin mb-4" />
                      <span className="text-[#b026ff] font-mono text-sm tracking-widest animate-pulse">Running Neural Networks...</span>
                    </div>
                  )}

                  {generatedImage ? (
                    <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-[#444] font-mono flex flex-col items-center gap-4 text-center p-8">
                      <ImageIcon className="w-16 h-16 opacity-50" />
                      <p>Your generated artwork will appear here.<br/>Powered by {selectedImageModel}</p>
                    </div>
                  )}
                </div>

                {generatedImage && (
                  <div className="mt-6 flex justify-end">
                    <button onClick={handleDownloadImage} className="px-6 py-3 bg-[#222] text-white font-bold rounded-xl flex items-center gap-2 hover:bg-[#333] transition-colors border border-[#444]">
                      <Download className="w-4 h-4" /> Download 8K Image
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
