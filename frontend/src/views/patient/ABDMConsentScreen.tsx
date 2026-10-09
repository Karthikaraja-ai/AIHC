import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import { dpdpService } from '../../services/dpdpService';
import { VoiceButton } from '../../components/common/VoiceButton';
import { ShieldCheck, CheckCircle2, XCircle, Info, Lock, ArrowRight } from 'lucide-react';

interface ABDMConsentScreenProps {
  patientId: string;
  onConsentDecided: (status: 'GRANTED' | 'SKIPPED') => void;
}

export const ABDMConsentScreen: React.FC<ABDMConsentScreenProps> = ({
  patientId,
  onConsentDecided,
}) => {
  const { t } = useTranslation();
  const [showLearnMore, setShowLearnMore] = useState(false);

  const handleAllow = () => {
    dpdpService.saveConsent(patientId, 'GRANTED', ['REPORTS', 'OPD_SUMMARY', 'PRESCRIPTIONS']);
    onConsentDecided('GRANTED');
  };

  const handleSkip = () => {
    dpdpService.saveConsent(patientId, 'SKIPPED', []);
    onConsentDecided('SKIPPED');
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t.abdmConsent.title}</h2>
              <p className="text-xs text-slate-500">{t.abdmConsent.subtitle}</p>
            </div>
          </div>
          <VoiceButton
            textToSpeak={`${t.abdmConsent.title}. ${t.abdmConsent.explanation} ${t.abdmConsent.dpdpNotice}`}
            showSpeak={false}
            size="sm"
          />
        </div>

        {/* Primary Explanation */}
        <div className="p-5 bg-gradient-to-br from-brand-50/70 to-purple-50/50 rounded-2xl border border-brand-100/80 space-y-3">
          <p className="text-sm text-slate-800 font-semibold leading-relaxed">
            "{t.abdmConsent.explanation}"
          </p>
          <div className="flex items-start gap-2 pt-2 border-t border-brand-200/50 text-xs text-brand-900">
            <Lock className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <span>{t.abdmConsent.dpdpNotice}</span>
          </div>
        </div>

        {/* Purposes */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t.abdmConsent.purposeTitle}
          </h4>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{t.abdmConsent.purpose1}</span>
            </div>
            <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{t.abdmConsent.purpose2}</span>
            </div>
          </div>
        </div>

        {/* Learn More Accordion */}
        {showLearnMore && (
          <div className="p-4 bg-slate-100 rounded-2xl text-xs text-slate-700 space-y-2 animate-fade-in">
            <p className="font-bold text-slate-900">DPDP Act (2023) Privacy Protections:</p>
            <ul className="list-disc pl-5 space-y-1 text-[11px]">
              <li><b>Purpose Limitation:</b> Your health data is only accessed by your authorized consulting clinicians.</li>
              <li><b>No Forced Linking:</b> You can use our hospital services freely even if you skip ABDM linking.</li>
              <li><b>Consent Withdrawal:</b> You can revoke permission anytime from your Patient Profile.</li>
              <li><b>Audit Logging:</b> Every access is permanently logged in tamper-evident clinical audit trails.</li>
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleAllow}
            className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{t.abdmConsent.allowConsent}</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all text-xs"
            >
              {t.abdmConsent.skipConsent}
            </button>
            <button
              onClick={() => setShowLearnMore(!showLearnMore)}
              className="py-3 px-4 text-brand-600 hover:bg-brand-50 rounded-2xl text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Info className="w-4 h-4" />
              <span>{showLearnMore ? 'Hide Details' : t.abdmConsent.learnMore}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
