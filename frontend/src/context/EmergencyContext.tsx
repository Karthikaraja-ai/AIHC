import React, { createContext, useContext, useState, useEffect } from 'react';
import { EmergencyAlert } from '../types';
import { emergencyDetector } from '../services/emergencyDetector';

interface EmergencyContextType {
  activeAlerts: EmergencyAlert[];
  triggerEmergency: (patientId: string, patientName: string, reason: string) => EmergencyAlert;
  acknowledgeAlert: (alertId: string, staffName: string) => void;
  unacknowledgedCount: number;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>(() => {
    return emergencyDetector.getActiveAlerts();
  });

  // Play synthesized emergency alert beep
  const playAlertTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15); // A4
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  const triggerEmergency = (patientId: string, patientName: string, reason: string): EmergencyAlert => {
    const newAlert = emergencyDetector.createEmergencyAlert(patientId, patientName, reason, 'EMERGENCY');
    setActiveAlerts(prev => [newAlert, ...prev]);
    playAlertTone();
    return newAlert;
  };

  const acknowledgeAlert = (alertId: string, staffName: string) => {
    emergencyDetector.acknowledgeAlert(alertId, staffName);
    setActiveAlerts(prev =>
      prev.map(a => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED', acknowledgedBy: staffName } : a))
    );
  };

  const unacknowledgedCount = activeAlerts.filter(a => a.status === 'ACTIVE').length;

  return (
    <EmergencyContext.Provider
      value={{
        activeAlerts,
        triggerEmergency,
        acknowledgeAlert,
        unacknowledgedCount,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};
