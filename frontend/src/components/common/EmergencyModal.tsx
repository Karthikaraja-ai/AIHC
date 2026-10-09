import React from 'react';
import { useEmergency } from '../../context/EmergencyContext';
import { useAuth } from '../../context/AuthContext';
import { AlertOctagon, BellRing, Check, ArrowRight } from 'lucide-react';

interface EmergencyModalProps {
  onSelectPatient?: (patientId: string) => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ onSelectPatient }) => {
  const { activeAlerts, acknowledgeAlert } = useEmergency();
  const { currentUser, activeRole } = useAuth();

  // Show only on Doctor and Nurse screens
  if (activeRole !== 'DOCTOR' && activeRole !== 'NURSE') return null;

  const unacknowledgedAlerts = activeAlerts.filter(a => a.status === 'ACTIVE');
  if (unacknowledgedAlerts.length === 0) return null;

  const latestAlert = unacknowledgedAlerts[0];

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-lg w-full p-4 animate-bounce-short">
      <div className="bg-red-600 text-white rounded-3xl p-5 shadow-2xl border-2 border-red-400 ring-4 ring-red-500/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white text-red-600 rounded-2xl animate-pulse shadow-md">
              <AlertOctagon className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase bg-red-800/80 px-2 py-0.5 rounded-full">
                  CRITICAL RED FLAG
                </span>
                <span className="text-xs text-red-200">
                  {new Date(latestAlert.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-lg font-black mt-0.5">EMERGENCY ALERT (🔴 Level 1)</h3>
            </div>
          </div>
          <BellRing className="w-5 h-5 text-red-200 animate-spin" />
        </div>

        <div className="mt-3 p-3 bg-red-700/60 rounded-2xl border border-red-400/40 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-red-200 text-xs">Patient ID:</span>
            <span className="font-mono font-bold tracking-wider">{latestAlert.patientId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-red-200 text-xs">Patient Name:</span>
            <span className="font-semibold">{latestAlert.patientName}</span>
          </div>
          <div className="pt-1 border-t border-red-600/60">
            <span className="text-xs text-red-200 block">Identified Condition:</span>
            <span className="font-semibold text-white">{latestAlert.symptomSummary}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {onSelectPatient && (
            <button
              onClick={() => onSelectPatient(latestAlert.patientId)}
              className="flex-1 py-2.5 px-4 bg-white hover:bg-red-50 text-red-700 font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>Open Patient Case</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => acknowledgeAlert(latestAlert.id, currentUser.name)}
            className="py-2.5 px-4 bg-red-800 hover:bg-red-900 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-1.5 border border-red-500 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Acknowledge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
