import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { dpdpService } from '../services/dpdpService';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';

interface AuthContextType {
  currentUser: User;
  activeRole: UserRole;
  switchRole: (role: UserRole) => void;
  loginWithCredentials: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithId: (idOrIdentifier: string) => boolean;
  loginAsPatient: (patientId: string) => boolean;
  logout: () => void;
  isKioskMode: boolean;
  setKioskMode: (enabled: boolean) => void;
}

const DEFAULT_USERS: Record<UserRole, User> = {
  PATIENT: {
    id: 'USR-PAT-0001',
    role: 'PATIENT',
    name: 'Kavitha Raman',
    patientId: 'PAT-0001',
    phone: '9840123456',
    email: 'kavitha.raman@sample.in',
    isDemoAccount: true,
    accountStatus: 'ACTIVE',
    age: 44,
    sex: 'FEMALE',
    gender: 'FEMALE',
    ageGroup: 'ADULT',
  },
  DOCTOR: {
    id: 'USR-DOC-0001',
    staffId: 'DOC-0001',
    role: 'DOCTOR',
    name: 'Dr. A. Sundaram (MD)',
    email: 'dr.sundaram@aihc.hospital',
    isDemoAccount: true,
    accountStatus: 'ACTIVE',
    doctorDetails: {
      specialization: 'Senior Physician & Internal Medicine',
      department: 'General Medicine & OPD',
      hospital: 'AIHC Multi-Speciality Hospital',
      councilRegNo: 'MCI-TN-48291',
      medicineSystem: 'ALLOPATHY_HOMEOPATHY',
      isOnline: true,
    },
  },
  NURSE: {
    id: 'USR-NUR-0001',
    staffId: 'NUR-0001',
    role: 'NURSE',
    name: 'Nurse Deepa V',
    email: 'deepa.v@aihc.hospital',
    isDemoAccount: true,
    accountStatus: 'ACTIVE',
    nurseDetails: {
      department: 'OPD Triage & Emergency Assessment',
      hospital: 'AIHC Multi-Speciality Hospital',
      nursingRegNo: 'TNC-NUR-99120',
      shift: 'Morning (08:00 - 16:00)',
    },
  },
  LAB_TECHNICIAN: {
    id: 'USR-LAB-0001',
    staffId: 'LAB-0001',
    role: 'LAB_TECHNICIAN',
    name: 'Suresh K (Lab Tech)',
    email: 'suresh.k@aihc.hospital',
    isDemoAccount: true,
    accountStatus: 'ACTIVE',
    labTechDetails: {
      labSection: 'Clinical Biochemistry & Hematology Diagnostic Center',
      hospital: 'AIHC Multi-Speciality Hospital',
      certificationNo: 'NABL-LT-8812',
    },
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    return (localStorage.getItem('aihc_active_role') as UserRole) || 'PATIENT';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('aihc_active_user');
    return saved ? JSON.parse(saved) : DEFAULT_USERS[activeRole];
  });

  const [isKioskMode, setIsKioskMode] = useState<boolean>(() => {
    return localStorage.getItem('aihc_kiosk_mode') === 'true';
  });

  const switchRole = (role: UserRole) => {
    setActiveRole(role);
    const user = DEFAULT_USERS[role];
    setCurrentUser(user);
    localStorage.setItem('aihc_active_role', role);
    localStorage.setItem('aihc_active_user', JSON.stringify(user));

    dpdpService.logAudit({
      actorId: user.id,
      actorRole: role,
      action: 'LOGIN',
      resourceId: `ROLE_${role}`,
      details: `Switched session role to ${role}`,
    });
  };

  // Secure authenticated login with Unique ID and Password
  const loginWithCredentials = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const resp = await apiService.login(identifier, password);
      if (resp && resp.user) {
        setActiveRole(resp.user.role);
        setCurrentUser(resp.user);
        localStorage.setItem('aihc_active_role', resp.user.role);
        localStorage.setItem('aihc_active_user', JSON.stringify(resp.user));
        return { success: true };
      }
    } catch (apiErr: any) {
      console.warn('Backend login attempt failed, falling back to local credentials:', apiErr?.message);
    }

    const result = await storageService.authenticateUser(identifier, password);
    if (result.success && result.user && result.role) {
      setActiveRole(result.role);
      setCurrentUser(result.user);
      localStorage.setItem('aihc_active_role', result.role);
      localStorage.setItem('aihc_active_user', JSON.stringify(result.user));
      return { success: true };
    }
    return {
      success: false,
      error: result.error || 'Authentication failed. Please verify your credentials.',
    };
  };

  // Universal Login by Patient ID or Staff ID (DOC-, NUR-, LAB-)
  const loginWithId = (idOrIdentifier: string): boolean => {
    const cleanId = idOrIdentifier.trim().toUpperCase();
    const found = storageService.findUserById(cleanId);

    if (found) {
      setActiveRole(found.role);
      setCurrentUser(found);
      localStorage.setItem('aihc_active_role', found.role);
      localStorage.setItem('aihc_active_user', JSON.stringify(found));

      dpdpService.logAudit({
        actorId: found.id,
        actorRole: found.role,
        action: 'LOGIN',
        resourceId: found.patientId || found.staffId || found.id,
        details: `${found.role} logged in via identifier ${cleanId}`,
      });
      return true;
    }

    // If ID format matches but not explicitly in seed, generate session
    if (cleanId.startsWith('DOC-')) {
      const docUser: User = {
        id: `USR-${cleanId}`,
        staffId: cleanId,
        role: 'DOCTOR',
        name: 'Registered Doctor',
        doctorDetails: {
          specialization: 'General Medicine',
          department: 'OPD',
          hospital: 'AIHC Multi-Speciality Hospital',
          isOnline: true,
        },
      };
      setActiveRole('DOCTOR');
      setCurrentUser(docUser);
      localStorage.setItem('aihc_active_role', 'DOCTOR');
      localStorage.setItem('aihc_active_user', JSON.stringify(docUser));
      return true;
    }

    if (cleanId.startsWith('NUR-')) {
      const nurUser: User = {
        id: `USR-${cleanId}`,
        staffId: cleanId,
        role: 'NURSE',
        name: 'Registered Nurse',
        nurseDetails: {
          department: 'OPD Triage',
          hospital: 'AIHC Multi-Speciality Hospital',
          shift: 'Morning',
        },
      };
      setActiveRole('NURSE');
      setCurrentUser(nurUser);
      localStorage.setItem('aihc_active_role', 'NURSE');
      localStorage.setItem('aihc_active_user', JSON.stringify(nurUser));
      return true;
    }

    if (cleanId.startsWith('LAB-')) {
      const labUser: User = {
        id: `USR-${cleanId}`,
        staffId: cleanId,
        role: 'LAB_TECHNICIAN',
        name: 'Registered Lab Technician',
        labTechDetails: {
          labSection: 'Clinical Diagnostics',
          hospital: 'AIHC Multi-Speciality Hospital',
        },
      };
      setActiveRole('LAB_TECHNICIAN');
      setCurrentUser(labUser);
      localStorage.setItem('aihc_active_role', 'LAB_TECHNICIAN');
      localStorage.setItem('aihc_active_user', JSON.stringify(labUser));
      return true;
    }

    // Default to Patient login
    return loginAsPatient(cleanId);
  };

  const loginAsPatient = (patientId: string): boolean => {
    const cleanId = patientId.trim().toUpperCase();
    const existing = storageService.getPatientById(cleanId);

    const user: User = {
      id: `USR-${cleanId}`,
      role: 'PATIENT',
      name: existing ? existing.fullName : 'Registered Patient',
      patientId: cleanId,
      phone: existing?.phone,
      email: existing?.email,
      age: existing?.age,
      sex: existing?.sex,
      gender: existing?.gender || existing?.sex,
      ageGroup: existing?.ageGroup,
      patientDetails: {
        age: existing?.age,
        sex: existing?.sex,
        gender: existing?.gender || existing?.sex,
        ageGroup: existing?.ageGroup,
      },
    };

    setActiveRole('PATIENT');
    setCurrentUser(user);
    localStorage.setItem('aihc_active_role', 'PATIENT');
    localStorage.setItem('aihc_active_user', JSON.stringify(user));

    dpdpService.logAudit({
      actorId: cleanId,
      actorRole: 'PATIENT',
      action: 'LOGIN',
      resourceId: `PATIENT_${cleanId}`,
      details: `Patient logged in via Patient ID ${cleanId}`,
    });

    return true;
  };

  const logout = () => {
    apiService.logout();
    dpdpService.logAudit({
      actorId: currentUser.id,
      actorRole: activeRole,
      action: 'LOGOUT',
      resourceId: 'SESSION',
      details: `User logged out`,
    });
    switchRole('PATIENT');
  };

  const setKioskMode = (enabled: boolean) => {
    setIsKioskMode(enabled);
    localStorage.setItem('aihc_kiosk_mode', enabled ? 'true' : 'false');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        switchRole,
        loginWithCredentials,
        loginWithId,
        loginAsPatient,
        logout,
        isKioskMode,
        setKioskMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
