import React, { useState, useRef } from 'react';
import { Mic, Play, Square, Upload, AudioLines, FileAudio, Loader2, Fingerprint } from 'lucide-react';
import { Client } from "@gradio/client";

// Generate 40 Preset Voices (Placeholders for real audio files)
const PRESET_VOICES = Array.from({ length: 40 }).map((_, i) => {
  const categories = ['Narrator', 'News Anchor', 'Animation', 'Conversational', 'Cinematic'];
  const genders = ['Male', 'Female'];
  
  const cat = categories[i % categories.length];
  const gen = genders[i % genders.length];

  return {
    id: `preset_${i + 1}`,
    name: `Voice ${i + 1} - ${gen} ${cat}`,
    // In production, this needs to be a valid HTTP URL to a short .wav file 
    // or a Blob object that Gradio can process.
    audioUrl: null 
  };
});

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Russian' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'zh-cn', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

export default function App() {
  const [text, setText] = useState('Привет! Это тест клонирования голоса через открытую нейросеть XTTS.');
  const [language, setLanguage] = useState('ru');
  
  const [selectedPreset, setSelectedPreset] = useState(PRESET_VOICES[0].id);
  const [useCustomAudio, setUseCustomAudio] = useState(false);
  const [customAudioFile, setCustomAudioFile] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'audio/wav' || file.type === 'audio/mpeg')) {
      setCustomAudioFile(file);
      setUseCustomAudio(true);
      setError('');
    } else {
      setError('Please upload a valid .wav or .mp3 file.');
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter some text.');
      return;
    }
    
    if (useCustomAudio && !customAudioFile) {
      setError('Please upload a reference audio file first.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setStatusMessage('Connecting to Hugging Face XTTS Space...');

    try {
      // 1. Connect to the public XTTS Space via Gradio Client
      // Note: "coqui/xtts" is a popular public space. If it's asleep, it might take a while to wake up.
      const app = await Client.connect("coqui/xtts");
      
      setStatusMessage('Connected! Sending audio and text for inference (Queueing)...');

      // 2. Prepare the Reference Audio File
      let referenceAudioBlob = null;
      
      if (useCustomAudio && customAudioFile) {
        referenceAudioBlob = customAudioFile;
      } else {
        // If a preset is selected, we need an actual file to send to Gradio.
        // Since presets are empty placeholders right now, we throw an error to guide the user.
        throw new Error('Preset voices currently lack actual audio files. Please use "Upload Custom Voice" for this live demo.');
      }

      // 3. Call the predict endpoint
      // Typical XTTS endpoint takes: [prompt, language, audio_file, mic_audio, cleanup_bool, no_lang_auto_detect_bool]
      // We pass the required arguments based on typical coqui/xtts schema.
      const result = await app.predict("/predict", [
        text, 		      // string  in 'Text Prompt' Textbox component		
        language, 	    // string  in 'Language' Dropdown component		
        referenceAudioBlob, // blob in 'Reference Audio' Audio component		
        null, 		      // blob in 'Use Microphone for Reference' Audio component		
        false, 		      // boolean  in 'Cleanup Reference Voice' Checkbox component
        true            // boolean  in 'Do not use language auto-detect' Checkbox component
      ]);

      setStatusMessage('Audio generated successfully! Receiving file...');

      // 4. Handle the resulting audio file
      if (result && result.data && result.data[0]) {
        // result.data[0] is typically an object containing the URL to the generated audio
        const audioUrl = result.data[0].url || result.data[0];
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
          setIsPlaying(true);
        }
      } else {
        throw new Error('Invalid response received from the XTTS API.');
      }
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during synthesis. The public Space might be overloaded.');
    } finally {
      setIsGenerating(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 relative flex items-center justify-center">
      <audio ref={audioRef} className="hidden" onEnded={() => setIsPlaying(false)} onPause={() => setIsPlaying(false)} />

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00f3ff] rounded-full blur-[200px] opacity-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#ff2a85] rounded-full blur-[200px] opacity-10" />
      </div>

      <div className="w-full max-w-5xl bg-black/60 backdrop-blur-xl border border-[#333] rounded-3xl p-8 shadow-[0_0_50px_rgba(0,243,255,0.05)]">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[#222]">
          <div className="p-3 bg-black border border-[#00f3ff] rounded-xl neon-border-cyan">
            <Fingerprint className="w-8 h-8 text-[#00f3ff]" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-white neon-text-cyan flex items-center gap-3">
              Neon <span className="text-[#ff2a85] neon-text-pink">Clone</span>
              <span className="bg-[#ff2a85]/20 text-[#ff2a85] border border-[#ff2a85]/50 text-[10px] px-2 py-1 rounded-full tracking-normal">LIVE API</span>
            </h1>
            <p className="text-[#888] font-mono text-sm tracking-widest mt-1">Direct Connection to Hugging Face XTTS Space</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 text-red-400 rounded-xl font-mono text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Voice Selection */}
            <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl">
              <label className="flex items-center justify-between text-sm font-bold text-[#aaa] uppercase tracking-wider mb-6 border-b border-[#222] pb-3">
                <span className="flex items-center gap-2"><FileAudio className="w-4 h-4 text-[#ff2a85]" /> Reference Voice</span>
              </label>
              
              <div className="flex flex-col gap-6">
                
                {/* Custom Audio Upload */}
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
                      <h4 className={`font-bold ${useCustomAudio ? 'text-[#00f3ff]' : 'text-white'}`}>Upload Custom Voice (.wav / .mp3)</h4>
                      <p className="text-[#888] text-sm mt-1">
                        {customAudioFile ? customAudioFile.name : 'Upload a 5-10 second clean voice sample (Required for Live Demo).'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-[#222]"></div>
                  <span className="text-[#666] font-bold text-xs uppercase tracking-widest">OR</span>
                  <div className="flex-1 h-px bg-[#222]"></div>
                </div>

                {/* Preset Selector */}
                <div 
                  className={`p-4 border rounded-xl transition-all cursor-pointer flex items-center gap-4 ${!useCustomAudio ? 'border-[#ff2a85] bg-[#ff2a85]/5' : 'border-[#333] hover:border-[#555]'}`}
                  onClick={() => setUseCustomAudio(false)}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${!useCustomAudio ? 'border-[#ff2a85]' : 'border-[#555]'}`}>
                    {!useCustomAudio && <div className="w-2 h-2 bg-[#ff2a85] rounded-full shadow-[0_0_10px_#ff2a85]"></div>}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-[#888] uppercase mb-2">Select Preset (DB Placeholders)</label>
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
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows="4"
                className="w-full bg-black border border-[#333] text-white p-4 rounded-xl focus:outline-none focus:neon-border-cyan transition-colors resize-none font-mono text-sm leading-relaxed shadow-inner"
                placeholder="Enter text to synthesize..."
              />
            </div>
          </div>

          {/* Sidebar Actions & Visualizer */}
          <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 flex flex-col justify-between">
            
            <div className="h-40 bg-black border border-[#222] rounded-xl flex items-center justify-center gap-2 overflow-hidden relative mb-8">
              {isGenerating ? (
                <div className="text-[#00f3ff] font-mono text-sm flex flex-col items-center gap-3 w-full px-4">
                  <Loader2 className="w-8 h-8 animate-spin" /> 
                  <span className="text-center w-full truncate">{statusMessage}</span>
                </div>
              ) : isPlaying ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00f3ff]/10 via-[#ff2a85]/10 to-[#b026ff]/10 animate-pulse" />
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="w-2 rounded-full audio-bar" style={{ animationDelay: `${Math.random()}s` }} />
                  ))}
                </>
              ) : (
                <div className="text-[#444] font-mono text-sm flex items-center gap-2">
                  <Square className="w-4 h-4" /> Ready for Live Clone
                </div>
              )}
            </div>

            <div className="space-y-4">
              {isPlaying ? (
                <button
                  onClick={handleStop}
                  className="w-full py-5 rounded-xl font-black uppercase tracking-widest bg-transparent border-2 border-[#ff2a85] text-[#ff2a85] hover:bg-[#ff2a85] hover:text-white transition-all shadow-[0_0_15px_rgba(255,42,133,0.5)] flex items-center justify-center gap-2"
                >
                  <Square className="w-6 h-6 fill-current" /> Stop
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full py-5 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    isGenerating
                      ? 'bg-[#333] text-[#888] cursor-not-allowed' 
                      : 'bg-[#00f3ff] text-black shadow-[0_0_15px_rgba(0,243,255,0.5)] hover:bg-[#00d0ff] hover:shadow-[0_0_30px_rgba(0,243,255,0.8)]'
                  }`}
                >
                  {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
                  {isGenerating ? 'Processing...' : 'Live Clone'}
                </button>
              )}
              
              <div className="text-center">
                <p className="text-[#ff2a85] font-mono text-[10px] mt-4 uppercase">
                  Connected to Hugging Face Spaces API
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
