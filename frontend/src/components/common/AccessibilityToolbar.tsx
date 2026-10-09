import React from 'react';
import { useAccessibility, TextSize, VoiceSpeed } from '../../context/AccessibilityContext';
import { useTranslation } from '../../i18n';
import { Sliders, Eye, Type, Volume2, X } from 'lucide-react';

interface AccessibilityToolbarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({ isOpen, onClose }) => {
  const {
    highContrast,
    setHighContrast,
    textSize,
    setTextSize,
    voiceSpeed,
    setVoiceSpeed,
    autoSpeakPrompts,
    setAutoSpeakPrompts,
  } = useAccessibility();
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-2xl">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Accessibility Settings</h2>
              <p className="text-xs text-slate-500">Visual, voice, and touch adjustments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 my-6">
          {/* High Contrast */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-brand-600" />
              <div>
                <p className="font-semibold text-slate-900">{t.common.highContrast}</p>
                <p className="text-xs text-slate-500">Sharper borders and darker text</p>
              </div>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
                highContrast ? 'bg-brand-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                  highContrast ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Text Size */}
          <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-brand-600" />
              <p className="font-semibold text-slate-900">{t.common.textSize}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'large', 'xlarge'] as TextSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setTextSize(size)}
                  className={`py-2 px-3 rounded-xl font-medium text-sm border-2 transition-all ${
                    textSize === size
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {size === 'normal' ? 'Normal' : size === 'large' ? 'Large (115%)' : 'X-Large (130%)'}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Speed */}
          <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-brand-600" />
              <p className="font-semibold text-slate-900">{t.common.voiceSpeed}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['slow', 'normal', 'fast'] as VoiceSpeed[]).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setVoiceSpeed(spd)}
                  className={`py-2 px-3 rounded-xl font-medium text-sm border-2 transition-all capitalize ${
                    voiceSpeed === spd
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>

          {/* Auto speak prompt */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <div>
              <p className="font-semibold text-slate-900">Auto-Read Questions</p>
              <p className="text-xs text-slate-500">Automatically speak each question on screen load</p>
            </div>
            <button
              onClick={() => setAutoSpeakPrompts(!autoSpeakPrompts)}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
                autoSpeakPrompts ? 'bg-brand-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform ${
                  autoSpeakPrompts ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl transition-all shadow-md active:scale-98"
        >
          {t.common.save}
        </button>
      </div>
    </div>
  );
};
