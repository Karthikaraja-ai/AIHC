import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import { storageService } from '../../services/storageService';
import { apiService } from '../../services/apiService';
import { PatientProfile, UserRole, User, MedicineSystem, UploadedDocument } from '../../types';
import { HOSPITALS } from '../../services/directoryService';
import {
  UserPlus,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  User as UserIcon,
  Stethoscope,
  HeartPulse,
  FlaskConical,
  CheckCircle2,
  Copy,
  LogIn,
  Upload,
  FileText,
  Building2,
  X,
} from 'lucide-react';

interface RegistrationScreenProps {
  onSuccess: (profile: PatientProfile) => void;
  onGoToLogin: () => void;
  onBack: () => void;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({
  onSuccess,
  onGoToLogin,
  onBack,
}) => {
  const { t } = useTranslation();

  const [selectedRole, setSelectedRole] = useState<UserRole>('PATIENT');

  // Common Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Patient Fields
  const [patientAge, setPatientAge] = useState<string>('');
  const [patientSex, setPatientSex] = useState<'FEMALE' | 'MALE' | 'OTHER'>('FEMALE');
  const [patientBloodGroup, setPatientBloodGroup] = useState<
    'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown'
  >('Unknown');

  // Doctor Fields
  const [specialization, setSpecialization] = useState('General Medicine & OPD');
  const [department, setDepartment] = useState('General Medicine');
  const [councilRegNo, setCouncilRegNo] = useState('');
  const [doctorHospitalSelect, setDoctorHospitalSelect] = useState('AIHC Multi-Speciality Hospital');
  const [doctorCustomHospital, setDoctorCustomHospital] = useState('');
  const [doctorMedicineSystem, setDoctorMedicineSystem] = useState<MedicineSystem>('ALLOPATHY_HOMEOPATHY');
  const [doctorRegDoc, setDoctorRegDoc] = useState<UploadedDocument | null>(null);
  const [hasOwnClinic, setHasOwnClinic] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicLicenseDoc, setClinicLicenseDoc] = useState<UploadedDocument | null>(null);

  // Nurse Fields
  const [nursingRegNo, setNursingRegNo] = useState('');
  const [nurseDept, setNurseDept] = useState('OPD Triage & Emergency Assessment');
  const [shift, setShift] = useState('Morning (08:00 - 16:00)');
  const [nurseHospitalSelect, setNurseHospitalSelect] = useState('AIHC Multi-Speciality Hospital');
  const [nurseCustomHospital, setNurseCustomHospital] = useState('');
  const [nurseRegDoc, setNurseRegDoc] = useState<UploadedDocument | null>(null);

  // Lab Tech Fields
  const [certificationNo, setCertificationNo] = useState('');
  const [labSection, setLabSection] = useState('Clinical Biochemistry & Hematology Diagnostic Center');
  const [labTechHospitalSelect, setLabTechHospitalSelect] = useState('AIHC Multi-Speciality Hospital');
  const [labTechCustomHospital, setLabTechCustomHospital] = useState('');
  const [labTechRegDoc, setLabTechRegDoc] = useState<UploadedDocument | null>(null);
  const [hasOwnLab, setHasOwnLab] = useState(false);
  const [labName, setLabName] = useState('');
  const [labAddress, setLabAddress] = useState('');
  const [labLicenseDoc, setLabLicenseDoc] = useState<UploadedDocument | null>(null);

  // Feedback State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredStaff, setRegisteredStaff] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  // Helper for Document Upload File Reader
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onDocReady: (doc: UploadedDocument) => void,
    category: 'COUNCIL_REGISTRATION' | 'CLINIC_LICENSE' | 'LAB_LICENSE' | 'DEGREE_CERTIFICATE'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const doc: UploadedDocument = {
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
        dataUrl: base64,
        uploadedAt: new Date().toISOString(),
      };
      onDocReady(doc);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Reusable Document Upload Widget
  const renderDocUploadWidget = (
    label: string,
    doc: UploadedDocument | null,
    onDocReady: (doc: UploadedDocument) => void,
    onRemove: () => void,
    category: 'COUNCIL_REGISTRATION' | 'CLINIC_LICENSE' | 'LAB_LICENSE' | 'DEGREE_CERTIFICATE',
    inputId: string,
    required: boolean = true
  ) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-[10px] text-slate-400">PDF, JPG, PNG (Max 5MB)</span>
      </div>

