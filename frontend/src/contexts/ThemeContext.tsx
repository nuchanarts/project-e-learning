import { createContext, useContext, useEffect, useState } from 'react';

export interface ThemePreset {
  id: string;
  label: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryGlow: string;
  sidebarBg: string;
  sidebarActive: string;
  gradientPrimary: string;
  gradientHero: string;
}

export const THEMES: ThemePreset[] = [
  {
    id: 'blue',
    label: 'น้ำเงิน',
    primary: '#2563EB',
    primaryDark: '#1D4ED8',
    primaryLight: '#DBEAFE',
    primaryGlow: 'rgba(37,99,235,0.3)',
    sidebarBg: '#1B2B5E',
    sidebarActive: '#2563EB',
    gradientPrimary: 'linear-gradient(135deg,#2563EB 0%,#3B82F6 100%)',
    gradientHero: 'linear-gradient(135deg,#1B2B5E 0%,#1E40AF 50%,#2563EB 100%)',
  },
  {
    id: 'purple',
    label: 'ม่วง',
    primary: '#7C3AED',
    primaryDark: '#6D28D9',
    primaryLight: '#EDE9FE',
    primaryGlow: 'rgba(124,58,237,0.3)',
    sidebarBg: '#2E1065',
    sidebarActive: '#7C3AED',
    gradientPrimary: 'linear-gradient(135deg,#7C3AED 0%,#A78BFA 100%)',
    gradientHero: 'linear-gradient(135deg,#2E1065 0%,#4C1D95 50%,#7C3AED 100%)',
  },
  {
    id: 'green',
    label: 'เขียว',
    primary: '#059669',
    primaryDark: '#047857',
    primaryLight: '#D1FAE5',
    primaryGlow: 'rgba(5,150,105,0.3)',
    sidebarBg: '#064E3B',
    sidebarActive: '#059669',
    gradientPrimary: 'linear-gradient(135deg,#059669 0%,#34D399 100%)',
    gradientHero: 'linear-gradient(135deg,#064E3B 0%,#065F46 50%,#059669 100%)',
  },
  {
    id: 'rose',
    label: 'ชมพู',
    primary: '#E11D48',
    primaryDark: '#BE123C',
    primaryLight: '#FFE4E6',
    primaryGlow: 'rgba(225,29,72,0.3)',
    sidebarBg: '#4C0519',
    sidebarActive: '#E11D48',
    gradientPrimary: 'linear-gradient(135deg,#E11D48 0%,#FB7185 100%)',
    gradientHero: 'linear-gradient(135deg,#4C0519 0%,#881337 50%,#E11D48 100%)',
  },
  {
    id: 'orange',
    label: 'ส้ม',
    primary: '#EA580C',
    primaryDark: '#C2410C',
    primaryLight: '#FFEDD5',
    primaryGlow: 'rgba(234,88,12,0.3)',
    sidebarBg: '#431407',
    sidebarActive: '#EA580C',
    gradientPrimary: 'linear-gradient(135deg,#EA580C 0%,#FB923C 100%)',
    gradientHero: 'linear-gradient(135deg,#431407 0%,#7C2D12 50%,#EA580C 100%)',
  },
  {
    id: 'teal',
    label: 'เขียวน้ำทะเล',
    primary: '#0D9488',
    primaryDark: '#0F766E',
    primaryLight: '#CCFBF1',
    primaryGlow: 'rgba(13,148,136,0.3)',
    sidebarBg: '#042F2E',
    sidebarActive: '#0D9488',
    gradientPrimary: 'linear-gradient(135deg,#0D9488 0%,#2DD4BF 100%)',
    gradientHero: 'linear-gradient(135deg,#042F2E 0%,#134E4A 50%,#0D9488 100%)',
  },
];

function applyTheme(theme: ThemePreset) {
  const r = document.documentElement.style;
  r.setProperty('--primary', theme.primary);
  r.setProperty('--primary-dark', theme.primaryDark);
  r.setProperty('--primary-light', theme.primaryLight);
  r.setProperty('--primary-glow', theme.primaryGlow);
  r.setProperty('--sidebar-bg', theme.sidebarBg);
  r.setProperty('--sidebar-active', theme.sidebarActive);
  r.setProperty('--gradient-primary', theme.gradientPrimary);
  r.setProperty('--gradient-hero', theme.gradientHero);
}

interface ThemeContextValue {
  themeId: string;
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ themeId: 'blue', setTheme: () => {} });

const STORAGE_KEY = 'bgs_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? 'blue';
  });

  useEffect(() => {
    const preset = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
    applyTheme(preset);
    localStorage.setItem(STORAGE_KEY, themeId);
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ themeId, setTheme: setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
