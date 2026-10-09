import React, { createContext, useContext, useState, useEffect } from 'react';

export type TextSize = 'normal' | 'large' | 'xlarge';
export type VoiceSpeed = 'slow' | 'normal' | 'fast';

interface AccessibilityContextType {
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  voiceSpeed: VoiceSpeed;
  setVoiceSpeed: (speed: VoiceSpeed) => void;
  autoSpeakPrompts: boolean;
  setAutoSpeakPrompts: (enabled: boolean) => void;
  speechRateMultiplier: number;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem('aihc_high_contrast') === 'true';
  });

  const [textSize, setTextSizeState] = useState<TextSize>(() => {
    return (localStorage.getItem('aihc_text_size') as TextSize) || 'normal';
  });

  const [voiceSpeed, setVoiceSpeedState] = useState<VoiceSpeed>(() => {
    return (localStorage.getItem('aihc_voice_speed') as VoiceSpeed) || 'normal';
  });

  const [autoSpeakPrompts, setAutoSpeakPromptsState] = useState<boolean>(() => {
    return localStorage.getItem('aihc_auto_speak') === 'true';
  });

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    localStorage.setItem('aihc_high_contrast', enabled ? 'true' : 'false');
    if (enabled) {
      document.documentElement.classList.add('contrast-more');
    } else {
      document.documentElement.classList.remove('contrast-more');
    }
  };

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem('aihc_text_size', size);
    document.documentElement.classList.remove('text-scale-large', 'text-scale-xlarge');
    if (size === 'large') document.documentElement.classList.add('text-scale-large');
    if (size === 'xlarge') document.documentElement.classList.add('text-scale-xlarge');
  };

  const setVoiceSpeed = (speed: VoiceSpeed) => {
    setVoiceSpeedState(speed);
    localStorage.setItem('aihc_voice_speed', speed);
  };

  const setAutoSpeakPrompts = (enabled: boolean) => {
    setAutoSpeakPromptsState(enabled);
    localStorage.setItem('aihc_auto_speak', enabled ? 'true' : 'false');
  };

  const speechRateMultiplier = voiceSpeed === 'slow' ? 0.75 : voiceSpeed === 'fast' ? 1.15 : 0.92;

  useEffect(() => {
    if (highContrast) document.documentElement.classList.add('contrast-more');
    if (textSize === 'large') document.documentElement.classList.add('text-scale-large');
    if (textSize === 'xlarge') document.documentElement.classList.add('text-scale-xlarge');
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        setHighContrast,
        textSize,
        setTextSize,
        voiceSpeed,
        setVoiceSpeed,
        autoSpeakPrompts,
        setAutoSpeakPrompts,
        speechRateMultiplier,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