      {doc ? (
        <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-slate-800 block truncate">{doc.name}</span>
              <span className="text-[10px] text-slate-500">{(doc.size / 1024).toFixed(1)} KB • Uploaded</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white"
            title="Remove document"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl bg-white hover:bg-brand-50/20 cursor-pointer transition-all text-slate-600 hover:text-brand-700"
        >
          <Upload className="w-4 h-4" />
          <span className="text-xs font-semibold">Choose File to Upload</span>
          <input
            id={inputId}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => handleFileUpload(e, onDocReady, category)}
          />
        </label>
      )}
    </div>
  );

  // Reusable Hospital Selector / Mention Widget
  const renderHospitalSelector = (
    selectedHospital: string,
    onHospitalChange: (val: string) => void,
    customHospitalVal: string,
    onCustomHospitalChange: (val: string) => void,
    inputId: string,
    borderColorClass: string = 'border-purple-200'
  ) => {
    const isOther = selectedHospital === 'OTHER';
    return (
      <div className="space-y-1.5 sm:col-span-2">
        <label className="font-bold text-slate-700 text-xs flex items-center justify-between">
          <span>
            Hospital / Healthcare Institution <span className="text-red-500">*</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Select or type custom name</span>
        </label>
        <select
          value={selectedHospital}
          onChange={(e) => onHospitalChange(e.target.value)}
          className={`w-full p-2.5 rounded-xl border ${borderColorClass} text-xs font-medium bg-white`}
        >
          <option value="AIHC Multi-Speciality Hospital">AIHC Multi-Speciality Hospital</option>
          {HOSPITALS.map((h) => (
            <option key={h.id} value={h.name.en}>
              {h.name.en} ({h.category})
            </option>
          ))}
          <option value="OTHER">Other / Independent Medical Facility (Specify Below)</option>
        </select>

        {isOther && (
          <input
            id={inputId}
            type="text"
            required
            placeholder="Enter Hospital / Medical Centre Name *"
            value={customHospitalVal}
            onChange={(e) => onCustomHospitalChange(e.target.value)}
            className={`w-full p-2.5 rounded-xl border ${borderColorClass} text-xs font-medium mt-1`}
          />
        )}
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter Full Name.');
      return;
    }

    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMessage('Please enter a valid 10-digit Phone Number.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    // Role-specific registration with cryptographic password hashing
    if (selectedRole === 'PATIENT') {
      const parsedAge = parseInt(patientAge, 10);
      if (!patientAge.trim() || isNaN(parsedAge) || parsedAge < 1 || parsedAge > 125) {
        setErrorMessage('Please enter a valid age between 1 and 125 years.');
        return;
      }

      const ageGroup = parsedAge < 18 ? 'CHILD' : parsedAge >= 60 ? 'SENIOR' : 'ADULT';

      const newProfile = storageService.registerPatient({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        password: password.trim(),
        age: parsedAge,
        sex: patientSex,
        ageGroup: ageGroup === 'SENIOR' ? 'ADULT' : ageGroup,
        bloodGroup: patientBloodGroup,
      });

      // Synchronize with backend API in background if online
      apiService.register({
        name: fullName.trim(),
        role: 'PATIENT',
        password: password.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        patientId: newProfile.patientId,
        age: parsedAge,
        sex: patientSex,
        gender: patientSex,
        ageGroup: ageGroup,
        bloodGroup: patientBloodGroup,
      }).catch((err: any) => console.warn('Backend patient registration sync error:', err?.message));

      onSuccess(newProfile);
      return;
    }

    if (selectedRole === 'DOCTOR') {
      if (!councilRegNo.trim()) {
        setErrorMessage('Medical Council Registration Number is required.');
        return;
      }
      if (!doctorRegDoc) {
        setErrorMessage('Please upload your Medical Council Registration Certificate or Degree Certificate.');
        return;
      }
      const effectiveHospital = doctorHospitalSelect === 'OTHER' ? doctorCustomHospital.trim() : doctorHospitalSelect;
      if (!effectiveHospital) {
        setErrorMessage('Please specify your Hospital / Healthcare Institution.');
        return;
      }
      if (hasOwnClinic) {
        if (!clinicName.trim()) {
          setErrorMessage('Please enter your Clinic Name.');
          return;
        }
        if (!clinicAddress.trim()) {
          setErrorMessage('Please enter your Clinic Address.');
          return;
        }
        if (!clinicLicenseDoc) {
          setErrorMessage('Please upload your Clinic Registration / Establishment License.');
          return;
        }
      }

      const newDoctor = storageService.registerDoctor({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || `${phone}@aihc.hospital`,
        specialization,
        department,
        hospital: effectiveHospital,
        councilRegNo: councilRegNo.trim(),
        medicineSystem: doctorMedicineSystem,
        password: password.trim(),
        registrationDoc: doctorRegDoc,
        hasOwnClinic,
        clinicDetails: hasOwnClinic
          ? {
              clinicName: clinicName.trim(),
              address: clinicAddress.trim(),
              licenseDoc: clinicLicenseDoc || undefined,
            }
          : undefined,
      });
      setRegisteredStaff(newDoctor);
      return;
    }

    if (selectedRole === 'NURSE') {
      if (!nursingRegNo.trim()) {
        setErrorMessage('Nursing Council Registration Number is required.');
        return;
      }
      if (!nurseRegDoc) {
        setErrorMessage('Please upload your Nursing Council Registration Certificate.');
        return;
      }
      const effectiveHospital = nurseHospitalSelect === 'OTHER' ? nurseCustomHospital.trim() : nurseHospitalSelect;
      if (!effectiveHospital) {
        setErrorMessage('Please specify your Hospital / Healthcare Institution.');
        return;
      }

      const newNurse = storageService.registerNurse({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || `${phone}@aihc.hospital`,
        department: nurseDept,
        hospital: effectiveHospital,
        nursingRegNo: nursingRegNo.trim(),
        shift,
        password: password.trim(),
        registrationDoc: nurseRegDoc,
      });
      setRegisteredStaff(newNurse);
      return;
    }

    if (selectedRole === 'LAB_TECHNICIAN') {
      if (!certificationNo.trim()) {
        setErrorMessage('Lab Certification / License Number is required.');
        return;
      }
      if (!labTechRegDoc) {
        setErrorMessage('Please upload your Lab Technician Certification / Registration Certificate.');
        return;
      }
      const effectiveHospital = labTechHospitalSelect === 'OTHER' ? labTechCustomHospital.trim() : labTechHospitalSelect;
      if (!effectiveHospital) {
        setErrorMessage('Please specify your Hospital / Diagnostic Centre.');
        return;
      }
      if (hasOwnLab) {
        if (!labName.trim()) {
          setErrorMessage('Please enter your Diagnostic Centre / Lab Name.');
          return;
        }
        if (!labAddress.trim()) {
          setErrorMessage('Please enter your Establishment Address.');
          return;
        }
        if (!labLicenseDoc) {
          setErrorMessage('Please upload your Lab Registration / Establishment License.');
          return;
        }
      }

      const newLabTech = storageService.registerLabTech({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || `${phone}@aihc.hospital`,
        labSection,
        hospital: effectiveHospital,
        certificationNo: certificationNo.trim(),
        password: password.trim(),
        registrationDoc: labTechRegDoc,
        hasOwnEstablishment: hasOwnLab,
        establishmentDetails: hasOwnLab
          ? {
              establishmentName: labName.trim(),
              address: labAddress.trim(),
              licenseDoc: labLicenseDoc || undefined,
            }
          : undefined,
      });
      setRegisteredStaff(newLabTech);
      return;
    }
  };

  const handleCopyStaffId = () => {
    if (registeredStaff?.staffId) {
      navigator.clipboard.writeText(registeredStaff.staffId);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // If staff member registered successfully, display staff success card with Unique ID and Proceed to Login
  if (registeredStaff) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 md:p-8 animate-scale-in">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Registration Successful!</h2>
            <p className="text-xs text-slate-500 font-medium">
              Registered as <span className="font-bold text-slate-900">{registeredStaff.role}</span> ({registeredStaff.name})
            </p>
          </div>

          <div className="p-5 bg-brand-50 rounded-2xl border-2 border-brand-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 block">
              Your Permanent Staff ID
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-3xl font-black tracking-widest text-brand-900">
                {registeredStaff.staffId}
              </span>
              <button
                type="button"
                onClick={handleCopyStaffId}
                className="p-2 rounded-xl bg-white text-brand-600 hover:bg-brand-100 border border-brand-200 shadow-sm"
                title="Copy Staff ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && (
              <p className="text-xs font-bold text-emerald-600 animate-fade-in">
                Copied to clipboard!
              </p>
            )}
            <p className="text-xs text-slate-500">
              Please save this Unique ID. You will use this ID and your chosen password to log into your portal.
            </p>
          </div>

          <button
            onClick={onGoToLogin}
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Proceed to Login Page</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8 space-y-6">
        {/* Header - No Voice Button */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex-1">
            <h2 className="text-xl font-extrabold text-slate-900">Hospital User Registration</h2>
            <p className="text-xs text-slate-500">Universal Registration for Patients, Doctors, Nurses & Lab Technicians</p>
          </div>
        </div>

        {/* 4-ROLE SELECTOR TABS (PATIENT, DOCTOR, NURSE, LAB TECH - STRICTLY NO ADMIN) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => { setSelectedRole('PATIENT'); setErrorMessage(null); }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              selectedRole === 'PATIENT'
                ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Patient</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedRole('DOCTOR'); setErrorMessage(null); }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              selectedRole === 'DOCTOR'
                ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedRole('NURSE'); setErrorMessage(null); }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              selectedRole === 'NURSE'
                ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Nurse</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedRole('LAB_TECHNICIAN'); setErrorMessage(null); }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
              selectedRole === 'LAB_TECHNICIAN'
                ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Lab Tech</span>
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-2xl text-xs border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={selectedRole === 'DOCTOR' ? 'Dr. Full Name' : 'Enter your full name'}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-brand-600 text-sm font-medium"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile number"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-brand-600 text-sm font-medium"
            />
          </div>

          {/* Email ID (Optional for patient, standard for staff) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">
                Email Address
              </label>
              {selectedRole === 'PATIENT' && (
                <span className="text-[11px] text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded-full">
                  Optional for Patients
                </span>
              )}
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-brand-600 text-sm font-medium"
            />
          </div>

          {/* ROLE-SPECIFIC FIELDS */}

          {/* PATIENT DEMOGRAPHICS FIELDS */}
          {selectedRole === 'PATIENT' && (
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-emerald-100">
                <UserIcon className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-900 block">Patient Demographics & Age:</span>
              </div>

              {/* Age Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.auth.age} <span className="text-red-500">*</span>
                  </label>
                  {patientAge && !isNaN(parseInt(patientAge, 10)) && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      {parseInt(patientAge, 10) < 18 ? 'Pediatric / Child' : parseInt(patientAge, 10) >= 60 ? 'Senior Citizen' : 'Adult'}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  max={125}
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder={t.auth.agePlaceholder || 'Enter age in years (e.g. 28)'}
                  className="w-full px-4 py-3 rounded-2xl border border-emerald-200 focus:border-brand-600 text-sm font-medium bg-white"
                />

                {/* Quick Age Selection Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Quick Select:</span>
                  {[
                    { label: 'Child (8)', val: '8' },
                    { label: 'Teen (16)', val: '16' },
                    { label: 'Adult (28)', val: '28' },
                    { label: 'Middle (48)', val: '48' },
                    { label: 'Senior (68)', val: '68' },
                  ].map((chip) => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => setPatientAge(chip.val)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        patientAge === chip.val
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender / Sex Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {t.auth.gender} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'FEMALE', label: t.auth.female },
                    { key: 'MALE', label: t.auth.male },
                    { key: 'OTHER', label: t.auth.other },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setPatientSex(opt.key as any)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        patientSex === opt.key
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blood Group Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Blood Group <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={patientBloodGroup}
                    onChange={(e) => setPatientBloodGroup(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 transition-all cursor-pointer shadow-xs"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* DOCTOR FIELDS */}
          {selectedRole === 'DOCTOR' && (
            <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-purple-100">
                <Stethoscope className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-bold text-purple-900 block">Doctor Credentials & Affiliation:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Council Reg No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MCI-TN-58921"
                    value={councilRegNo}
                    onChange={(e) => setCouncilRegNo(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-purple-200 uppercase font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Specialization *</label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-purple-200"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Medical System Specialty *</label>
                  <select
                    value={doctorMedicineSystem}
                    onChange={(e) => setDoctorMedicineSystem(e.target.value as MedicineSystem)}
                    className="w-full p-2.5 rounded-xl border border-purple-200 font-medium bg-white"
                  >
                    <option value="ALLOPATHY_HOMEOPATHY">Modern Medicine / Allopathy</option>
                    <option value="AYURVEDA">Ayurveda</option>
                    <option value="YOGA">Yoga & Naturopathy</option>
                    <option value="SIDDHA">Siddha</option>
                    <option value="UNANI">Unani</option>
                  </select>
                </div>

                {/* Hospital Selection / Mention */}
                {renderHospitalSelector(
                  doctorHospitalSelect,
                  setDoctorHospitalSelect,
                  doctorCustomHospital,
                  setDoctorCustomHospital,
                  'doctor-custom-hospital'
                )}
              </div>

              {/* Medical Council Certificate Upload */}
              <div className="pt-2 border-t border-purple-100">
                {renderDocUploadWidget(
                  'Medical Council Registration Certificate / Degree Certificate',
                  doctorRegDoc,
                  setDoctorRegDoc,
                  () => setDoctorRegDoc(null),
                  'COUNCIL_REGISTRATION',
                  'doctor-council-doc-upload',
                  true
                )}
              </div>

              {/* Own Clinic Toggle */}
              <div className="pt-2 border-t border-purple-100 space-y-2">
                <label className="font-bold text-slate-700 text-xs block">
                  Do you have your own clinic? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasOwnClinic(true)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      hasOwnClinic
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50/50'
                    }`}
                  >
                    <span>Yes, I have a clinic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasOwnClinic(false);
                      setClinicLicenseDoc(null);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      !hasOwnClinic
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-purple-50/50'
                    }`}
                  >
                    <span>No, Hospital Affiliated</span>
                  </button>
                </div>

                {hasOwnClinic ? (
                  <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-2.5 mt-2 animate-fade-in text-xs">
                    <span className="text-[11px] font-bold text-purple-900 block">Clinic Details & License:</span>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Clinic Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sanjeevani Ayurveda & Wellness Clinic"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        className="w-full p-2 rounded-lg border border-purple-200 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Clinic Address *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 14, Gandhi Road, Adyar, Chennai"
                        value={clinicAddress}
                        onChange={(e) => setClinicAddress(e.target.value)}
                        className="w-full p-2 rounded-lg border border-purple-200 font-medium"
                      />
                    </div>
                    {renderDocUploadWidget(
                      'Clinic Registration / Establishment License',
                      clinicLicenseDoc,
                      setClinicLicenseDoc,
                      () => setClinicLicenseDoc(null),
                      'CLINIC_LICENSE',
                      'doctor-clinic-license-upload',
                      true
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                    ✓ Clinic license not required. Practice affiliation recorded with the specified hospital.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* NURSE FIELDS */}
          {selectedRole === 'NURSE' && (
            <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-purple-100">
                <HeartPulse className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-bold text-purple-900 block">Nurse Credentials & Institution:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nursing Council Reg No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TNC-NUR-88210"
                    value={nursingRegNo}
                    onChange={(e) => setNursingRegNo(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-purple-200 uppercase font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Shift</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-white"
                  >
                    <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                    <option value="Evening (16:00 - 00:00)">Evening (16:00 - 00:00)</option>
                    <option value="Night (00:00 - 08:00)">Night (00:00 - 08:00)</option>
                  </select>
                </div>

                {/* Hospital Selection / Mention */}
                {renderHospitalSelector(
                  nurseHospitalSelect,
                  setNurseHospitalSelect,
                  nurseCustomHospital,
                  setNurseCustomHospital,
                  'nurse-custom-hospital'
                )}
              </div>

              {/* Nursing Certificate Upload */}
              <div className="pt-2 border-t border-purple-100">
                {renderDocUploadWidget(
                  'Nursing Council Registration Certificate',
                  nurseRegDoc,
                  setNurseRegDoc,
                  () => setNurseRegDoc(null),
                  'COUNCIL_REGISTRATION',
                  'nurse-council-doc-upload',
                  true
                )}
              </div>
            </div>
          )}

          {/* LAB TECH FIELDS */}
          {selectedRole === 'LAB_TECHNICIAN' && (
            <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-sky-100">
                <FlaskConical className="w-4 h-4 text-sky-700" />
                <span className="text-xs font-bold text-sky-900 block">Lab Technician Certification & Facility:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Lab Certification / License No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NABL-LT-9912"
                    value={certificationNo}
                    onChange={(e) => setCertificationNo(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded-xl border border-sky-200 uppercase font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Section</label>
                  <input
                    type="text"
                    required
                    value={labSection}
                    onChange={(e) => setLabSection(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-sky-200"
                  />
                </div>

                {/* Hospital Selection / Mention */}
                {renderHospitalSelector(
                  labTechHospitalSelect,
                  setLabTechHospitalSelect,
                  labTechCustomHospital,
                  setLabTechCustomHospital,
                  'lab-tech-custom-hospital',
                  'border-sky-200'
                )}
              </div>

              {/* Lab Technician Certificate Upload */}
              <div className="pt-2 border-t border-sky-100">
                {renderDocUploadWidget(
                  'Lab Technician Certification / Registration Certificate',
                  labTechRegDoc,
                  setLabTechRegDoc,
                  () => setLabTechRegDoc(null),
                  'COUNCIL_REGISTRATION',
                  'lab-tech-council-doc-upload',
                  true
                )}
              </div>

              {/* Own Lab / Diagnostic Centre Toggle */}
              <div className="pt-2 border-t border-sky-100 space-y-2">
                <label className="font-bold text-slate-700 text-xs block">
                  Do you have your own diagnostic centre / lab? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasOwnLab(true)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      hasOwnLab
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-sky-50/50'
                    }`}
                  >
                    <span>Yes, I have a lab/centre</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasOwnLab(false);
                      setLabLicenseDoc(null);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      !hasOwnLab
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-sky-50/50'
                    }`}
                  >
                    <span>No, Hospital Affiliated</span>
                  </button>
                </div>

                {hasOwnLab ? (
                  <div className="p-3 bg-white rounded-xl border border-sky-200 space-y-2.5 mt-2 animate-fade-in text-xs">
                    <span className="text-[11px] font-bold text-sky-900 block">Diagnostic Centre Details & License:</span>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Diagnostic Centre / Lab Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Clinical Diagnostic Laboratory"
                        value={labName}
                        onChange={(e) => setLabName(e.target.value)}
                        className="w-full p-2 rounded-lg border border-sky-200 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Establishment Address *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 52, Cross Street, T. Nagar, Chennai"
                        value={labAddress}
                        onChange={(e) => setLabAddress(e.target.value)}
                        className="w-full p-2 rounded-lg border border-sky-200 font-medium"
                      />
                    </div>
                    {renderDocUploadWidget(
                      'Diagnostic Centre / Lab Establishment License',
                      labLicenseDoc,
                      setLabLicenseDoc,
                      () => setLabLicenseDoc(null),
                      'LAB_LICENSE',
                      'lab-tech-establishment-license-upload',
                      true
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic bg-sky-50/50 p-2 rounded-lg border border-sky-100">
                    ✓ Establishment license not required. Facility affiliation recorded with the specified hospital.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Create Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-brand-600 text-sm font-medium pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-brand-600 text-sm font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2 mt-4 text-sm active:scale-98"
          >
            <UserPlus className="w-5 h-5" />
            <span>
              Register as {selectedRole === 'PATIENT' ? 'Patient & Get ID' : selectedRole === 'DOCTOR' ? 'Doctor' : selectedRole === 'NURSE' ? 'Nurse' : 'Lab Tech'}
            </span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already have an ID?{' '}
            <button
              type="button"
              onClick={onGoToLogin}
              className="text-brand-600 font-bold hover:underline"
            >
              Login with Patient ID or Staff ID
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
