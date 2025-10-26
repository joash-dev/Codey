import React, { useState, useRef, useEffect } from 'react';
import { ThemeName, Theme } from '../types';
import { PaletteIcon } from './Icons';

interface ThemePickerProps {
  currentTheme: ThemeName | string;
  availableThemes: Record<string, Theme>;
  onThemeChange: (theme: ThemeName | string) => void;
}

const ThemePicker: React.FC<ThemePickerProps> = ({ currentTheme, onThemeChange, availableThemes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  return (
    <div ref={wrapperRef} className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent-400))]"
        aria-label="Change theme"
      >
        <PaletteIcon />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800/80 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl p-2 z-50">
           <p className="text-xs text-gray-400 px-1 pb-2">Select a theme</p>
          <div className="grid grid-cols-5 gap-2">
            {(Object.keys(availableThemes)).map(themeKey => {
              const theme = availableThemes[themeKey];
              return (
                <button
                  key={themeKey}
                  onClick={() => {
                    onThemeChange(themeKey);
                    setIsOpen(false);
                  }}
                  title={theme.name}
                  className={`w-full aspect-square rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white ${currentTheme === themeKey ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' : ''}`}
                  style={{ backgroundColor: `hsl(${theme.c500})` }}
                  aria-label={`Select ${theme.name} theme`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemePicker;