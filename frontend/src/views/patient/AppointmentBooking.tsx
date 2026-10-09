import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { VoiceButton } from '../../components/common/VoiceButton';
import { Appointment, MedicineSystem, Hospital, DoctorDirectoryEntry } from '../../types';
import {
  Building2,
  Stethoscope,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface AppointmentBookingProps {
  initialMedicineSystem?: MedicineSystem;
  initialHospital?: Hospital;
  initialDoctor?: DoctorDirectoryEntry;
  onAppointmentConfirmed: (appointment: Appointment) => void;
  onCancel: () => void;
  onStartPreConsultation?: (appointment: Appointment) => void;
}

export const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  initialMedicineSystem,
  initialHospital,
  initialDoctor,
  onAppointmentConfirmed,
  onCancel,
  onStartPreConsultation,
}) => {
  const { language, t } = useTranslation();
  const { currentUser } = useAuth();

  // If initial doctor/hospital are passed, start at step 4 (Select Date & Time Slot)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(initialDoctor ? 4 : 1);
  
  const [selectedHospital, setSelectedHospital] = useState(
    initialHospital ? (initialHospital.name[language] || initialHospital.name.en) : 'AIHC Government Multi-Speciality Hospital'
  );
  const [selectedDept, setSelectedDept] = useState(
    initialDoctor ? (initialDoctor.department[language] || initialDoctor.department.en) : ''
  );
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string; spec: string } | null>(
    initialDoctor
      ? {
          id: initialDoctor.id,
          name: initialDoctor.name[language] || initialDoctor.name.en,
          spec: initialDoctor.qualification || initialDoctor.department[language] || initialDoctor.department.en,
        }
      : null
  );
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM');
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  const hospitals = [
    { name: 'AIHC Government Multi-Speciality Hospital', location: 'Central OPD Wing' },
    { name: 'AIHC City Center Hospital', location: 'South Block OPD' },
    { name: 'AIHC Community Health & AYUSH Center', location: 'Holistic Wellness Wing' },
  ];

  const departments = [
    { id: 'gen_med', name: 'General Medicine & Internal Care', icon: '🩺' },
    { id: 'cardio', name: 'Cardiology (Heart Care)', icon: '❤️' },
    { id: 'gastro', name: 'Gastroenterology (Stomach/Liver)', icon: '🥗' },
    { id: 'pedia', name: 'Pediatrics (Child Health)', icon: '👶' },
    { id: 'ortho', name: 'Orthopedics & Joint Care', icon: '🦴' },
    { id: 'ayush', name: 'AYUSH / Ayurvedic Wellness', icon: '🌿' },
  ];

  const doctorsList = [
    { id: 'DOC-0001', name: 'Dr. A. Sundaram (MD)', spec: 'General Medicine & Internal Care', depts: ['gen_med'] },
    { id: 'DOC-0002', name: 'Dr. Priya Natarajan (DM)', spec: 'Cardiology & Intensive Heart Care', depts: ['cardio'] },
    { id: 'DOC-0003', name: 'Dr. K. Vignesh (MD)', spec: 'Gastroenterology Specialist', depts: ['gastro'] },
    { id: 'DOC-0004', name: 'Dr. M. Rajesh (MD)', spec: 'Pediatric Care & Child Health', depts: ['pedia'] },
    { id: 'DOC-0005', name: 'Dr. B. Ramanathan (BAMS)', spec: 'AYUSH / Classical Ayurvedic Physician', depts: ['ayush'] },
    { id: 'DOC-0006', name: 'Dr. S. Shanthi (MS Ortho)', spec: 'Orthopedics & Spine Specialist', depts: ['ortho'] },
  ];

  const timeSlots = [
    '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
    '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
  ];

  const handleConfirm = () => {
    const docToUse = selectedDoctor || (initialDoctor ? {
      id: initialDoctor.id,
      name: initialDoctor.name[language] || initialDoctor.name.en,
      spec: initialDoctor.qualification,
    } : doctorsList[0]);

    const newApt = storageService.bookAppointment({
      patientId: currentUser.patientId || 'PAT-0001',
      patientName: currentUser.name,
      hospital: selectedHospital,
      department: selectedDept || (initialMedicineSystem ? initialMedicineSystem.replace('_', ' ') : 'General Medicine'),
      doctorId: docToUse.id,
      doctorName: docToUse.name,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      medicineSystem: initialMedicineSystem || 'AYURVEDA',
    });

    setConfirmedAppointment(newApt);
    setStep(5);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 animate-fade-in space-y-6">
      {/* Step Progress Bar */}
      {step < 5 && (
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>{t.appointment.title}</span>
            <span>{t.common.activeAction ? `${step} / 4` : `Step ${step} of 4`}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* STEP 1: Select Hospital */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t.appointment.step1}</h3>
              <p className="text-xs text-slate-500">{t.appointment.chooseHospitalSub}</p>
            </div>
            <VoiceButton textToSpeak={t.appointment.chooseHospitalSub} showSpeak={false} size="sm" />
          </div>

          <div className="space-y-3">
            {hospitals.map((hosp) => (
              <button
                key={hosp.name}
                type="button"
                onClick={() => {
                  setSelectedHospital(hosp.name);
                  setStep(2);
                }}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
                  selectedHospital === hosp.name
                    ? 'border-brand-600 bg-brand-50/60 shadow-sm'
                    : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50'
                }`}
              >
                <div className="p-3 bg-white rounded-xl text-brand-600 shadow-sm shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{hosp.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{hosp.location}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(2)}
              className="py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md"
            >
              <span>{t.common.next}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Select Department */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button onClick={() => setStep(1)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t.appointment.step2}</h3>
              <p className="text-xs text-slate-500">{t.appointment.chooseDeptSub}</p>
            </div>
            <VoiceButton textToSpeak={t.appointment.chooseDeptSub} showSpeak={false} size="sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.map((dept) => (
              <button
                key={dept.id}
                type="button"
                onClick={() => {
                  setSelectedDept(dept.name);
                  const matchingDoc = doctorsList.find(d => d.depts.includes(dept.id)) || doctorsList[0];
                  setSelectedDoctor(matchingDoc);
                  setStep(3);
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${
                  selectedDept === dept.name
                    ? 'border-brand-600 bg-brand-50/60 shadow-sm'
                    : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl p-2 bg-slate-100 rounded-xl">{dept.icon}</span>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-900">{dept.name}</h4>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Select Doctor */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button onClick={() => setStep(2)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t.appointment.step3}</h3>
              <p className="text-xs text-slate-500">{t.appointment.chooseDocSub}</p>
            </div>
            <VoiceButton textToSpeak={t.appointment.chooseDocSub} showSpeak={false} size="sm" />
          </div>

          <div className="space-y-3">
            {doctorsList.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  setSelectedDoctor(doc);
                  setStep(4);
                }}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                  selectedDoctor?.id === doc.id
                    ? 'border-brand-600 bg-brand-50/60 shadow-sm'
                    : 'border-slate-100 hover:border-brand-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                    <p className="text-xs text-slate-500">{doc.spec}</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {t.appointment.availableToday}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: Select Date & Time Slot */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              onClick={() => {
                if (initialDoctor) {
                  onCancel();
                } else {
                  setStep(3);
                }
              }}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{t.appointment.step4}</h3>
              <p className="text-xs text-slate-500">{t.appointment.chooseSlotSub}</p>
            </div>
            <VoiceButton textToSpeak={t.appointment.chooseSlotSub} showSpeak={false} size="sm" />
          </div>

          {/* Selected Doctor Summary */}
          {selectedDoctor && (
            <div className="p-4 bg-brand-50/60 rounded-2xl border border-brand-200 flex items-center gap-3">
              <div className="p-2.5 bg-brand-600 text-white rounded-xl">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-950">{selectedDoctor.name}</h4>
                <p className="text-xs text-brand-700">{selectedHospital}</p>
              </div>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-brand-600" />
              <span>{t.appointment.selectDate}:</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-500"
            />
          </div>

          {/* Time Slots Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>{t.appointment.selectTimeSlot}:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTimeSlot(slot)}
                  className={`py-3 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    selectedTimeSlot === slot
                      ? 'border-brand-600 bg-brand-600 text-white shadow-md'
                      : 'border-slate-100 hover:border-slate-300 bg-slate-50 text-slate-700'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            disabled={!selectedTimeSlot}
            onClick={handleConfirm}
            className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2 text-sm active:scale-98 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{t.appointment.confirmBooking}</span>
          </button>
        </div>
      )}

      {/* STEP 5: EXACT WORKFLOW PROMPT AFTER APPOINTMENT BOOKED */}
      {step === 5 && confirmedAppointment && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xl text-center space-y-6 animate-scale-in">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-100">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">
              ✓ {t.appointment.confirmedTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{t.appointment.confirmedSubtitle}</p>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">{t.appointment.tokenNumber}:</span>
              <span className="font-mono font-black text-brand-900 text-sm">{confirmedAppointment.tokenNumber || 'OPD-TK-28'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">{t.appointment.doctorName}:</span>
              <span className="font-bold">{confirmedAppointment.doctorName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">{t.appointment.department}:</span>
              <span className="font-medium">{confirmedAppointment.department}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">{t.appointment.dateTime}:</span>
              <span className="font-bold text-slate-900">{confirmedAppointment.date} at {confirmedAppointment.timeSlot}</span>
            </div>
          </div>

          {/* Access Converted to Normal Health Notice */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3 text-left text-xs shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-emerald-950 block">
                {language === 'ta'
                  ? 'அணுகல் மீட்கப்பட்டது: அணுகல் ரத்து நீக்கப்பட்டு இயல்பு ஆரோக்கிய நிலைக்கு மாற்றப்பட்டது'
                  : language === 'hi'
                  ? 'पहुँच बहाल: निरस्तीकरण रद्द और सामान्य स्वास्थ्य में परिवर्तित'
                  : 'Access Restored: Revocation Cancelled & Converted to Normal Health'}
              </span>
              <span className="text-[11px] text-emerald-700 leading-tight block mt-0.5">
                {language === 'ta'
                  ? 'முந்தைய ஆலோசனையின் அணுகல் ரத்து நீக்கப்பட்டு, உங்கள் புதிய ஆலோசனை முன்பதிவு மூலம் இயல்பு ஆரோக்கிய நிலைக்கு வெற்றிகரமாக மாற்றப்பட்டது.'
                  : language === 'hi'
                  ? 'पिछले परामर्श का एक्सेस निरस्तीकरण रद्द कर दिया गया है और नए परामर्श बुकिंग के साथ सामान्य स्वास्थ्य में सफलतापूर्वक परिवर्तित कर दिया गया है।'
                  : 'Previous consultation access revocation has been cancelled and converted to Normal Health for your upcoming clinical consultation.'}
              </span>
            </div>
          </div>

          {/* Required Prompt:
              'AI PRE-CONSULTATION'
              'Please answer a few questions about your health before meeting the doctor.'
              '[Start]'
          */}
          <div className="p-6 bg-purple-50/80 rounded-3xl border border-purple-200 text-center space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-purple-200 text-purple-900 text-xs font-black uppercase tracking-wider">
              {t.appointment.preConsultationHeading}
            </span>
            <p className="text-sm font-semibold text-purple-950 leading-relaxed max-w-md mx-auto">
              {t.appointment.preConsultationPrompt}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  if (onStartPreConsultation) {
                    onStartPreConsultation(confirmedAppointment);
                  } else {
                    onAppointmentConfirmed(confirmedAppointment);
                  }
                }}
                className="py-3.5 px-8 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 text-sm active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>{t.appointment.startBtn}</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="py-3.5 px-6 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-2xl border border-slate-200 transition-all text-xs active:scale-95 cursor-pointer"
              >
                <span>{t.abdmConsent.skipConsent}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
