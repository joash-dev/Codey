import React, { useState } from 'react';
import { generateTheme } from '../services/geminiService';
import { Theme } from '../types';
import { XIcon, SpinnerIcon, MagicWandIcon } from './Icons';

interface ThemeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTheme: (theme: Theme) => void;
}

const ThemeGeneratorModal: React.FC<ThemeGeneratorModalProps> = ({ isOpen, onClose, onApplyTheme }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTheme, setGeneratedTheme] = useState<Theme | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setGeneratedTheme(null);
    try {
      const theme = await generateTheme(prompt);
      setGeneratedTheme(theme);
    } catch (err) {
      console.error(err);
      setError('Failed to generate theme. Please try a different prompt.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedTheme) {
      onApplyTheme(generatedTheme);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-white/20 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Generate a Theme</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
            <XIcon />
          </button>
        </div>
        
        <div>
          <label htmlFor="theme-prompt" className="text-sm font-medium text-gray-300 mb-2 block">
            Describe the theme you want
          </label>
          <textarea
            id="theme-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., cyberpunk neon city, calm forest canopy, ocean sunset..."
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))] transition-all resize-none"
            rows={3}
            disabled={isLoading}
          />
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 p-2 rounded-md">{error}</p>}
        
        {generatedTheme && (
            <div className='flex flex-col gap-3 p-3 bg-black/20 rounded-lg border border-white/10'>
                <div className='flex justify-between items-center'>
                     <p className='text-sm font-medium text-white'>Generated Theme: <span className='font-bold'>{generatedTheme.name}</span></p>
                </div>
                <div className='flex gap-2'>
                    {[generatedTheme.c400, generatedTheme.c500, generatedTheme.c600].map((color, idx) => (
                        <div key={idx} className='w-full h-12 rounded-md border border-white/20' style={{ backgroundColor: `hsl(${color})`}} />
                    ))}
                </div>
            </div>
        )}

        <div className="flex justify-end gap-3">
          {generatedTheme ? (
             <button onClick={handleApply} className="px-4 py-2 w-full rounded-md bg-[hsl(var(--accent-500))] text-white hover:bg-[hsl(var(--accent-600))] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))] font-semibold">
                Apply Theme
            </button>
          ) : (
            <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="px-4 py-2 w-full rounded-md bg-white/10 text-white hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 font-semibold flex items-center justify-center gap-2">
                {isLoading ? <SpinnerIcon /> : <MagicWandIcon />}
                {isLoading ? 'Generating...' : 'Generate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeGeneratorModal;