import React from 'react';
import { useTranslation } from '../../i18n';
import { PatientProfile } from '../../types';
import { CheckCircle2, Copy, ArrowRight, ShieldCheck } from 'lucide-react';

interface RegistrationSuccessScreenProps {
  patientProfile: PatientProfile;
  onContinueToConsent: () => void;
  onGoToLogin: () => void;
}

export const RegistrationSuccessScreen: React.FC<RegistrationSuccessScreenProps> = ({
  patientProfile,
  onContinueToConsent,
  onGoToLogin,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(patientProfile.patientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 md:p-8 animate-scale-in">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10 text-center space-y-6">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-100">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900">{t.auth.registrationSuccess}</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
            Welcome to AIHC Healthcare, <span className="text-slate-900 font-bold">{patientProfile.fullName}</span>.
          </p>
          {(patientProfile.age || patientProfile.sex) && (
            <div className="flex items-center justify-center gap-2 mt-2">
              {patientProfile.age && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {patientProfile.age} yrs ({patientProfile.age < 18 ? 'Child' : patientProfile.age >= 60 ? 'Senior' : 'Adult'})
                </span>
              )}
              {patientProfile.sex && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 uppercase">
                  {patientProfile.sex}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Prominent Unique Patient ID Display Card */}
        <div className="p-6 bg-gradient-to-br from-brand-50 to-indigo-50/60 rounded-3xl border-2 border-brand-200 shadow-sm space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
            {t.auth.uniqueIdLabel}
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-3xl md:text-4xl font-black tracking-widest text-brand-900 selection:bg-brand-500">
              {patientProfile.patientId}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-white text-brand-600 hover:bg-brand-100 shadow-sm border border-brand-200 transition-all"
              title="Copy Patient ID"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          {copied && (
            <p className="text-xs font-bold text-emerald-600 animate-fade-in">
              Copied to clipboard!
            </p>
          )}
          <p className="text-xs text-slate-500 pt-1">
            {t.auth.saveIdNote}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onContinueToConsent}
            className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2 text-sm active:scale-98"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{t.auth.goToConsent}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onGoToLogin}
            className="w-full py-3.5 px-6 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-2xl border border-slate-200 transition-all text-xs active:scale-98"
          >
            <span>{t.auth.goToLogin}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
