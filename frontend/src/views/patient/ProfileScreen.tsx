import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { PatientProfile } from '../../types';
import { LanguageModal } from '../../components/common/LanguageModal';
import { AccessibilityToolbar } from '../../components/common/AccessibilityToolbar';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  Globe,
  Sliders,
  LogOut,
  ChevronRight,
  Fingerprint,
  Heart,
  Activity,
  AlertTriangle,
  Plus,
  X,
  CheckCircle,
  Clock,
  Save,
  Check,
  ArrowLeft,
} from 'lucide-react';

interface ProfileScreenProps {
  onOpenConsent: () => void;
  onBack?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onOpenConsent, onBack }) => {
  const { t, language } = useTranslation();
  const { currentUser, logout } = useAuth();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isAccessOpen, setIsAccessOpen] = useState(false);

  const patientId = currentUser.patientId || 'PAT-0001';
  const [profile, setProfile] = useState<PatientProfile | null>(null);

  // Medical Profile Form State
  const [bloodGroup, setBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown' | ''>('O+');
  const [drugAllergies, setDrugAllergies] = useState<string[]>([]);
  const [foodAllergies, setFoodAllergies] = useState<string[]>([]);
  const [otherAllergies, setOtherAllergies] = useState<string[]>([]);
  const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
  const [noKnownChronic, setNoKnownChronic] = useState(false);

  // Inputs for adding new items
  const [newDrug, setNewDrug] = useState('');
  const [newFood, setNewFood] = useState('');
  const [newOther, setNewOther] = useState('');
  const [newDisease, setNewDisease] = useState('');

  // Additional persistent medical fields: Disease, Chronic Synchronous Disease, Relative Number
  const [diseases, setDiseases] = useState<string[]>([]);
  const [newDiagnosedDisease, setNewDiagnosedDisease] = useState('');
  const [chronicSynchronousDiseases, setChronicSynchronousDiseases] = useState<string[]>([]);
  const [newChronicSync, setNewChronicSync] = useState('');
  const [relativeNumber, setRelativeNumber] = useState<string>('');

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const pat = storageService.getPatientById(patientId);
    if (pat) {
      setProfile(pat);
      if (pat.bloodGroup) setBloodGroup(pat.bloodGroup);
      if (pat.allergies) {
        setDrugAllergies(pat.allergies.drugs || []);
        setFoodAllergies(pat.allergies.food || []);
        setOtherAllergies(pat.allergies.others || []);
      }
      if (pat.chronicDiseases) {
        setChronicDiseases(pat.chronicDiseases);
        setNoKnownChronic(pat.chronicDiseases.length === 0);
      }
      if (pat.diseases) {
        setDiseases(pat.diseases);
      }
      if (pat.chronicSynchronousDiseases) {
        setChronicSynchronousDiseases(pat.chronicSynchronousDiseases);
      }
      if (pat.relativeNumber) {
        setRelativeNumber(pat.relativeNumber);
      }
    }
  }, [patientId]);

  // Handlers for allergies
  const handleAddDrugAllergy = () => {
    if (!newDrug.trim() || drugAllergies.includes(newDrug.trim())) return;
    setDrugAllergies(prev => [...prev, newDrug.trim()]);
    setNewDrug('');
  };

  const handleRemoveDrugAllergy = (name: string) => {
    setDrugAllergies(prev => prev.filter(d => d !== name));
  };

  const handleAddFoodAllergy = () => {
    if (!newFood.trim() || foodAllergies.includes(newFood.trim())) return;
    setFoodAllergies(prev => [...prev, newFood.trim()]);
    setNewFood('');
  };

  const handleRemoveFoodAllergy = (name: string) => {
    setFoodAllergies(prev => prev.filter(f => f !== name));
  };

  const handleAddOtherAllergy = () => {
    if (!newOther.trim() || otherAllergies.includes(newOther.trim())) return;
    setOtherAllergies(prev => [...prev, newOther.trim()]);
    setNewOther('');
  };

  const handleRemoveOtherAllergy = (name: string) => {
    setOtherAllergies(prev => prev.filter(o => o !== name));
  };

  // Handlers for chronic diseases
  const handleAddDisease = () => {
    if (!newDisease.trim() || chronicDiseases.includes(newDisease.trim())) return;
    setChronicDiseases(prev => [...prev, newDisease.trim()]);
    setNoKnownChronic(false);
    setNewDisease('');
  };

  const handleRemoveDisease = (name: string) => {
    setChronicDiseases(prev => prev.filter(d => d !== name));
  };

  const handleToggleNoChronic = (checked: boolean) => {
    setNoKnownChronic(checked);
    if (checked) {
      setChronicDiseases([]);
    }
  };

  // Handlers for Disease (Diagnosed)
  const handleAddDiagnosedDisease = () => {
    if (!newDiagnosedDisease.trim() || diseases.includes(newDiagnosedDisease.trim())) return;
    setDiseases(prev => [...prev, newDiagnosedDisease.trim()]);
    setNewDiagnosedDisease('');
  };

  const handleRemoveDiagnosedDisease = (name: string) => {
    setDiseases(prev => prev.filter(d => d !== name));
  };

  // Handlers for Chronic Synchronous Disease
  const handleAddChronicSync = () => {
    if (!newChronicSync.trim() || chronicSynchronousDiseases.includes(newChronicSync.trim())) return;
    setChronicSynchronousDiseases(prev => [...prev, newChronicSync.trim()]);
    setNewChronicSync('');
  };

  const handleRemoveChronicSync = (name: string) => {
    setChronicSynchronousDiseases(prev => prev.filter(d => d !== name));
  };

  // Save Medical Profile
  const handleSaveMedicalProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const updated = storageService.updatePatientMedicalProfile(
      patientId,
      {
        bloodGroup: bloodGroup ? (bloodGroup as any) : undefined,
        allergies: {
          drugs: drugAllergies,
          food: foodAllergies,
          others: otherAllergies,
        },
        chronicDiseases: noKnownChronic ? [] : chronicDiseases,
        diseases,
        chronicSynchronousDiseases,
        relativeNumber: relativeNumber.trim(),
      },
      currentUser.name
    );

    if (updated) {
      setProfile(updated);
      setSaveSuccessMsg('Medical profile saved to database and audit log recorded.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  const commonConditions = [
    'Diabetes (Type 2)',
    'Hypertension',
    'Asthma',
    'Thyroid Disorder',
    'Hyperlipidemia',
    'Arthritis',
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 animate-fade-in space-y-6 pb-20 md:pb-8">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-bold rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>{language === 'ta' ? 'முகப்புக்குத் திரும்பு' : language === 'hi' ? 'डैशबोर्ड पर वापस' : 'Back to Dashboard'}</span>
          </button>
        )}
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 ml-auto">
          {language === 'ta' ? 'தனி மருத்துவ சுயவிவரம்' : language === 'hi' ? 'अलग चिकित्सा प्रोफ़ाइल' : 'Separate Medical Profile'}
        </span>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-xl shadow-brand-200 text-2xl font-black">
          {currentUser.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">{currentUser.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              {patientId}
            </span>
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-scale-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* MEDICAL PROFILE MANAGER (Allergies, Blood Group, Chronic Diseases) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-600" />
              <span>Medical Profile & Health Data</span>
            </h3>
            <p className="text-xs text-slate-500">Persistent clinical parameters referenced during consultations</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700">
            DPDP Verified
          </span>
        </div>

        <form onSubmit={handleSaveMedicalProfile} className="space-y-5 text-xs">
          {/* Blood Group */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span>Blood Group:</span>
              <span className="text-[11px] font-normal text-slate-400">Select standard ABO/Rh type</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
              {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] as const).map(bg => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setBloodGroup(bg)}
                  className={`py-2 rounded-xl font-black text-xs transition-all ${
                    bloodGroup === bg
                      ? 'bg-red-600 text-white shadow-md shadow-red-200 scale-102'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Allergies Management */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Allergies:</span>
            </div>

            {/* Drug Allergies */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-red-700">Drug / Medication Allergies:</label>
              <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-red-50/50 rounded-xl border border-red-200">
                {drugAllergies.length === 0 ? (
                  <span className="text-slate-400 italic text-[11px] py-0.5">No drug allergies listed</span>
                ) : (
                  drugAllergies.map(d => (
                    <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-800 font-bold text-[11px]">
                      <span>{d}</span>
                      <button type="button" onClick={() => handleRemoveDrugAllergy(d)} className="hover:text-red-950">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newDrug}
                  onChange={(e) => setNewDrug(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs, Aspirin"
                  className="flex-1 p-2 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddDrugAllergy}
                  className="py-2 px-3 bg-red-600 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Food Allergies */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-amber-700">Food Allergies:</label>
              <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-amber-50/50 rounded-xl border border-amber-200">
                {foodAllergies.length === 0 ? (
                  <span className="text-slate-400 italic text-[11px] py-0.5">No food allergies listed</span>
                ) : (
                  foodAllergies.map(f => (
                    <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-[11px]">
                      <span>{f}</span>
                      <button type="button" onClick={() => handleRemoveFoodAllergy(f)} className="hover:text-amber-950">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newFood}
                  onChange={(e) => setNewFood(e.target.value)}
                  placeholder="e.g. Peanuts, Shellfish, Dairy"
                  className="flex-1 p-2 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddFoodAllergy}
                  className="py-2 px-3 bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Other Allergies */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">Other Allergies (Dust, Latex, Pollen):</label>
              <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-slate-50 rounded-xl border border-slate-200">
                {otherAllergies.length === 0 ? (
                  <span className="text-slate-400 italic text-[11px] py-0.5">No other allergies listed</span>
                ) : (
                  otherAllergies.map(o => (
                    <span key={o} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 font-bold text-[11px]">
                      <span>{o}</span>
                      <button type="button" onClick={() => handleRemoveOtherAllergy(o)} className="hover:text-slate-950">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newOther}
                  onChange={(e) => setNewOther(e.target.value)}
                  placeholder="e.g. Latex, Pollen, Contrast Dye"
                  className="flex-1 p-2 rounded-xl border border-slate-200 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddOtherAllergy}
                  className="py-2 px-3 bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chronic Diseases Management */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">Chronic Diseases & Medical Conditions:</label>
              <label className="flex items-center gap-2 font-medium text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noKnownChronic}
                  onChange={(e) => handleToggleNoChronic(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <span>No known chronic disease</span>
              </label>
            </div>

            {!noKnownChronic && (
              <div className="space-y-2">
                {/* Predefined quick tags */}
                <div className="flex flex-wrap gap-1.5">
                  {commonConditions.map(cond => {
                    const isSelected = chronicDiseases.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => {
                          if (isSelected) handleRemoveDisease(cond);
                          else setChronicDiseases(prev => [...prev, cond]);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {cond}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Chronic Disease Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newDisease}
                    onChange={(e) => setNewDisease(e.target.value)}
                    placeholder="Add other chronic condition..."
                    className="flex-1 p-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddDisease}
                    className="py-2 px-3 bg-brand-600 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Diagnosed Diseases (Disease) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">Disease (Diagnosed Conditions):</label>
              <span className="text-[11px] text-slate-400">Current diagnosed illnesses</span>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-slate-50 rounded-xl border border-slate-200">
              {diseases.length === 0 ? (
                <span className="text-slate-400 italic text-[11px] py-0.5">No diagnosed disease recorded</span>
              ) : (
                diseases.map(d => (
                  <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-[11px]">
                    <span>{d}</span>
                    <button type="button" onClick={() => handleRemoveDiagnosedDisease(d)} className="hover:text-indigo-950 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newDiagnosedDisease}
                onChange={(e) => setNewDiagnosedDisease(e.target.value)}
                placeholder="e.g. Gastritis, Sinusitis, Migraine, Eczema"
                className="flex-1 p-2 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="button"
                onClick={handleAddDiagnosedDisease}
                className="py-2 px-3 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Chronic Synchronous Disease */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">Chronic Synchronous Disease:</label>
              <span className="text-[11px] text-slate-400">Concurrent / co-occurring chronic conditions</span>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 bg-purple-50/50 rounded-xl border border-purple-200">
              {chronicSynchronousDiseases.length === 0 ? (
                <span className="text-slate-400 italic text-[11px] py-0.5">No chronic synchronous disease recorded</span>
              ) : (
                chronicSynchronousDiseases.map(cs => (
                  <span key={cs} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-bold text-[11px]">
                    <span>{cs}</span>
                    <button type="button" onClick={() => handleRemoveChronicSync(cs)} className="hover:text-purple-950 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newChronicSync}
                onChange={(e) => setNewChronicSync(e.target.value)}
                placeholder="e.g. Diabetes + Hypertension, Asthma + Allergic Rhinitis"
                className="flex-1 p-2 rounded-xl border border-slate-200 text-xs"
              />
              <button
                type="button"
                onClick={handleAddChronicSync}
                className="py-2 px-3 bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Relative Number (Emergency Caregiver Contact) */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="font-bold text-slate-800 flex items-center justify-between">
              <span>Relative Number:</span>
              <span className="text-[11px] text-slate-400 font-normal">Emergency caregiver / family relative contact</span>
            </label>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-600 shrink-0" />
              <input
                type="tel"
                value={relativeNumber}
                onChange={(e) => setRelativeNumber(e.target.value)}
                placeholder="+91 98765 43210 (Relative / Caregiver Phone)"
                className="flex-1 p-2 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="py-2.5 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Medical Profile Updates</span>
            </button>
          </div>
        </form>

        {/* Change History & Audit Log */}
        {profile?.medicalUpdatesHistory && profile.medicalUpdatesHistory.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Medical Profile Audit History
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {profile.medicalUpdatesHistory.map((item, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded-xl text-[11px] flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span><strong>{item.field}</strong> updated by {item.updatedBy}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Personal Information
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Phone className="w-4 h-4 text-brand-600" />
              <span>Phone Number</span>
            </div>
            <span className="font-bold text-slate-900">{currentUser.phone || '+91 98401 23456'}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail className="w-4 h-4 text-brand-600" />
              <span>Email Address</span>
            </div>
            <span className="font-medium text-slate-900">{currentUser.email || 'Not provided (Optional)'}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Fingerprint className="w-4 h-4 text-brand-600" />
              <span>ABHA ID</span>
            </div>
            <span className="font-mono font-bold text-slate-900">{profile?.abhaId || '91-8834-2910-4491'}</span>
          </div>
        </div>
      </div>

      {/* Settings Navigation Menu */}
      <div className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm space-y-1">
        <button
          type="button"
          onClick={onOpenConsent}
          className="w-full p-4 hover:bg-slate-50 rounded-2xl flex items-center justify-between transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">{t.profile.manageConsent}</p>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  profile?.consent?.status === 'GRANTED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  ABDM: {profile?.consent?.status || 'Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{t.abdmConsent.title}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => setIsLangOpen(true)}
          className="w-full p-4 hover:bg-slate-50 rounded-2xl flex items-center justify-between transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{t.profile.languageSetting}</p>
              <p className="text-xs text-slate-500">
                {language === 'ta' ? 'தற்போது: தமிழ்' : language === 'hi' ? 'वर्तमान: हिन्दी' : 'Currently: English'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => setIsAccessOpen(true)}
          className="w-full p-4 hover:bg-slate-50 rounded-2xl flex items-center justify-between transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{t.profile.accessibilitySettings}</p>
              <p className="text-xs text-slate-500">{t.accessibility.title}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={logout}
          className="w-full p-4 hover:bg-red-50 rounded-2xl flex items-center justify-between transition-colors text-left text-red-600 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">{t.profile.logoutBtn}</p>
              <p className="text-xs text-red-400">{t.profile.title}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-red-400" />
        </button>
      </div>

      <LanguageModal isOpen={isLangOpen} onClose={() => setIsLangOpen(false)} />
      <AccessibilityToolbar isOpen={isAccessOpen} onClose={() => setIsAccessOpen(false)} />
    </div>
  );
};
