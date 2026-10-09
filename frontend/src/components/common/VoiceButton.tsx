import React, { useState } from 'react';
import { Volume2, Mic, Square, RotateCcw } from 'lucide-react';
import { voiceService, RecognizedSpeechResult } from '../../services/voiceService';
import { useTranslation } from '../../i18n';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';

interface VoiceButtonProps {
  textToSpeak?: string;
  onSpeechResult?: (result: RecognizedSpeechResult) => void;
  showListen?: boolean;
  showSpeak?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  textToSpeak,
  onSpeechResult,
  showListen = true,
  showSpeak = true,
  size = 'md',
  className = '',
}) => {
  const { activeRole } = useAuth();
  const { language, t } = useTranslation();
  const { speechRateMultiplier } = useAccessibility();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Strictly enforce: Voice controls are for PATIENT only
  if (activeRole !== 'PATIENT') {
    return null;
  }

  const handleListen = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!textToSpeak) return;

    if (isPlaying) {
      voiceService.stopSpeaking();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    await voiceService.speak(textToSpeak, language, speechRateMultiplier);
    setIsPlaying(false);
  };

  const handleToggleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isListening) {
      voiceService.stopSpeaking();
      setIsListening(false);
      return;
    }

    setErrorMessage(null);
    setIsListening(true);

    const stopFn = voiceService.startListening(
      language,
      (result) => {
        setIsListening(false);
        if (onSpeechResult) {
          onSpeechResult(result);
        }
      },
      (err) => {
        setIsListening(false);
        setErrorMessage(err);
        setTimeout(() => setErrorMessage(null), 4000);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const buttonSizeClasses = {
    sm: 'p-1.5 text-xs gap-1',
    md: 'px-3 py-2 text-sm gap-1.5',
    lg: 'px-4 py-3 text-base gap-2 font-medium',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* 🔊 Listen Button */}
      {showListen && textToSpeak && (
        <button
          type="button"
          onClick={handleListen}
          className={`inline-flex items-center rounded-xl font-medium transition-all shadow-sm active:scale-95 ${
            buttonSizeClasses[size]
          } ${
            isPlaying
              ? 'bg-brand-600 text-white animate-pulse'
              : 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200'
          }`}
          title={t.common.listen}
          aria-label={t.common.listen}
        >
          <Volume2 className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
          <span>{isPlaying ? t.common.stop : t.common.listen}</span>
        </button>
      )}

      {/* 🎤 Speak Button */}
      {showSpeak && onSpeechResult && (
        <button
          type="button"
          onClick={handleToggleSpeak}
          className={`inline-flex items-center rounded-xl font-medium transition-all shadow-sm active:scale-95 ${
            buttonSizeClasses[size]
          } ${
            isListening
              ? 'bg-red-600 text-white animate-bounce ring-4 ring-red-200'
              : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200'
          }`}
          title={t.common.speak}
          aria-label={t.common.speak}
        >
          {isListening ? (
            <>
              <Square className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
              <span>{t.common.stop}</span>
            </>
          ) : (
            <>
              <Mic className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
              <span>{t.common.speak}</span>
            </>
          )}
        </button>
      )}

      {errorMessage && (
        <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md">
          {errorMessage}
        </span>
      )}
    </div>
  );
};
