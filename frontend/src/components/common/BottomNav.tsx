import React from 'react';
import { useTranslation } from '../../i18n';
import { Home, History, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'history' | 'profile';
  onTabChange: (tab: 'home' | 'history' | 'profile') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  const items = [
    { id: 'home', label: t.dashboard.navHome, icon: Home },
    { id: 'history', label: t.dashboard.navHistory, icon: History },
    { id: 'profile', label: t.dashboard.navProfile, icon: User },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-6 py-2 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all ${
                isActive
                  ? 'text-brand-600 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className={`p-1 rounded-xl ${isActive ? 'bg-brand-50' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
