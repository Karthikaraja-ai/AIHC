import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import { MedicineSystem, Hospital } from '../../types';
import { directoryService } from '../../services/directoryService';
import { VoiceButton } from '../../components/common/VoiceButton';
import {
  Building2,
  MapPin,
  Stethoscope,
  Star,
  ArrowLeft,
  ArrowRight,
  Search,
  CheckCircle2,
} from 'lucide-react';

interface HospitalSelectScreenProps {
  medicineSystem: MedicineSystem;
  onSelectHospital: (hospital: Hospital) => void;
  onBack: () => void;
}

export const HospitalSelectScreen: React.FC<HospitalSelectScreenProps> = ({
  medicineSystem,
  onSelectHospital,
  onBack,
}) => {
  const { language, t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const hospitals = directoryService.getHospitalsBySystem(medicineSystem);

  const filteredHospitals = hospitals.filter((h) => {
    const name = h.name[language] || h.name.en;
    const loc = h.location[language] || h.location.en;
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-fade-in space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {t.hospitalSelect.title}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 text-brand-700 border border-brand-200">
                {medicineSystem.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              {t.hospitalSelect.subtitle}
            </p>
          </div>
        </div>

        <VoiceButton
          textToSpeak={`${t.hospitalSelect.title}. ${t.hospitalSelect.subtitle}. Select the hospital you want to visit.`}
          showSpeak={false}
          size="md"
        />
      </div>

      {/* Search Bar with voice input option */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.hospitalSelect.filterSearch}
          className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border border-slate-200 focus:border-brand-600 focus:ring-4 focus:ring-brand-100 text-sm font-medium transition-all shadow-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <VoiceButton
            onSpeechResult={(res) => setSearchQuery(res.normalizedText)}
            showSpeak={false}
            showListen={true}
            size="sm"
          />
        </div>
      </div>

      {/* Hospitals List */}
      <div className="space-y-4">
        {filteredHospitals.map((hospital) => {
          const name = hospital.name[language] || hospital.name.en;
          const location = hospital.location[language] || hospital.location.en;
          const opdWing = hospital.opdWing[language] || hospital.opdWing.en;
          const facilities = hospital.facilities[language] || hospital.facilities.en;

          return (
            <div
              key={hospital.id}
              className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 hover:border-brand-300 shadow-sm hover:shadow-md transition-all space-y-4 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 leading-snug">
                      {name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span>{location}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold text-emerald-600">{hospital.distanceKm}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{hospital.rating}</span>
                  </div>
                  <VoiceButton
                    textToSpeak={`${name}. Location: ${location}. OPD Wing: ${opdWing}. Distance: ${hospital.distanceKm}.`}
                    showSpeak={false}
                    size="sm"
                  />
                </div>
              </div>

              {/* OPD Wing Info */}
              <div className="p-3 bg-slate-50 rounded-2xl text-xs flex items-center gap-2 text-slate-700">
                <Stethoscope className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="font-semibold">{t.hospitalSelect.opdWing}:</span>
                <span className="font-medium text-slate-600">{opdWing}</span>
              </div>

              {/* Facility Chips */}
              <div className="flex flex-wrap gap-1.5">
                {facilities.map((fac, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-purple-50/60 text-purple-800 border border-purple-100"
                  >
                    <CheckCircle2 className="w-3 h-3 text-purple-600" />
                    <span>{fac}</span>
                  </span>
                ))}
              </div>

              {/* Select Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onSelectHospital(hospital)}
                  className="py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-brand-200 transition-all flex items-center gap-2 group-hover:px-7 active:scale-95"
                >
                  <span>{t.hospitalSelect.selectHospitalBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredHospitals.length === 0 && (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">No hospitals found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};
