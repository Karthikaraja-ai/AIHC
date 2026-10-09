import React from 'react';
import { useTranslation } from '../../i18n';
import { LanguageCode } from '../../types';
import { Globe, Check, X } from 'lucide-react';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t } = useTranslation();

  if (!isOpen) return null;

  const languagesList: Array<{ code: LanguageCode; nativeName: string; subtext: string }> = [
    { code: 'ta', nativeName: 'தமிழ்', subtext: 'தமிழ் மொழி இடைமுகம் மற்றும் குரல் ஆதரவு' },
    { code: 'en', nativeName: 'English', subtext: 'Standard English interface & voice prompts' },
    { code: 'hi', nativeName: 'हिन्दी', subtext: 'हिन्दी भाषा इंटरफेस और आवाज़ सहायता' },
  ];

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-2xl">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t.profile.languageSetting}</h2>
              <p className="text-xs text-slate-500">
                {language === 'ta'
                  ? 'மருத்துவ ஆலோசனைக்கான மொழியைத் தேர்ந்தெடுக்கவும்'
                  : language === 'hi'
                  ? 'परामर्श के लिए अपनी भाषा चुनें'
                  : 'Choose your preferred language for consultation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 my-6">
          {languagesList.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                onClick={() => handleSelect(item.code)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/70 shadow-sm'
                    : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-900">{item.nativeName}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.subtext}</p>
                </div>
                {isSelected && (
                  <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-2xl transition-all shadow-md active:scale-98 cursor-pointer"
        >
          {t.common.confirm}
        </button>
      </div>
    </div>
  );
};
