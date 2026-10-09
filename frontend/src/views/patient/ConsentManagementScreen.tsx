import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { dpdpService } from '../../services/dpdpService';
import { ABDMConsent } from '../../types';
import { ShieldCheck, ShieldAlert, ArrowLeft, CheckCircle2, Lock, Trash2, RefreshCw } from 'lucide-react';

interface ConsentManagementScreenProps {
  onBack: () => void;
}

export const ConsentManagementScreen: React.FC<ConsentManagementScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const patientId = currentUser.patientId || 'AIHC-7X9P26';

  const [consent, setConsent] = useState<ABDMConsent>(() => dpdpService.getConsent(patientId));
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGrantConsent = () => {
    const updated = dpdpService.saveConsent(patientId, 'GRANTED', ['REPORTS', 'OPD_SUMMARY', 'PRESCRIPTIONS']);
    setConsent(updated);
    setSuccessMsg('ABDM Health Information Sharing Consent has been granted.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleWithdrawConsent = () => {
    if (window.confirm('Are you sure you want to withdraw your ABDM health sharing consent? Consulting doctors will not receive automated health locker access.')) {
      const updated = dpdpService.withdrawConsent(patientId);
      setConsent(updated);
      setSuccessMsg('ABDM Consent successfully withdrawn under DPDP Act provisions.');
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 animate-fade-in space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Consent Management</h2>
            <p className="text-xs text-slate-500">DPDP Act (2023) Health Data Privacy & ABDM Linkage</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center gap-2 animate-scale-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Consent Status Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Current Status</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black ${
              consent.status === 'GRANTED'
                ? 'bg-emerald-100 text-emerald-800'
                : consent.status === 'WITHDRAWN'
                ? 'bg-red-100 text-red-800'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {consent.status}
          </span>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Patient Identifier:</span>
            <span className="font-mono font-bold text-slate-900">{patientId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Consent Policy Version:</span>
            <span className="font-semibold text-slate-900">{consent.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Last Action Timestamp:</span>
            <span className="font-medium text-slate-700">{new Date(consent.timestamp).toLocaleString()}</span>
          </div>
          <div className="pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-500 block mb-1">Permitted Purpose:</span>
            <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-800 font-medium">
              {consent.purpose}
            </p>
          </div>
        </div>

        {/* DPDP Legal Rights Notice */}
        <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-100 text-xs text-brand-950 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-brand-800">
            <Lock className="w-4 h-4 text-brand-600 shrink-0" />
            <span>DPDP Act Patient Rights</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            You retain complete ownership of your personal health data. You have the statutory right to withdraw consent at any time without penalty or denial of hospital emergency care.
          </p>
        </div>

        {/* Buttons */}
        <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
          {consent.status === 'GRANTED' ? (
            <button
              onClick={handleWithdrawConsent}
              className="w-full sm:w-auto flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl text-xs border border-red-200 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.abdmConsent.withdrawConsent}</span>
            </button>
          ) : (
            <button
              onClick={handleGrantConsent}
              className="w-full sm:w-auto flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.abdmConsent.allowConsent}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
