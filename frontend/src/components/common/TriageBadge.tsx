import React from 'react';
import { TriageLevel } from '../../types';
import { AlertOctagon, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface TriageBadgeProps {
  level: TriageLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const TriageBadge: React.FC<TriageBadgeProps> = ({ level, size = 'md', showIcon = true }) => {
  const configs = {
    EMERGENCY: {
      bg: 'bg-red-50 text-red-700 border-red-200',
      dot: 'bg-red-600',
      label: 'Emergency (🔴 Level 1)',
      icon: AlertOctagon,
      pulse: true,
    },
    URGENT: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-500',
      label: 'Urgent (🟠 Level 2)',
      icon: AlertTriangle,
      pulse: false,
    },
    PRIORITY: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'Priority (🟡 Level 3)',
      icon: Clock,
      pulse: false,
    },
    NORMAL: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-600',
      label: 'Normal Health (🟢 Level 4)',
      icon: CheckCircle,
      pulse: false,
    },
  };

  const current = configs[level] || configs.NORMAL;
  const IconComponent = current.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs md:text-sm px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm md:text-base px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${current.bg} ${sizeClasses[size]} select-none`}
      role="status"
      aria-label={`Triage status: ${current.label}`}
    >
      <span className={`w-2 h-2 rounded-full ${current.dot} ${current.pulse ? 'animate-ping' : ''}`} />
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{current.label}</span>
    </span>
  );
};
