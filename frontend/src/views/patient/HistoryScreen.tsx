import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { Appointment } from '../../types';
import { TriageBadge } from '../../components/common/TriageBadge';
import { History, Calendar, Clock, Stethoscope, ArrowLeft, ChevronRight, FileText } from 'lucide-react';

interface HistoryScreenProps {
  onBack?: () => void;
  onViewAISummary?: (patientId: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack, onViewAISummary }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const patientId = currentUser.patientId || 'AIHC-7X9P26';

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const list = storageService.getAppointmentsForPatient(patientId);
    setAppointments(list);
  }, [patientId]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in space-y-6 pb-20 md:pb-8">
      <div className="flex items-center justify-between bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{t.history.title}</h2>
            <p className="text-xs text-slate-500">{t.history.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center space-y-2">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">{t.history.noHistory}</p>
          </div>
        ) : (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">{apt.id}</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {apt.hospital}
                  </span>
                  <TriageBadge level={apt.triagePriority} size="sm" />
                </div>

                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-brand-600" />
                  <h4 className="text-base font-bold text-slate-900">{apt.doctorName}</h4>
                  <span className="text-xs text-slate-500">({apt.department})</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{apt.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{apt.timeSlot}</span>
                  </span>
                  <span className="text-brand-600 font-semibold">
                    {t.history.status}: {apt.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                {onViewAISummary && apt.preConsultationStatus === 'COMPLETED' && (
                  <button
                    onClick={() => onViewAISummary(apt.patientId)}
                    className="py-2 px-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t.reports.aiSummary}</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
