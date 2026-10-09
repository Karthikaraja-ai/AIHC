import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService, Intimation } from '../../services/notificationService';
import { Bell, CheckCheck, Clock, CheckCircle2, Sparkles, HeartPulse, Stethoscope, FlaskConical, X } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { currentUser, activeRole } = useAuth();
  const identifier = currentUser.patientId || currentUser.staffId;

  const [notifications, setNotifications] = useState<Intimation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<Intimation | null>(null);

  const refresh = () => {
    setNotifications(notificationService.getNotificationsForUser(activeRole, identifier));
  };

  useEffect(() => {
    refresh();

    const handleNew = (e: any) => {
      const item: Intimation = e.detail;
      if (item.recipientRole === activeRole || item.recipientRole === 'ALL') {
        refresh();
        setActiveToast(item);
        setTimeout(() => setActiveToast(null), 6000);
      }
    };

    const handleUpdated = () => refresh();

    window.addEventListener('aihc_new_intimation', handleNew);
    window.addEventListener('aihc_notifications_updated', handleUpdated);

    return () => {
      window.removeEventListener('aihc_new_intimation', handleNew);
      window.removeEventListener('aihc_notifications_updated', handleUpdated);
    };
  }, [activeRole, identifier]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    notificationService.markAllAsReadForRole(activeRole);
    refresh();
  };

  const getWorkIcon = (type: Intimation['workType']) => {
    switch (type) {
      case 'AI_PRE_CONSULTATION_COMPLETED':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'VITALS_RECORDED':
        return <HeartPulse className="w-4 h-4 text-pink-600" />;
      case 'DOCTOR_CONSULTATION_SIGNED':
        return <Stethoscope className="w-4 h-4 text-brand-600" />;
      case 'LAB_REPORT_COMPLETED':
        return <FlaskConical className="w-4 h-4 text-sky-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <>
      {/* Top Bar Bell Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 rounded-xl flex items-center justify-center border transition-all relative ${
            unreadCount > 0
              ? 'bg-brand-50 text-brand-700 border-brand-200'
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
          }`}
          title="Work Completion Notifications & Intimations"
          aria-label="Work Completion Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-40 animate-fade-in space-y-2">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">Work Intimations</h4>
                  <p className="text-[11px] text-slate-400">Completion notices for {activeRole}</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 px-2">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No work notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => notificationService.markAsRead(n.id)}
                      className={`p-3 rounded-2xl transition-colors cursor-pointer space-y-1 ${
                        !n.isRead ? 'bg-brand-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-white shadow-xs">
                            {getWorkIcon(n.workType)}
                          </div>
                          <span className="text-xs font-bold text-slate-900 leading-tight">
                            {n.title}
                          </span>
                        </div>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 pl-8 leading-snug">
                        {n.message}
                      </p>
                      <div className="pl-8 text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Real-Time Intimation Toast */}
      {activeToast && (
        <div className="fixed top-16 right-4 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-3xl shadow-2xl border border-slate-700 animate-scale-in flex items-start gap-3">
          <div className="p-2 bg-brand-600 rounded-xl shrink-0 mt-0.5">
            {getWorkIcon(activeToast.workType)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-brand-300 uppercase tracking-wider">
                Work Completion Intimation
              </span>
              <button
                onClick={() => setActiveToast(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <h5 className="text-xs font-bold text-white mt-0.5 truncate">{activeToast.title}</h5>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">{activeToast.message}</p>
          </div>
        </div>
      )}
    </>
  );
};
