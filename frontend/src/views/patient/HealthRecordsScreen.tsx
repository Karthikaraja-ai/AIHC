import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { PatientVitals } from '../../types';
import { Activity, Heart, Thermometer, Wind, Droplets, ShieldCheck, ArrowLeft } from 'lucide-react';

interface HealthRecordsScreenProps {
  onBack?: () => void;
}

export const HealthRecordsScreen: React.FC<HealthRecordsScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const patientId = currentUser.patientId || 'AIHC-7X9P26';

  const [vitalsList, setVitalsList] = useState<PatientVitals[]>([]);

  useEffect(() => {
    const list = storageService.getVitalsForPatient(patientId);
    setVitalsList(list);
  }, [patientId]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in space-y-6 pb-20 md:pb-8">
      {/* Header */}
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
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{t.healthRecords.title}</h2>
            <p className="text-xs text-slate-500">{t.healthRecords.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Vitals Feed */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">{t.healthRecords.vitalsHistory}</h3>
        {vitalsList.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center text-xs text-slate-400">
            {t.healthRecords.noRecords}
          </div>
        ) : (
          vitalsList.map((v) => (
            <div key={v.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between text-xs pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-800">
                  {t.healthRecords.recordedBy}: <span className="text-brand-600">{v.recordedBy}</span>
                </span>
                <span className="text-slate-400 font-medium">
                  {new Date(v.recordedAt).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {/* BP */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    <span>{t.healthRecords.bp}</span>
                  </div>
                  <p className="text-base font-extrabold text-slate-900">
                    {v.bpSystolic}/{v.bpDiastolic} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
                  </p>
                </div>

                {/* Pulse */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Activity className="w-3.5 h-3.5 text-purple-500" />
                    <span>{t.healthRecords.pulse}</span>
                  </div>
                  <p className="text-base font-extrabold text-slate-900">
                    {v.pulse} <span className="text-[10px] font-normal text-slate-400">bpm</span>
                  </p>
                </div>

                {/* SpO2 */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Wind className="w-3.5 h-3.5 text-sky-500" />
                    <span>{t.healthRecords.spo2}</span>
                  </div>
                  <p className="text-base font-extrabold text-slate-900">
                    {v.spo2}%
                  </p>
                </div>

                {/* Temperature */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.healthRecords.temp}</span>
                  </div>
                  <p className="text-base font-extrabold text-slate-900">
                    {v.temperature} <span className="text-[10px] font-normal text-slate-400">°F</span>
                  </p>
                </div>

                {/* Blood Sugar */}
                {v.bloodSugar && (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                      <Droplets className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t.healthRecords.sugar}</span>
                    </div>
                    <p className="text-base font-extrabold text-slate-900">
                      {v.bloodSugar} <span className="text-[10px] font-normal text-slate-400">mg/dL</span>
                    </p>
                  </div>
                )}
              </div>

              {v.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">{t.roles.nurse}:</span> {v.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
