import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './i18n';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { EmergencyProvider } from './context/EmergencyContext';

import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { EmergencyModal } from './components/common/EmergencyModal';
import { storageService } from './services/storageService';

// Patient Views
import { SplashScreen } from './views/patient/SplashScreen';
import { LoginScreen } from './views/patient/LoginScreen';
import { RegistrationScreen } from './views/patient/RegistrationScreen';
import { RegistrationSuccessScreen } from './views/patient/RegistrationSuccessScreen';
import { ABDMConsentScreen } from './views/patient/ABDMConsentScreen';
import { PatientDashboard } from './views/patient/PatientDashboard';
import { AppointmentBooking } from './views/patient/AppointmentBooking';
import { MedicineSystemSelectScreen } from './views/patient/MedicineSystemSelectScreen';
import { HospitalSelectScreen } from './views/patient/HospitalSelectScreen';
import { DoctorSelectScreen } from './views/patient/DoctorSelectScreen';
import { AIPreConsultationIntro } from './views/patient/AIPreConsultationIntro';
import { AIQuestionScreen } from './views/patient/AIQuestionScreen';
import { AISummaryScreen } from './views/patient/AISummaryScreen';
import { ConsultationReportUploadScreen } from './views/patient/ConsultationReportUploadScreen';
import { ReportsScreen } from './views/patient/ReportsScreen';
import { MedicineRemindersScreen } from './views/patient/MedicineRemindersScreen';
import { HistoryScreen } from './views/patient/HistoryScreen';
import { HealthRecordsScreen } from './views/patient/HealthRecordsScreen';
import { ProfileScreen } from './views/patient/ProfileScreen';
import { ConsentManagementScreen } from './views/patient/ConsentManagementScreen';

// Clinical Staff Views (Strictly NO Admin)
import { DoctorDashboard } from './views/doctor/DoctorDashboard';
import { NurseDashboard } from './views/nurse/NurseDashboard';
import { LabDashboard } from './views/lab/LabDashboard';

// Kiosk Mode
import { KioskPatientJourney } from './views/kiosk/KioskPatientJourney';

import { PatientProfile, Appointment, MedicineSystem, Hospital, DoctorDirectoryEntry } from './types';
import { AIConversationContext } from './services/aiEngine';

type PatientScreen =
  | 'SPLASH'
  | 'LOGIN'
  | 'REGISTER'
  | 'REGISTER_SUCCESS'
  | 'ABDM_CONSENT'
  | 'DASHBOARD'
  | 'SELECT_SYSTEM'
  | 'SELECT_HOSPITAL'
  | 'SELECT_DOCTOR'
  | 'BOOK_APPOINTMENT'
  | 'PRE_CONSULT_INTRO'
  | 'AI_QUESTION'
  | 'AI_SUMMARY'
  | 'CONSULTATION_REPORT_UPLOAD'
  | 'REPORTS'
  | 'MEDICINE_REMINDERS'
  | 'HISTORY'
  | 'HEALTH_RECORDS'
  | 'PROFILE'
  | 'CONSENT_MGMT';

