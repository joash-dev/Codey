export type ThemeName = 'purple' | 'yellow' | 'blue' | 'green' | 'pink' | 'cyan';

export interface Theme {
  name: string;
  c400: string; // HSL value as a string "H S% L%"
  c500: string;
  c600: string;
  activeText: 'text-white' | 'text-black';
}

export const availableThemes: Record<ThemeName, Theme> = {
  purple: { name: 'Purple', c400: '272 91% 75%', c500: '272 91% 65%', c600: '272 91% 53%', activeText: 'text-white' },
  yellow: { name: 'Yellow', c400: '45 93% 65%', c500: '45 93% 58%', c600: '45 93% 50%', activeText: 'text-black' },
  blue: { name: 'Blue', c400: '217 91% 65%', c500: '217 91% 59%', c600: '217 91% 53%', activeText: 'text-white' },
  green: { name: 'Green', c400: '142 71% 55%', c500: '142 71% 45%', c600: '142 71% 39%', activeText: 'text-white' },
  pink: { name: 'Pink', c400: '325 91% 75%', c500: '325 91% 65%', c600: '325 91% 53%', activeText: 'text-white' },
  cyan: { name: 'Cyan', c400: '185 83% 65%', c500: '185 83% 55%', c600: '185 83% 48%', activeText: 'text-black' },
};
