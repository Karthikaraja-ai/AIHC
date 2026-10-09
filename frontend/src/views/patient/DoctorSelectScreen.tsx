import React from 'react';
import { useTranslation } from '../../i18n';
import { MedicineSystem, Hospital, DoctorDirectoryEntry } from '../../types';
import { directoryService } from '../../services/directoryService';
import { VoiceButton } from '../../components/common/VoiceButton';
import {
  Stethoscope,
  Clock,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  UserCheck,
} from 'lucide-react';

interface DoctorSelectScreenProps {
  medicineSystem: MedicineSystem;
  hospital?: Hospital;
  isKiosk?: boolean;
  onSelectDoctor: (doctor: DoctorDirectoryEntry) => void;
  onBack: () => void;
}

export const DoctorSelectScreen: React.FC<DoctorSelectScreenProps> = ({
  medicineSystem,
  hospital,
  isKiosk = false,
  onSelectDoctor,
  onBack,
}) => {
  const { language, t } = useTranslation();

  // If in kiosk mode, we fetch doctors for this department; on mobile, we filter by selected hospital
  const doctors = directoryService.getDoctorsBySystem(medicineSystem, isKiosk ? undefined : hospital?.id);

  const hospitalName = hospital ? (hospital.name[language] || hospital.name.en) : 'AIHC Medical Center';

  const titleText = isKiosk ? t.doctorSelect.kioskTitle : t.doctorSelect.title;
  const subtitleText = isKiosk ? t.doctorSelect.kioskSubtitle : t.doctorSelect.subtitle;

  return (
    <div className={`max-w-4xl mx-auto p-4 md:p-6 animate-fade-in space-y-6 ${isKiosk ? 'text-white' : ''}`}>
      {/* Top Header */}
      <div className={`rounded-3xl p-5 md:p-6 border shadow-sm flex items-center justify-between ${
        isKiosk ? 'bg-white/10 border-white/20' : 'bg-white border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`p-2 rounded-full transition-colors ${
              isKiosk ? 'text-purple-200 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={`text-xl md:text-2xl font-black tracking-tight ${isKiosk ? 'text-white' : 'text-slate-900'}`}>
                {titleText}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-600 text-white shadow-sm">
                {medicineSystem.replace('_', ' ')}
              </span>
            </div>
            <p className={`text-xs md:text-sm font-medium ${isKiosk ? 'text-purple-200' : 'text-slate-500'}`}>
              {subtitleText} {!isKiosk && `• ${hospitalName}`}
            </p>
          </div>
        </div>

        <VoiceButton
          textToSpeak={`${titleText}. ${subtitleText}. Select the doctor you wish to consult.`}
          showSpeak={false}
          size="md"
        />
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {doctors.map((doctor) => {
          const docName = doctor.name[language] || doctor.name.en;
          const dept = doctor.department[language] || doctor.department.en;
          const exp = doctor.experience[language] || doctor.experience.en;

          return (
            <div
              key={doctor.id}
              onClick={() => onSelectDoctor(doctor)}
              className={`rounded-3xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between gap-4 group ${
                isKiosk
                  ? 'bg-white/10 border-white/20 hover:border-brand-400 hover:bg-white/15'
                  : 'bg-white border-slate-100 hover:border-brand-300 hover:shadow-lg'
              }`}
            >
              {/* Doctor Header Info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    isKiosk ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600 border border-brand-200'
                  }`}>
                    <Stethoscope className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className={`text-base md:text-lg font-black leading-snug ${isKiosk ? 'text-white' : 'text-slate-900'}`}>
                      {docName}
                    </h3>
                    <p className="text-xs font-extrabold text-brand-500">
                      {doctor.qualification}
                    </p>
                    <p className={`text-xs font-medium mt-0.5 leading-snug ${isKiosk ? 'text-purple-200' : 'text-slate-500'}`}>
                      {dept}
                    </p>
                  </div>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <VoiceButton
                    textToSpeak={`${docName}, ${doctor.qualification}. Department: ${dept}. ${doctor.roomNumber}. ${exp}. Status: ${doctor.status === 'AVAILABLE' ? 'Available now' : 'In consultation'}.`}
                    showSpeak={false}
                    size="sm"
                  />
                </div>
              </div>

              {/* Badges & Consultation Metrics */}
              <div className="space-y-2 pt-2 border-t border-slate-100/30">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold ${
                    doctor.status === 'AVAILABLE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${doctor.status === 'AVAILABLE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span>{doctor.status === 'AVAILABLE' ? t.doctorSelect.availableNow : t.doctorSelect.inConsultation}</span>
                  </div>

                  {doctor.currentToken && (
                    <span className="text-xs font-mono font-black text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                      {t.doctorSelect.currentToken}: #{doctor.currentToken}
                    </span>
                  )}
                </div>

                {/* Room and Wait Time */}
                <div className={`p-3 rounded-2xl text-xs space-y-1 ${
                  isKiosk ? 'bg-white/10 text-purple-200' : 'bg-slate-50 text-slate-600'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-500" />
                      {doctor.roomNumber}
                    </span>
                    {doctor.estimatedWaitMins !== undefined && (
                      <span className="text-[11px] font-semibold text-emerald-600">
                        ~{doctor.estimatedWaitMins} {t.doctorSelect.mins} wait
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {doctor.timings}
                    </span>
                    <span>{exp}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => onSelectDoctor(doctor)}
                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 group-hover:shadow-brand-300"
              >
                <UserCheck className="w-4 h-4" />
                <span>{t.doctorSelect.selectDoctorBtn}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
