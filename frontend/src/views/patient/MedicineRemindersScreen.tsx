import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { MedicineReminder, AdherenceLog } from '../../types';
import {
  Pill,
  Clock,
  CheckCircle2,
  XCircle,
  BellRing,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  Activity,
  Check,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';

interface MedicineRemindersScreenProps {
  onBack?: () => void;
}

export const MedicineRemindersScreen: React.FC<MedicineRemindersScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const patientId = currentUser?.patientId || 'PAT-0001';

  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [snoozeNotif, setSnoozeNotif] = useState<string | null>(null);
  const [tickSuccessNotif, setTickSuccessNotif] = useState<string | null>(null);

  // New Reminder Form State
  const [formData, setFormData] = useState({
    medicineName: '',
    dosage: '',
    frequency: 'Twice daily',
    duration: '7 days',
    startDate: new Date().toISOString().split('T')[0],
    reminderTimes: '08:00 AM, 08:00 PM',
    instructions: 'Take after meals with warm water',
  });

  const refreshReminders = () => {
    const list = storageService.getMedicineRemindersForPatient(patientId);
    setReminders(list);
  };

  useEffect(() => {
    refreshReminders();
  }, [patientId]);

  // Log adherence action: TAKEN, SKIPPED, or SNOOZED
  const handleAdherenceAction = (
    reminderId: string,
    medicineName: string,
    action: 'TAKEN' | 'SKIPPED' | 'SNOOZED',
    time: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const notes =
      action === 'SNOOZED'
        ? 'Snoozed for 10 minutes. Reminder re-queued.'
        : action === 'TAKEN'
        ? 'Confirmed taken by patient.'
        : 'Skipped by patient.';

    storageService.logAdherence(reminderId, {
      date: today,
      time,
      status: action,
      notes,
    });

    if (action === 'SNOOZED') {
      setSnoozeNotif(`⏰ Snoozed "${medicineName}" (${time}) for 10 minutes.`);
      setTimeout(() => setSnoozeNotif(null), 4000);
    } else if (action === 'TAKEN') {
      setTickSuccessNotif(`✓ Dose Confirmed: "${medicineName}" marked as taken.`);
      setTimeout(() => setTickSuccessNotif(null), 4000);
    }

    refreshReminders();
  };

  // Toggle Reminder Status
  const handleToggleStatus = (reminder: MedicineReminder) => {
    const newStatus = reminder.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    storageService.updateReminderStatus(reminder.reminderId, newStatus);
    refreshReminders();
  };

  // Delete Reminder
  const handleDeleteReminder = (reminderId: string, medicineName: string) => {
    if (window.confirm(`Are you sure you want to delete the reminder for "${medicineName}"?`)) {
      storageService.deleteMedicineReminder(reminderId);
      refreshReminders();
    }
  };

  // Add Reminder Submit
  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medicineName.trim()) {
      alert('Please enter a medicine name.');
      return;
    }

    const times = formData.reminderTimes
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    storageService.createMedicineReminder({
      patientId,
      medicineName: formData.medicineName.trim(),
      dosage: formData.dosage.trim() || '1 dose',
      frequency: formData.frequency,
      duration: formData.duration,
      startDate: formData.startDate,
      reminderTimes: times.length > 0 ? times : ['08:00 AM'],
      instructions: formData.instructions.trim() || 'Take after meals.',
      status: 'ACTIVE',
    });

    const medName = formData.medicineName.trim();
    setFormData({
      medicineName: '',
      dosage: '',
      frequency: 'Twice daily',
      duration: '7 days',
      startDate: new Date().toISOString().split('T')[0],
      reminderTimes: '08:00 AM, 08:00 PM',
      instructions: 'Take after meals with warm water',
    });
    setShowAddModal(false);
    refreshReminders();
    setTickSuccessNotif(`✓ Reminder Scheduled: "${medName}" added to daily schedule.`);
    setTimeout(() => setTickSuccessNotif(null), 5000);
  };

  // Calculate Overall Adherence Statistics
  const allLogs: (AdherenceLog & { medicineName: string })[] = [];
  reminders.forEach(r => {
    if (r.adherenceLogs) {
      r.adherenceLogs.forEach(l => {
        allLogs.push({ ...l, medicineName: r.medicineName });
      });
    }
  });

  allLogs.sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());

  const takenCount = allLogs.filter(l => l.status === 'TAKEN').length;
  const skippedCount = allLogs.filter(l => l.status === 'SKIPPED').length;
  const snoozedCount = allLogs.filter(l => l.status === 'SNOOZED').length;
  const totalDecided = takenCount + skippedCount;
  const adherenceRate = totalDecided > 0 ? Math.round((takenCount / totalDecided) * 100) : 100;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20 md:pb-8">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-inner border border-teal-100">
            <Pill className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.reminders.title}</h1>
            <p className="text-xs text-slate-500 font-medium">
              {t.dashboard.patientId}: <span className="font-mono font-bold text-slate-700">{patientId}</span> • {t.reminders.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.reminders.addNewReminder}</span>
        </button>
      </div>

      {/* Tick Confirmation Notification */}
      {tickSuccessNotif && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 animate-slide-down shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{tickSuccessNotif}</span>
        </div>
      )}

      {/* Snooze Alert Notification */}
      {snoozeNotif && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2 animate-slide-down">
          <BellRing className="w-4 h-4 text-amber-600 animate-bounce" />
          <span>{snoozeNotif}</span>
        </div>
      )}

      {/* Adherence Summary Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-lg shadow-inner">
            {adherenceRate}%
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{adherenceRate}%</span>
            <p className="text-xs text-slate-400 font-medium">{t.reminders.overallAdherence}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-600">{takenCount}</span>
            <p className="text-xs text-slate-400 font-medium">{t.reminders.dosesTaken}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-rose-600">{skippedCount}</span>
            <p className="text-xs text-slate-400 font-medium">{t.reminders.dosesSkipped}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-amber-600">{snoozedCount}</span>
            <p className="text-xs text-slate-400 font-medium">{t.reminders.snoozedReminders}</p>
          </div>
        </div>
      </div>

      {/* Today's Schedule & Actionable Doses */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-black text-slate-900">{t.reminders.todaySchedule}</h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {reminders.filter(r => r.status === 'ACTIVE').length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">{t.reminders.noRemindersYet}</p>
            <p className="text-xs text-slate-400 mt-1">
              {t.reminders.noRemindersDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders
              .filter(r => r.status === 'ACTIVE')
              .map(reminder => (
                <div
                  key={reminder.reminderId}
                  className="p-4 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200 transition-colors space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{reminder.medicineName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                          {reminder.dosage}
                        </span>
                        {reminder.prescriptionId && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-100 text-blue-800">
                            Rx #{reminder.prescriptionId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {reminder.frequency} • {reminder.duration} • {reminder.instructions}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(reminder)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition-colors cursor-pointer"
                        title={reminder.status === 'ACTIVE' ? t.reminders.pauseBtn : t.reminders.resumeBtn}
                      >
                        <PauseCircle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteReminder(reminder.reminderId, reminder.medicineName)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
                        title={t.reminders.deleteBtn}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dose Times with Action Buttons */}
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.reminders.scheduledTimes}:</span>
                    {reminder.reminderTimes.map(time => {
                      const todayLog = reminder.adherenceLogs?.find(
                        l => l.date === today && l.time === time
                      );

                      return (
                        <div
                          key={time}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs shadow-sm"
                        >
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          <span className="font-bold text-slate-800">{time}</span>

                          {todayLog ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                todayLog.status === 'TAKEN'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : todayLog.status === 'SKIPPED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              ✓ {todayLog.status === 'TAKEN' ? t.reminders.takeDose : todayLog.status === 'SKIPPED' ? t.reminders.skipDose : t.reminders.snoozeDose}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 ml-1">
                              <button
                                type="button"
                                onClick={() => handleAdherenceAction(reminder.reminderId, reminder.medicineName, 'TAKEN', time)}
                                className="px-2 py-0.5 rounded-lg font-bold text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white transition-colors active:scale-95 cursor-pointer"
                                title={t.reminders.takeDose}
                              >
                                {t.reminders.takeDose}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdherenceAction(reminder.reminderId, reminder.medicineName, 'SNOOZED', time)}
                                className="px-2 py-0.5 rounded-lg font-bold text-[11px] bg-amber-500 hover:bg-amber-600 text-white transition-colors active:scale-95 cursor-pointer"
                                title={t.reminders.snoozeDose}
                              >
                                {t.reminders.snoozeDose}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdherenceAction(reminder.reminderId, reminder.medicineName, 'SKIPPED', time)}
                                className="px-2 py-0.5 rounded-lg font-bold text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors active:scale-95 cursor-pointer"
                                title={t.reminders.skipDose}
                              >
                                {t.reminders.skipDose}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Adherence Audit Log History */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-black text-slate-900">{t.reminders.adherenceHistory} ({allLogs.length})</h2>
        </div>

        {allLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">{t.reminders.noLogsYet}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">{t.history.date} & {t.history.slot}</th>
                  <th className="py-2.5 px-3">{t.reminders.medicineName}</th>
                  <th className="py-2.5 px-3">{t.history.status}</th>
                  <th className="py-2.5 px-3">{t.reminders.instructions}</th>
                  <th className="py-2.5 px-3 text-right">{t.history.date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allLogs.slice(0, 15).map(log => (
                  <tr key={log.logId} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {log.date} <span className="text-slate-400 text-[11px]">({log.time})</span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{log.medicineName}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          log.status === 'TAKEN'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'SKIPPED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.status === 'TAKEN' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === 'SKIPPED' && <XCircle className="w-3 h-3" />}
                        {log.status === 'SNOOZED' && <BellRing className="w-3 h-3" />}
                        <span>{log.status === 'TAKEN' ? t.reminders.takeDose : log.status === 'SKIPPED' ? t.reminders.skipDose : t.reminders.snoozeDose}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{log.notes || '—'}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-400">
                      {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statutory AI Safety Guardrail Alert */}
      <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 text-xs text-teal-900 space-y-1">
        <div className="flex items-center gap-2 font-bold text-teal-800">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>{t.reminders.guardrailNotice}</span>
        </div>
        <p className="text-[11px] leading-relaxed text-teal-800/90">
          {t.reminders.guardrailText}
        </p>
      </div>

      {/* Add Custom Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-100 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-slate-900">{t.reminders.addNewReminder}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddReminder} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.reminders.medicineName} *</label>
                <input
                  type="text"
                  required
                  value={formData.medicineName}
                  onChange={e => setFormData({ ...formData, medicineName: e.target.value })}
                  placeholder="e.g., Ashwagandha Churna, Paracetamol 650mg"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.reminders.dosage}</label>
                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={e => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g., 1 tablet, 5ml"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.reminders.frequency}</label>
                  <input
                    type="text"
                    value={formData.frequency}
                    onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                    placeholder="e.g., Twice daily"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.reminders.duration}</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 7 days, 1 month"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">{t.reminders.startDate}</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.reminders.reminderTimes}</label>
                <input
                  type="text"
                  value={formData.reminderTimes}
                  onChange={e => setFormData({ ...formData, reminderTimes: e.target.value })}
                  placeholder="e.g., 08:00 AM, 02:00 PM, 08:00 PM"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:border-teal-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t.reminders.instructions}</label>
                <textarea
                  rows={2}
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="e.g., Take after meals with warm water."
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-medium focus:border-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md active:scale-95 cursor-pointer"
                >
                  {t.reminders.addReminderBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
