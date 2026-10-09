import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { LogIn, AlertCircle, Activity, Monitor, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onGoToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGoToRegister,
}) => {
  const { t } = useTranslation();
  const { loginWithCredentials, setKioskMode } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim().toUpperCase();
    if (!cleanId) {
      setErrorMessage('Please enter your Unique ID.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginWithCredentials(cleanId, password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(result.error || 'Invalid Unique ID or Password.');
      }
    } catch (err) {
      setErrorMessage('Login failed. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 space-y-6">
        {/* Title Card - ONLY Existing Project Logo and Project Name */}
        <div className="text-center pb-4 border-b border-slate-100 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-md shadow-brand-200">
            <Activity className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t.appName}
          </h1>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3.5 bg-red-50 text-red-700 rounded-2xl text-xs border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Single Common Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Unique ID (Patient ID or Staff ID) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
              placeholder="Unique ID"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-brand-600 text-sm font-mono uppercase font-bold tracking-wider"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">
                Password <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Password reset link dispatched to registered mobile number via SMS.')}
                className="text-[11px] text-brand-600 hover:underline font-semibold"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-brand-600 text-sm font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2 text-sm active:scale-98 cursor-pointer"
          >
            <LogIn className="w-5 h-5" />
            <span>{isSubmitting ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don't have a Unique ID yet?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
              className="text-brand-600 font-bold hover:underline"
            >
              Register Here (Patient / Doctor / Nurse / Lab Tech)
            </button>
          </p>
        </div>
      </div>

      {/* SMART KIOSK TERMINAL - BELOW LOGIN PAGE */}
      <div className="max-w-lg w-full mt-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-5 md:p-6 shadow-xl border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 animate-scale-in">
        <div className="flex items-center gap-4 text-left w-full sm:w-auto">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-500/30">
            <Monitor className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white">
                Hospital Smart Kiosk
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white uppercase tracking-wider">
                Touch OPD
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-0.5">
              Walk-in Patients • Name & Number Registration • Appointment Booking • Report Scanner
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setKioskMode(true)}
          className="w-full sm:w-auto py-3 px-5 bg-gradient-to-r from-brand-500 to-indigo-500 hover:from-brand-600 hover:to-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>Open Smart Kiosk</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