const MainAppContent: React.FC = () => {
  const { activeRole, isKioskMode, currentUser } = useAuth();

  // Patient navigation state
  const [currentScreen, setCurrentScreen] = useState<PatientScreen>('DASHBOARD');
  const [registeredProfile, setRegisteredProfile] = useState<PatientProfile | null>(null);
  const [activeAIContext, setActiveAIContext] = useState<AIConversationContext | null>(null);
  const [bottomNavTab, setBottomNavTab] = useState<'home' | 'history' | 'profile'>('home');

  // Multi-System Consultation State
  const [chosenSystem, setChosenSystem] = useState<MedicineSystem>('AYURVEDA');
  const [chosenHospital, setChosenHospital] = useState<Hospital | undefined>(undefined);
  const [chosenDoctor, setChosenDoctor] = useState<DoctorDirectoryEntry | undefined>(undefined);

  // If in Hospital Kiosk Mode -> render tactile Kiosk interface
  if (isKioskMode) {
    return <KioskPatientJourney />;
  }

  const handleLogout = () => {
    setCurrentScreen('LOGIN');
  };

  // Doctor Dashboard View
  if (activeRole === 'DOCTOR') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header onLogout={handleLogout} />
        <main className="flex-1">
          <DoctorDashboard />
        </main>
        <EmergencyModal />
      </div>
    );
  }

  // Nurse Dashboard View
  if (activeRole === 'NURSE') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header onLogout={handleLogout} />
        <main className="flex-1">
          <NurseDashboard />
        </main>
        <EmergencyModal />
      </div>
    );
  }

  // Lab Technician Dashboard View
  if (activeRole === 'LAB_TECHNICIAN') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header onLogout={handleLogout} />
        <main className="flex-1">
          <LabDashboard />
        </main>
      </div>
    );
  }

  // PATIENT VIEW JOURNEY
  const handleBottomTabChange = (tab: 'home' | 'history' | 'profile') => {
    setBottomNavTab(tab);
    if (tab === 'home') setCurrentScreen('DASHBOARD');
    if (tab === 'history') setCurrentScreen('HISTORY');
    if (tab === 'profile') setCurrentScreen('PROFILE');
  };

  const handleDashboardNavigate = (cardId: string) => {
    if (cardId === 'ai-pre-consultation') {
      const patientId = currentUser.patientId || 'PAT-0001';
      const auth = storageService.canPatientAccessPreConsultation(patientId);
      if (auth.allowed) {
        setCurrentScreen('AI_QUESTION');
      } else {
        alert(auth.reason || 'Pre-Consultation is available only after booking an appointment.');
        setCurrentScreen('SELECT_SYSTEM');
      }
    } else if (cardId === 'consultation-report-upload') {
      const patientId = currentUser.patientId || 'PAT-0001';
      const auth = storageService.canPatientAccessReportSummarizer(patientId);
      if (auth.allowed) {
        setCurrentScreen('CONSULTATION_REPORT_UPLOAD');
      } else {
        alert(auth.reason || 'Report Summarizer is accessible only after Pre-Consultation is completed.');
      }
    } else if (cardId === 'book-appointment') {
      setCurrentScreen('SELECT_SYSTEM');
    } else if (cardId === 'reports' || cardId === 'prescriptions') {
      setCurrentScreen('REPORTS');
    } else if (cardId === 'medicine-reminders' || cardId === 'reminders') {
      setCurrentScreen('MEDICINE_REMINDERS');
    } else if (cardId === 'health-records') {
      setCurrentScreen('HEALTH_RECORDS');
    } else if (cardId === 'consultation-history') {
      setCurrentScreen('HISTORY');
    } else if (cardId === 'profile' || cardId === 'medical-profile') {
      setCurrentScreen('PROFILE');
      setBottomNavTab('profile');
    } else if (cardId === 'doctor-support') {
      alert('AIHC OPD Helpline: +91-44-2834-0000 | Ambulance / Emergency: 108');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <main className="flex-1 py-6">
        {/* Screen 1: Splash */}
        {currentScreen === 'SPLASH' && (
          <SplashScreen
            onGetStarted={() => setCurrentScreen('REGISTER')}
            onLogin={() => setCurrentScreen('LOGIN')}
          />
        )}

        {/* Screen 2: Login */}
        {currentScreen === 'LOGIN' && (
          <LoginScreen
            onLoginSuccess={() => setCurrentScreen('DASHBOARD')}
            onGoToRegister={() => setCurrentScreen('REGISTER')}
          />
        )}

        {/* Screen 3: Registration */}
        {currentScreen === 'REGISTER' && (
          <RegistrationScreen
            onSuccess={(profile) => {
              setRegisteredProfile(profile);
              setCurrentScreen('REGISTER_SUCCESS');
            }}
            onGoToLogin={() => setCurrentScreen('LOGIN')}
            onBack={() => setCurrentScreen('SPLASH')}
          />
        )}

        {/* Screen 4: Registration Success */}
        {currentScreen === 'REGISTER_SUCCESS' && registeredProfile && (
          <RegistrationSuccessScreen
            patientProfile={registeredProfile}
            onContinueToConsent={() => setCurrentScreen('ABDM_CONSENT')}
            onGoToLogin={() => setCurrentScreen('LOGIN')}
          />
        )}

        {/* Screen 5: ABDM Health Consent */}
        {currentScreen === 'ABDM_CONSENT' && registeredProfile && (
          <ABDMConsentScreen
            patientId={registeredProfile.patientId}
            onConsentDecided={() => setCurrentScreen('DASHBOARD')}
          />
        )}

        {/* Screen 6: Patient Dashboard */}
        {currentScreen === 'DASHBOARD' && (
          <PatientDashboard
            onNavigate={handleDashboardNavigate}
            onLogout={handleLogout}
          />
        )}

        {/* Screen 7A: Select Medicine System (Step 1 of Consultation) */}
        {currentScreen === 'SELECT_SYSTEM' && (
          <MedicineSystemSelectScreen
            selectedSystem={chosenSystem}
            onSelectSystem={(sys) => {
              setChosenSystem(sys);
              setCurrentScreen('SELECT_HOSPITAL');
            }}
            onBack={() => setCurrentScreen('DASHBOARD')}
          />
        )}

        {/* Screen 7B: Select Hospital (Step 2 of Mobile Consultation) */}
        {currentScreen === 'SELECT_HOSPITAL' && (
          <HospitalSelectScreen
            medicineSystem={chosenSystem}
            onSelectHospital={(hosp) => {
              setChosenHospital(hosp);
              setCurrentScreen('SELECT_DOCTOR');
            }}
            onBack={() => setCurrentScreen('SELECT_SYSTEM')}
          />
        )}

        {/* Screen 7C: Select Available Doctor (Step 3 of Mobile Consultation) */}
        {currentScreen === 'SELECT_DOCTOR' && (
          <DoctorSelectScreen
            medicineSystem={chosenSystem}
            hospital={chosenHospital}
            onSelectDoctor={(doc) => {
              setChosenDoctor(doc);
              // Proceed to date & time slot selection to confirm booking
              setCurrentScreen('BOOK_APPOINTMENT');
            }}
            onBack={() => setCurrentScreen('SELECT_HOSPITAL')}
          />
        )}

        {/* Screen 8: Booking Screen (Date, Time Slot & Confirmation) */}
        {currentScreen === 'BOOK_APPOINTMENT' && (
          <AppointmentBooking
            initialMedicineSystem={chosenSystem}
            initialHospital={chosenHospital}
            initialDoctor={chosenDoctor}
            onAppointmentConfirmed={(apt: Appointment) => {
              setCurrentScreen('AI_QUESTION');
            }}
            onStartPreConsultation={(apt: Appointment) => {
              setCurrentScreen('AI_QUESTION');
            }}
            onCancel={() => setCurrentScreen('DASHBOARD')}
          />
        )}

        {/* Screen 9: AI Pre Consultation Intro */}
        {currentScreen === 'PRE_CONSULT_INTRO' && (() => {
          const auth = storageService.canPatientAccessPreConsultation(currentUser.patientId || 'PAT-0001');
          if (!auth.allowed) {
            return (
              <div className="max-w-md mx-auto p-6 bg-white rounded-3xl border border-amber-200 text-center space-y-4 shadow-sm">
                <p className="text-amber-800 font-semibold">{auth.reason || 'AI Pre-Consultation is available only after booking an appointment.'}</p>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('SELECT_SYSTEM')}
                  className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-brand-700"
                >
                  Book Appointment First
                </button>
              </div>
            );
          }
          return (
            <AIPreConsultationIntro
              onStart={() => setCurrentScreen('AI_QUESTION')}
              onBack={() => setCurrentScreen('DASHBOARD')}
            />
          );
        })()}

        {/* Screen 10: AI Dynamic Questions, Body Map, Voice ASR */}
        {currentScreen === 'AI_QUESTION' && (() => {
          const auth = storageService.canPatientAccessPreConsultation(currentUser.patientId || 'PAT-0001');
          if (!auth.allowed) {
            return (
              <div className="max-w-md mx-auto p-6 bg-white rounded-3xl border border-amber-200 text-center space-y-4 shadow-sm">
                <p className="text-amber-800 font-semibold">{auth.reason || 'Pre-Consultation is available only after booking an appointment.'}</p>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('SELECT_SYSTEM')}
                  className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-brand-700"
                >
                  Book Appointment First
                </button>
              </div>
            );
          }
          return (
            <AIQuestionScreen
              initialMedicineSystem={chosenSystem}
              initialHospital={chosenHospital}
              initialDoctor={chosenDoctor}
              onComplete={(ctx) => {
                setActiveAIContext(ctx);
                if (ctx.isRoutineTest) {
                  setCurrentScreen('CONSULTATION_REPORT_UPLOAD');
                } else {
                  setCurrentScreen('AI_SUMMARY');
                }
              }}
              onDirectReportScan={(ctx) => {
                setActiveAIContext(ctx);
                setCurrentScreen('CONSULTATION_REPORT_UPLOAD');
              }}
              onCancel={() => setCurrentScreen('DASHBOARD')}
            />
          );
        })()}

        {/* Screen 11: AI Pre-consultation Completion (Patient Reassurance) */}
        {currentScreen === 'AI_SUMMARY' && activeAIContext && (
          <AISummaryScreen
            context={activeAIContext}
            onProceedToBooking={() => setCurrentScreen('BOOK_APPOINTMENT')}
            onProceedToReports={() => setCurrentScreen('CONSULTATION_REPORT_UPLOAD')}
            onDone={() => setCurrentScreen('DASHBOARD')}
          />
        )}

        {/* Screen 11B: Consultation Report Upload (Guarded: accessible only after Pre-Consultation is done) */}
        {currentScreen === 'CONSULTATION_REPORT_UPLOAD' && (() => {
          const auth = storageService.canPatientAccessReportSummarizer(currentUser.patientId || 'PAT-0001');
          if (!auth.allowed) {
            return (
              <div className="max-w-md mx-auto p-6 bg-white rounded-3xl border border-amber-200 text-center space-y-4 shadow-sm">
                <p className="text-amber-800 font-semibold">{auth.reason || 'Report Summarizer is accessible only after Pre-Consultation is completed.'}</p>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('DASHBOARD')}
                  className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl cursor-pointer hover:bg-brand-700"
                >
                  Return to Dashboard
                </button>
              </div>
            );
          }
          return (
            <ConsultationReportUploadScreen
              onBack={() => setCurrentScreen('DASHBOARD')}
              onDone={() => setCurrentScreen('DASHBOARD')}
            />
          );
        })()}

        {/* Screen 12: Reports & OCR */}
        {currentScreen === 'REPORTS' && (
          <ReportsScreen
            onBack={() => setCurrentScreen('DASHBOARD')}
            onNavigateToReminders={() => setCurrentScreen('MEDICINE_REMINDERS')}
          />
        )}

        {/* Screen 12B: Medicine Reminders & Adherence Tracker */}
        {currentScreen === 'MEDICINE_REMINDERS' && (
          <MedicineRemindersScreen onBack={() => setCurrentScreen('DASHBOARD')} />
        )}

        {/* Screen 13: Consultation History */}
        {currentScreen === 'HISTORY' && (
          <HistoryScreen onBack={() => setCurrentScreen('DASHBOARD')} />
        )}

        {/* Screen 14: Health Records */}
        {currentScreen === 'HEALTH_RECORDS' && (
          <HealthRecordsScreen onBack={() => setCurrentScreen('DASHBOARD')} />
        )}

        {/* Screen 15: Profile */}
        {currentScreen === 'PROFILE' && (
          <ProfileScreen
            onOpenConsent={() => setCurrentScreen('CONSENT_MGMT')}
            onBack={() => {
              setCurrentScreen('DASHBOARD');
              setBottomNavTab('home');
            }}
          />
        )}

        {/* Screen 16: Consent Management */}
        {currentScreen === 'CONSENT_MGMT' && (
          <ConsentManagementScreen onBack={() => setCurrentScreen('PROFILE')} />
        )}
      </main>

      {/* Global Bottom Navigation on Dashboard, History, and Profile */}
      {(currentScreen === 'DASHBOARD' || currentScreen === 'HISTORY' || currentScreen === 'PROFILE') && (
        <BottomNav activeTab={bottomNavTab} onTabChange={handleBottomTabChange} />
      )}

      {/* Emergency Overlay Modal */}
      <EmergencyModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AccessibilityProvider>
        <EmergencyProvider>
          <AuthProvider>
            <MainAppContent />
          </AuthProvider>
        </EmergencyProvider>
      </AccessibilityProvider>
    </LanguageProvider>
  );
};

export default App;

