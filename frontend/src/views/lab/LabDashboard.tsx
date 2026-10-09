import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { ocrService } from '../../services/ocrService';
import { notificationService } from '../../services/notificationService';
import { LabSample } from '../../types';
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileUp,
  BarChart2,
  Search,
  Check,
  X,
  Lock,
  ChevronRight,
  FileText,
} from 'lucide-react';

export const LabDashboard: React.FC = () => {
  const { currentUser } = useAuth();

  const [samples, setSamples] = useState<LabSample[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<LabSample | null>(null);
  const [activeCardModal, setActiveCardModal] = useState<
    'SAMPLES_TODAY' | 'TESTS_IN_PROGRESS' | 'REPORTS_COMPLETED' | 'ALL_REPORTS' | null
  >(null);

  // New sample registration form state
  const [newPatientId, setNewPatientId] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newTestName, setNewTestName] = useState('Complete Blood Count (CBC)');
  const [newSampleType, setNewSampleType] = useState<LabSample['sampleType']>('Blood');
  const [newDepartment, setNewDepartment] = useState<LabSample['department']>('Hematology');

  // Report upload state
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  useEffect(() => {
    setSamples(storageService.getAllLabSamples());
  }, []);

  const handleRegisterSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientId || !newPatientName) return;

    const registered = storageService.registerLabSample({
      patientId: newPatientId.toUpperCase(),
      patientName: newPatientName,
      testName: newTestName,
      sampleType: newSampleType,
      department: newDepartment,
      technicianName: currentUser.name,
    });

    setSamples(prev => [registered, ...prev]);
    setIsRegisterOpen(false);
    setNewPatientId('');
    setNewPatientName('');
  };

  const handleUpdateStatus = (sampleId: string, status: LabSample['status']) => {
    storageService.updateLabSampleStatus(sampleId, status, status === 'COMPLETED' ? 'Analysis verified within clinical standards.' : undefined);
    setSamples(storageService.getAllLabSamples());
  };

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSample || !reportFile) return;

    await ocrService.processDocument(reportFile, selectedSample.patientId);
    handleUpdateStatus(selectedSample.sampleId, 'COMPLETED');
    setIsUploadOpen(false);

    // Intimate completion to Lab Tech, Doctor, and Patient
    notificationService.intimateLabReportCompleted({
      patientId: selectedSample.patientId,
      patientName: selectedSample.patientName,
      testName: selectedSample.testName,
      techName: currentUser.name,
    });

    setReportSuccess(`Lab diagnostic report uploaded and linked to Patient ID ${selectedSample.patientId}`);
    setTimeout(() => setReportSuccess(null), 4000);
  };

  const filteredSamples = samples.filter((s) => {
    return (
      s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sampleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.testName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xl shadow-sm border border-sky-100">
            <FlaskConical className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{currentUser.name}</h2>
            <p className="text-xs text-slate-500 font-medium">
              {currentUser.labTechDetails?.labSection} • {currentUser.labTechDetails?.hospital}
            </p>
          </div>
        </div>

        {/* Data Minimization badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>DPDP Purpose-Restricted Access (Lab Samples Only)</span>
          </span>
        </div>
      </div>

      {reportSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-scale-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{reportSuccess}</span>
        </div>
      )}

      {/* 4 DYNAMIC CLICKABLE DASHBOARD SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Samples Today */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveCardModal('SAMPLES_TODAY')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveCardModal('SAMPLES_TODAY')}
          className="p-5 bg-white hover:bg-sky-50/40 rounded-3xl border border-slate-100 hover:border-sky-200 shadow-sm hover:shadow-md transition-all cursor-pointer group select-none"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-sky-50 group-hover:bg-sky-100 text-sky-600 rounded-2xl transition-colors">
              <FlaskConical className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{samples.length}</span>
            <p className="text-xs text-slate-500 font-medium">Samples Today</p>
          </div>
        </div>

        {/* Card 2: Tests in Progress */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveCardModal('TESTS_IN_PROGRESS')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveCardModal('TESTS_IN_PROGRESS')}
          className="p-5 bg-white hover:bg-amber-50/40 rounded-3xl border border-slate-100 hover:border-amber-200 shadow-sm hover:shadow-md transition-all cursor-pointer group select-none"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-amber-50 group-hover:bg-amber-100 text-amber-600 rounded-2xl transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">
              {samples.filter(s => s.status === 'IN_PROGRESS').length}
            </span>
            <p className="text-xs text-slate-500 font-medium">Tests in Progress</p>
          </div>
        </div>

        {/* Card 3: Reports Completed */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveCardModal('REPORTS_COMPLETED')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveCardModal('REPORTS_COMPLETED')}
          className="p-5 bg-white hover:bg-emerald-50/40 rounded-3xl border border-slate-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition-all cursor-pointer group select-none"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 rounded-2xl transition-colors">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">
              {samples.filter(s => s.status === 'COMPLETED').length}
            </span>
            <p className="text-xs text-slate-500 font-medium">Reports Completed</p>
          </div>
        </div>

        {/* Card 4: Total Diagnostic Reports */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveCardModal('ALL_REPORTS')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveCardModal('ALL_REPORTS')}
          className="p-5 bg-white hover:bg-purple-50/40 rounded-3xl border border-slate-100 hover:border-purple-200 shadow-sm hover:shadow-md transition-all cursor-pointer group select-none"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-50 group-hover:bg-purple-100 text-purple-600 rounded-2xl transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-purple-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">
              {ocrService.getAllReports().length}
            </span>
            <p className="text-xs text-slate-500 font-medium">Reports Generated</p>
          </div>
        </div>
      </div>

      {/* Samples Worklist Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">Diagnostic Samples & Testing Pipeline</h3>
            <p className="text-xs text-slate-500">Track accessioning, update analyzer status, and upload verified reports</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sample or ID..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Register Sample</span>
            </button>
          </div>
        </div>

        {/* Worklist Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Sample Barcode</th>
                <th className="py-3 px-4">Patient ID & Name</th>
                <th className="py-3 px-4">Test Name</th>
                <th className="py-3 px-4">Specimen</th>
                <th className="py-3 px-4">Testing Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSamples.map((s) => (
                <tr key={s.sampleId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.sampleId}</td>
                  <td className="py-3 px-4">
                    <span className="font-extrabold text-slate-900 block">{s.patientName}</span>
                    <span className="font-mono text-[11px] text-slate-400">{s.patientId}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{s.testName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {s.sampleType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        s.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    {s.status === 'COLLECTED' && (
                      <button
                        onClick={() => handleUpdateStatus(s.sampleId, 'IN_PROGRESS')}
                        className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-lg text-xs"
                      >
                        Start Test
                      </button>
                    )}
                    {s.status !== 'COMPLETED' && (
                      <button
                        onClick={() => {
                          setSelectedSample(s);
                          setIsUploadOpen(true);
                        }}
                        className="py-1 px-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg text-xs inline-flex items-center gap-1"
                      >
                        <FileUp className="w-3 h-3" />
                        <span>Upload Report</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



      {/* SAMPLE REGISTRATION MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Register New Lab Sample</h3>
              <button onClick={() => setIsRegisterOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSample} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Patient ID:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PAT-0001"
                  value={newPatientId}
                  onChange={(e) => {
                    const id = e.target.value.toUpperCase();
                    setNewPatientId(id);
                    const p = storageService.getPatientById(id);
                    if (p) setNewPatientName(p.fullName);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono uppercase"
                />
              </div>

              {(() => {
                const verified = newPatientId.trim() ? storageService.getPatientById(newPatientId) : null;
                if (verified) {
                  return (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] space-y-0.5">
                      <div className="flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified Patient Identity: {verified.fullName}</span>
                      </div>
                      <p className="text-emerald-700">
                        Age: {verified.age} • Gender: {verified.sex || verified.gender || 'N/A'} • Phone: {verified.phone}
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Patient Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="Patient Name"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Test Name:</label>
                <input
                  type="text"
                  required
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Sample Type:</label>
                  <select
                    value={newSampleType}
                    onChange={(e) => setNewSampleType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="Blood">Blood</option>
                    <option value="Urine">Urine</option>
                    <option value="Sputum">Sputum</option>
                    <option value="Swab">Swab</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Department:</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Microbiology">Microbiology</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="py-2 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl"
                >
                  Register Sample
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD REPORT MODAL */}
      {isUploadOpen && selectedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Upload Diagnostic Report</h3>
                <p className="text-xs text-slate-500">Attach PDF/Image report for {selectedSample.patientId}</p>
              </div>
              <button onClick={() => setIsUploadOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadReport} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p><b>Test:</b> {selectedSample.testName}</p>
                <p><b>Patient:</b> {selectedSample.patientName} ({selectedSample.patientId})</p>
                <p><b>Barcode:</b> {selectedSample.sampleId}</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Choose Verified Report Document (PDF / JPG / PNG):</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setReportFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full p-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="py-2 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!reportFile}
                  className="py-2 px-5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Upload & OCR Process</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CARD DETAIL MODAL */}
      {activeCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                  {activeCardModal === 'SAMPLES_TODAY' && <FlaskConical className="w-5 h-5" />}
                  {activeCardModal === 'TESTS_IN_PROGRESS' && <Clock className="w-5 h-5" />}
                  {activeCardModal === 'REPORTS_COMPLETED' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {activeCardModal === 'ALL_REPORTS' && <FileText className="w-5 h-5 text-purple-600" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {activeCardModal === 'SAMPLES_TODAY' && "Today's Diagnostic Samples"}
                    {activeCardModal === 'TESTS_IN_PROGRESS' && 'Tests Currently in Progress on Analyzers'}
                    {activeCardModal === 'REPORTS_COMPLETED' && 'Completed Lab Test Records'}
                    {activeCardModal === 'ALL_REPORTS' && 'All Stored Diagnostic Reports'}
                  </h3>
                  <p className="text-xs text-slate-500">Live laboratory records for {currentUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveCardModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-3">
              {activeCardModal === 'SAMPLES_TODAY' && (
                samples.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No samples accessioned today.</p>
                ) : (
                  samples.map(s => (
                    <div key={s.sampleId} className="p-3.5 bg-slate-50 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 block">{s.testName}</span>
                        <span className="font-mono text-[11px] text-slate-500">{s.sampleId} • Patient: {s.patientName} ({s.patientId})</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        s.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  ))
                )
              )}

              {activeCardModal === 'TESTS_IN_PROGRESS' && (
                samples.filter(s => s.status === 'IN_PROGRESS').length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No tests currently running on analyzer.</p>
                ) : (
                  samples.filter(s => s.status === 'IN_PROGRESS').map(s => (
                    <div key={s.sampleId} className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 block">{s.testName}</span>
                        <span className="font-mono text-[11px] text-slate-600">{s.sampleId} • {s.patientName} ({s.patientId})</span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveCardModal(null);
                          setSelectedSample(s);
                          setIsUploadOpen(true);
                        }}
                        className="py-1.5 px-3 bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        <span>Upload Report</span>
                      </button>
                    </div>
                  ))
                )
              )}

              {activeCardModal === 'REPORTS_COMPLETED' && (
                samples.filter(s => s.status === 'COMPLETED').length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No completed tests recorded.</p>
                ) : (
                  samples.filter(s => s.status === 'COMPLETED').map(s => (
                    <div key={s.sampleId} className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 block">{s.testName}</span>
                        <span className="font-mono text-[11px] text-slate-500">{s.sampleId} • {s.patientName} ({s.patientId})</span>
                        {s.summaryFindings && (
                          <p className="text-[11px] text-slate-600 font-medium mt-1">Findings: {s.summaryFindings}</p>
                        )}
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Verified
                      </span>
                    </div>
                  ))
                )
              )}

              {activeCardModal === 'ALL_REPORTS' && (
                ocrService.getAllReports().length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No diagnostic reports stored in database.</p>
                ) : (
                  ocrService.getAllReports().map(r => (
                    <div key={r.id} className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 block">{r.reportTitle}</span>
                        <span className="font-mono text-[11px] text-slate-500">{r.id} • Patient: {r.patientId} • Date: {r.reportDate}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        {r.doctorVerificationStatus}
                      </span>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
