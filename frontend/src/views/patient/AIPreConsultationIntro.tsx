import React from 'react';
import { useTranslation } from '../../i18n';
import { VoiceButton } from '../../components/common/VoiceButton';
import { Sparkles, ShieldAlert, ArrowRight, ArrowLeft, HeartPulse, CheckCircle2 } from 'lucide-react';

interface AIPreConsultationIntroProps {
  onStart: () => void;
  onBack: () => void;
}

export const AIPreConsultationIntro: React.FC<AIPreConsultationIntroProps> = ({ onStart, onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <VoiceButton
            textToSpeak={`${t.aiPreConsultation.introTitle}. ${t.aiPreConsultation.introSubtitle} ${t.aiPreConsultation.disclaimer}`}
            showSpeak={false}
            size="sm"
          />
        </div>

        {/* Icon & Title */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-brand-600 flex items-center justify-center text-white shadow-xl shadow-purple-200">
            <Sparkles className="w-10 h-10 stroke-[2.2]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {t.aiPreConsultation.introTitle}
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
            {t.aiPreConsultation.introSubtitle}
          </p>
        </div>

        {/* Important Clinical Disclaimer */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Clinical Safety Notice</span>
          </div>
          <p className="leading-relaxed">
            {t.aiPreConsultation.disclaimer}
          </p>
        </div>

        {/* Benefits List */}
        <div className="space-y-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>One simple question per screen with large touch targets</span>
          </div>
          <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
            <HeartPulse className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Interactive body map & voice input in Tamil, English, and Hindi</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onStart}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-700 hover:to-brand-700 active:scale-98 text-white font-extrabold rounded-2xl shadow-xl shadow-purple-200 transition-all flex items-center justify-center gap-2 text-base"
        >
          <span>{t.aiPreConsultation.startConsultation}</span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
};
