import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';
import { UserRole } from '../../types';
import { LanguageModal } from './LanguageModal';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { NotificationCenter } from './NotificationCenter';
import {
  Activity,
  Globe,
  Sliders,
  Monitor,
  UserCheck,
  Stethoscope,
  HeartPulse,
  FlaskConical,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const { currentUser, activeRole, logout, isKioskMode, setKioskMode } = useAuth();
  const { language, t } = useTranslation();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roles: Array<{ key: UserRole; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'PATIENT', label: t.roles.patient, icon: UserCheck },
    { key: 'DOCTOR', label: t.roles.doctor, icon: Stethoscope },
    { key: 'NURSE', label: t.roles.nurse, icon: HeartPulse },
    { key: 'LAB_TECHNICIAN', label: t.roles.labTechnician, icon: FlaskConical },
  ];

  const currentRoleObj = roles.find(r => r.key === activeRole) || roles[0];
  const RoleIcon = currentRoleObj.icon;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm px-4 md:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-brand-200 shrink-0">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg md:text-xl tracking-tight">AIHC</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200 rounded-full">
                  DPDP & ABDM Compliant
                </span>
              </div>
              <p className="hidden md:block text-xs font-medium text-slate-500">
                {activeRole === 'PATIENT' ? t.tagline : 'Clinical Decision-Support & Diagnostic System'}
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Language Switcher (Patient Only) */}
            {activeRole === 'PATIENT' && (
              <button
                type="button"
                onClick={() => setIsLangOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs md:text-sm font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-sm"
                title="Change Language"
                aria-label="Change Language"
              >
                <Globe className="w-4 h-4 text-brand-600" />
                <span>{language === 'ta' ? 'தமிழ்' : language === 'hi' ? 'हिन्दी' : 'English'}</span>
              </button>
            )}

            {/* Accessibility Settings (Patient Only) */}
            {activeRole === 'PATIENT' && (
              <button
                type="button"
                onClick={() => setIsAccessOpen(true)}
                className="p-2 md:px-3 md:py-2 flex items-center gap-1.5 text-xs md:text-sm font-medium rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-sm cursor-pointer"
                title={t.profile.accessibilitySettings}
                aria-label={t.profile.accessibilitySettings}
              >
                <Sliders className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">{t.profile.accessibilitySettings}</span>
              </button>
            )}

            {/* Kiosk Mode Toggle (Patient Only) */}
            {activeRole === 'PATIENT' && (
              <button
                type="button"
                onClick={() => setKioskMode(!isKioskMode)}
                className={`p-2 md:px-3 md:py-2 flex items-center gap-1.5 text-xs md:text-sm font-medium rounded-xl border transition-all shadow-sm cursor-pointer ${
                  isKioskMode
                    ? 'bg-purple-600 text-white border-purple-700 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={isKioskMode ? 'Exit Kiosk Mode' : 'Hospital Kiosk Mode'}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden lg:inline">{isKioskMode ? 'Exit Kiosk' : 'Kiosk Mode'}</span>
              </button>
            )}

            {/* Work Completion Notifications & Intimations */}
            <NotificationCenter />

            {/* Authenticated User Identity & Secure Logout (Strict RBAC: Must Log Out to Switch Role) */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-brand-50 text-brand-900 border border-brand-200 text-xs md:text-sm font-semibold">
                <RoleIcon className="w-4 h-4 text-brand-600 shrink-0" />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[11px] font-bold leading-tight truncate max-w-[130px]">
                    {currentUser.name || currentRoleObj.label}
                  </span>
                  <span className="font-mono text-[10px] text-brand-700 leading-tight">
                    {currentUser.patientId || currentUser.staffId || currentRoleObj.label}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout();
                  if (onLogout) onLogout();
                }}
                className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all shadow-sm flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title={t.profile.logoutBtn}
                aria-label={t.profile.logoutBtn}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">{t.profile.logoutBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <LanguageModal isOpen={isLangOpen} onClose={() => setIsLangOpen(false)} />
      <AccessibilityToolbar isOpen={isAccessOpen} onClose={() => setIsAccessOpen(false)} />
    </>
  );
};
