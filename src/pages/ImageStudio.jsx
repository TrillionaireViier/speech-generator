import React, { useState, useContext } from 'react';
import { Loader2, Image as ImageIcon, Sparkles, Download } from 'lucide-react';
import { HfInference } from '@huggingface/inference';
import { StudioContext } from '../context/StudioContext';

export default function ImageStudio() {
  const { hfToken, globalGeneratedImage, setGlobalGeneratedImage } = useContext(StudioContext);
  const hf = new HfInference(hfToken.trim() || undefined);

  const [imagePrompt, setImagePrompt] = useState('A futuristic cyberpunk neon city with flying cars, highly detailed, 8k resolution, cinematic lighting');
  const [selectedImageModel, setSelectedImageModel] = useState('black-forest-labs/FLUX.1-schnell');
  const [isImageGenerating, setIsImageGenerating] = useState(false);
  const [imageError, setImageError] = useState('');

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setImageError('Please enter an image prompt.');
      return;
    }

    setIsImageGenerating(true);
    setImageError('');
    setGlobalGeneratedImage(null);

    try {
      const blob = await hf.textToImage({
        model: selectedImageModel,
        inputs: imagePrompt,
        parameters: { negative_prompt: "blurry, low quality, bad anatomy, worst quality" }
      });
      const imageUrl = URL.createObjectURL(blob);
      setGlobalGeneratedImage(imageUrl);
    } catch (err) {
      console.error(err);
      setImageError(err.message || 'Error generating image. Try passing a Hugging Face Token.');
    } finally {
      setIsImageGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (globalGeneratedImage) {
      const a = document.createElement('a');
      a.href = globalGeneratedImage;
      a.download = `neon_studio_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="bg-black/60 backdrop-blur-xl border border-[#333] rounded-3xl p-8 shadow-[0_0_50px_rgba(176,38,255,0.05)]">
      {imageError && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 text-red-400 rounded-xl font-mono text-sm">
          {imageError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Input & Settings */}
        <div className="space-y-8">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-[#aaa] uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4 text-[#b026ff]" /> Image Prompt
            </label>
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              rows="6"
              className="w-full bg-[#0a0a0a] border border-[#333] text-white p-5 rounded-2xl focus:outline-none focus:border-[#b026ff] transition-colors resize-none font-mono text-sm leading-relaxed shadow-inner"
              placeholder="Describe what you want to see..."
            />
          </div>

          <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl">
            <label className="flex items-center justify-between text-sm font-bold text-[#aaa] uppercase tracking-wider mb-4 border-b border-[#222] pb-3">
              <span className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[#b026ff]" /> Image Models</span>
            </label>
            <div className="space-y-3">
              {[
                { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell (Fast)' },
                { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'Stable Diffusion XL 1.0' },
                { id: 'runwayml/stable-diffusion-v1-5', name: 'Stable Diffusion 1.5' },
              ].map((model) => (
                <label key={model.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedImageModel === model.id ? 'border-[#b026ff] bg-[#b026ff]/10' : 'border-[#333] hover:border-[#555]'}`}>
                  <input type="radio" name="imageModel" value={model.id} checked={selectedImageModel === model.id} onChange={() => setSelectedImageModel(model.id)} className="sr-only" />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedImageModel === model.id ? 'border-[#b026ff]' : 'border-[#666]'}`}>
                    {selectedImageModel === model.id && <div className="w-2 h-2 bg-[#b026ff] rounded-full shadow-[0_0_10px_#b026ff]" />}
                  </div>
                  <span className="text-sm font-bold text-white">{model.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button onClick={handleGenerateImage} disabled={isImageGenerating} className={`w-full py-5 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isImageGenerating ? 'bg-[#333] text-[#888] cursor-not-allowed' : 'bg-[#b026ff] text-white shadow-[0_0_15px_rgba(176,38,255,0.5)] hover:bg-[#c44cff] hover:shadow-[0_0_30px_rgba(176,38,255,0.8)]'}`}>
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
            {globalGeneratedImage ? (
              <img src={globalGeneratedImage} alt="Generated" className="w-full h-full object-contain" />
            ) : (
              <div className="text-[#444] font-mono flex flex-col items-center gap-4 text-center p-8">
                <ImageIcon className="w-16 h-16 opacity-50" />
                <p>Your generated artwork will appear here.<br/>Powered by {selectedImageModel}</p>
              </div>
            )}
          </div>
          {globalGeneratedImage && (
            <div className="mt-6 flex justify-end">
              <button onClick={handleDownloadImage} className="px-6 py-3 bg-[#222] text-white font-bold rounded-xl flex items-center gap-2 hover:bg-[#333] transition-colors border border-[#444]">
                <Download className="w-4 h-4" /> Download 8K Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
