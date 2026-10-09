import React from 'react';
import { useTranslation } from '../../i18n';
import { Activity, ArrowRight, UserPlus, LogIn, Heart } from 'lucide-react';

interface SplashScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted, onLogin }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10 text-center space-y-6">

        {/* Hero Illustration / Icon */}
        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-brand-200">
          <Activity className="w-12 h-12 stroke-[2.5]" />
          <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 text-white rounded-2xl shadow-md">
            <Heart className="w-4 h-4 fill-white" />
          </div>
        </div>

        {/* Headlines */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.splash.welcome}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
            {t.splash.subtitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onGetStarted}
            className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <UserPlus className="w-5 h-5" />
            <span>{t.splash.getStarted}</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>

          <button
            onClick={onLogin}
            className="w-full py-3.5 px-6 bg-slate-50 hover:bg-slate-100 active:scale-98 text-slate-700 font-semibold rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-brand-600" />
            <span>{t.splash.loginButton}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
