import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { ReportUploader } from '../../components/ocr/ReportUploader';
import { ocrService } from '../../services/ocrService';
import { MedicalReport } from '../../types/ocr';
import { Appointment } from '../../types';
import {
  FileText,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Stethoscope,
  UploadCloud,
  AlertCircle,
  Info,
  FastForward,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { ConsultationProgressPath } from '../../components/common/ConsultationProgressPath';

interface ConsultationReportUploadScreenProps {
  onDone: () => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export const ConsultationReportUploadScreen: React.FC<ConsultationReportUploadScreenProps> = ({
  onDone,
  onBack,
  onCancel,
}) => {
  const handleBack = onBack || onCancel || onDone;
  const { language, t } = useTranslation();
  const { currentUser } = useAuth();
  const patientId = currentUser?.patientId || 'PAT-0001';

  // Backend authorization check
  const authCheck = storageService.canPatientAccessReportSummarizer(patientId);

  const [uploadedReports, setUploadedReports] = useState<MedicalReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [latestUploaded, setLatestUploaded] = useState<MedicalReport | null>(null);

  useEffect(() => {
    const rep1 = storageService.getReportsForPatient(patientId);
    const rep2 = ocrService.getReportsForPatient(patientId, true);
    const map = new Map<string, MedicalReport>();
    [...rep1, ...rep2].forEach(r => {
      if (r && r.id) map.set(r.id, r);
    });
    const list = Array.from(map.values());
    setUploadedReports(list);
    if (list.length > 0 && !selectedReportId) {
      setSelectedReportId(list[0].id);
    }
  }, [patientId]);

  const aiSummary = storageService.getAISummaryForPatient(patientId);
  const isRoutineTest = Boolean(
    aiSummary?.chiefComplaint?.toLowerCase().includes('regular') ||
    aiSummary?.chiefComplaint?.toLowerCase().includes('routine') ||
    aiSummary?.chiefComplaint?.toLowerCase().includes('sugar') ||
    aiSummary?.chiefComplaint?.toLowerCase().includes('pressure')
  );

  const appointment: Appointment | undefined = authCheck.appointment;

  const handleReportProcessed = (newReport: MedicalReport) => {
    // Save report to database
    storageService.saveMedicalReport(newReport);
    ocrService.saveReport(newReport);
    setUploadedReports(prev => [newReport, ...prev.filter(r => r.id !== newReport.id)]);
    setSelectedReportId(newReport.id);
    setLatestUploaded(newReport);
  };

  const handleDeleteReport = (reportId: string) => {
    storageService.deleteMedicalReport(reportId);
    ocrService.deleteReport(reportId);
    setUploadedReports(prev => prev.filter(r => r.id !== reportId));
    if (selectedReportId === reportId) {
      setSelectedReportId('');
    }
    if (latestUploaded?.id === reportId) {
      setLatestUploaded(null);
    }
  };

  if (!authCheck.allowed) {
    return (
      <div className="max-w-xl mx-auto p-6 animate-fade-in">
        <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Pre-Consultation Required</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {authCheck.reason || 'Please complete your Pre-Consultation before uploading reports for your consultation.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleBack}
              className="py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl text-xs transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 animate-fade-in space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
              Consultation Report Upload
            </span>
            <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {language === 'ta' ? 'விருப்பத்தேர்வு (Optional)' : language === 'hi' ? 'वैकल्पिक (Optional)' : 'Optional'}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900">
            Upload Reports for Doctor Consultation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload medical test reports (blood tests, pathology, imaging) so your consulting doctor can review them.
          </p>
        </div>

        {/* Regular Test Checkup Notice Banner */}
        {isRoutineTest && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-950 flex items-start gap-3 animate-fade-in">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-sm block text-purple-900">
                {language === 'ta'
                  ? 'வழக்கமான பரிசோதனை வருகை: உங்கள் அறிக்கையை இங்கே ஸ்கேன் செய்யவும்'
                  : language === 'hi'
                  ? 'नियमित जांच परामर्श: अपनी टेस्ट रिपोर्ट यहां स्कैन करें'
                  : 'Regular Test Visit: Scan Your Lab Report on this Device'}
              </span>
              <p className="text-purple-800 leading-relaxed font-medium">
                {language === 'ta'
                  ? 'உங்கள் மொபைல் கேமரா அல்லது சாதனத்தில் உள்ள கோப்புகள் மூலம் சர்க்கரை, ரத்த அழுத்தம் அல்லது பிற பரிசோதனை அறிக்கையை ஸ்கேன் செய்யலாம்.'
                  : language === 'hi'
                  ? 'अपने मोबाइल कैमरे या फाइलों से शुगर, बीपी या अन्य टेस्ट रिपोर्ट स्कैन करें।'
                  : 'You came for a regular routine test. Use your mobile camera or stored files to scan and attach your report for Dr. ' + (appointment?.doctorName || 'your doctor') + '.'}
              </p>
            </div>
          </div>
        )}

        {/* Optional Notice Banner */}
        <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-sm">
              {language === 'ta'
                ? 'மருத்துவ அறிக்கைகள் பதிவேற்றம் விருப்பத்தேர்வாகும் (Reports are Optional)'
                : language === 'hi'
                ? 'रिपोर्ट अपलोड वैकल्पिक है (Reports are Optional)'
                : 'Medical Report Upload is Optional'}
            </p>
            <p className="text-amber-800 leading-relaxed font-medium">
              {language === 'ta'
                ? 'உங்களிடம் பரிசோதனை அறிக்கைகள் இல்லையெனில், நீங்கள் இந்த படியைத் தவிர்த்துவிட்டு நேரடியாக உங்கள் மருத்துவ ஆலோசனையைத் தொடரலாம்.'
                : language === 'hi'
                ? 'यदि आपके पास कोई टेस्ट रिपोर्ट नहीं है, तो आप इस चरण को छोड़ सकते हैं और सीधे डॉक्टर परामर्श के लिए आगे बढ़ सकते हैं।'
                : 'If you do not have any lab or diagnostic reports to upload, you can skip this step and proceed directly to your Doctor Consultation.'}
            </p>
          </div>
        </div>

        {/* Consulting Doctor & Facility Info */}
        {appointment && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Stethoscope className="w-4 h-4 text-brand-600" />
              <span>{appointment.doctorName}</span>
            </div>
            {appointment.hospital && (
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{appointment.hospital}</span>
              </div>
            )}
            <div className="text-slate-500 font-medium ml-auto">
              Slot: <strong className="text-slate-800">{appointment.timeSlot}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Visual Consultation Process Path with Ticks */}
      <ConsultationProgressPath
        currentStep={Boolean(latestUploaded || uploadedReports.length > 0 || (typeof window !== 'undefined' && localStorage.getItem(`aihc_reports_skipped_${patientId}`) === 'true')) ? 4 : 3}
        completedSteps={Boolean(latestUploaded || uploadedReports.length > 0 || (typeof window !== 'undefined' && localStorage.getItem(`aihc_reports_skipped_${patientId}`) === 'true')) ? [1, 2, 3] : [1, 2]}
        doctorName={appointment?.doctorName}
        hospitalName={appointment?.hospital}
      />

      {/* Success Confirmation Card if Report was uploaded */}
      {latestUploaded && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-emerald-950 space-y-3 animate-scale-in">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base">
                Report Uploaded Successfully
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                Your report <strong>"{latestUploaded.reportTitle}"</strong> has been securely filed for Dr. {appointment?.doctorName || 'your doctor'}. The clinical findings will be reviewed during your consultation.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-600">Document Type: <strong>{latestUploaded.fileType}</strong></span>
            <span className="text-slate-600">Size: <strong>{Math.round(latestUploaded.fileSizeBytes / 1024)} KB</strong></span>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Ready for Doctor
              </span>
              <button
                type="button"
                onClick={() => handleDeleteReport(latestUploaded.id)}
                className="px-2 py-0.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg font-bold border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Remove this uploaded report"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'நீக்கு' : language === 'hi' ? 'हटाएं' : 'Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing or Already Uploaded Reports on File */}
      {uploadedReports.length > 0 && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              <h3 className="text-sm md:text-base font-extrabold text-slate-900">
                {language === 'ta'
                  ? `கோப்பில் உள்ள ஏற்கனவே பதிவேற்றப்பட்ட அறிக்கைகள் (${uploadedReports.length})`
                  : language === 'hi'
                  ? `मौजूदा / पूर्व अपलोड की गई मेडिकल रिपोर्ट (${uploadedReports.length})`
                  : `Existing & Already Uploaded Reports on File (${uploadedReports.length})`}
              </h3>
            </div>
            <span className="text-[11px] text-brand-700 font-bold bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
              {language === 'ta' ? 'இணைக்க தட்டவும்' : language === 'hi' ? 'चुनें' : 'Tap to Select'}
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {uploadedReports.map((report) => {
              const isSelected = selectedReportId === report.id;

              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left space-y-2.5 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          {report.reportTitle}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {report.fileType || 'PDF'}
                        </span>
                        {report.doctorVerificationStatus === 'VERIFIED' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {report.verifiedByDoctorName || 'Verified by Doctor'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            Ready for OPD Review
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Report Date: <strong>{report.reportDate || (report.uploadedAt ? new Date(report.uploadedAt).toLocaleDateString() : 'Recent')}</strong> • Ref: <code>{report.id}</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected ? (
                        <>
                          <div className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{language === 'ta' ? 'இணைக்கப்பட்டது' : language === 'hi' ? 'संलग्न' : 'Attached'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReportId('');
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Remove attachment from this consultation"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{language === 'ta' ? 'நீக்கு' : language === 'hi' ? 'हटाएं' : 'Detach'}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReportId(report.id);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 hover:border-emerald-300 border border-transparent rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          {language === 'ta' ? 'இணைக்க' : language === 'hi' ? 'चुनें' : 'Attach'}
                        </button>
                      )}

                      {/* Delete Report from System */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(report.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title={language === 'ta' ? 'அறிக்கையை நீக்கு' : language === 'hi' ? 'रिपोर्ट हटाएं' : 'Delete / Remove Report'}
                        aria-label="Delete report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Extracted Parameter Pills */}
                  {report.extractedParameters && report.extractedParameters.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {report.extractedParameters.slice(0, 5).map((param, idx) => (
                        <span
                          key={idx}
                          className={`text-[11px] px-2 py-0.5 rounded-lg font-medium border flex items-center gap-1 ${
                            param.isAbnormal
                              ? 'bg-red-50 text-red-700 border-red-200 font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{param.parameterName}:</span>
                          <strong className={param.isAbnormal ? 'text-red-800' : 'text-slate-900'}>
                            {param.measuredValue} {param.unit}
                          </strong>
                          {param.isAbnormal && (
                            <span className="text-[9px] px-1 bg-red-200 text-red-900 rounded font-black">
                              {param.severity || 'ABNORMAL'}
                            </span>
                          )}
                        </span>
                      ))}
                      {report.extractedParameters.length > 5 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{report.extractedParameters.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Report Uploader Interface */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-brand-600" />
          <span>Select & Upload Document</span>
        </h3>
        <ReportUploader
          patientId={patientId}
          onReportProcessed={handleReportProcessed}
        />
      </div>

      {/* Privacy Notice */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-500 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          The medical report is securely stored and permanently preserved under DPDP guidelines. Clinical interpretation and AI summaries are prepared strictly for authorized medical practitioners.
        </p>
      </div>

      {/* Action Buttons: Skip (Optional) or Done */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(`aihc_reports_skipped_${patientId}`, 'true');
            } catch (e) {}
            onDone();
          }}
          className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl border border-slate-300 text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <FastForward className="w-4 h-4 text-slate-600" />
          <span>
            {language === 'ta'
              ? '⏩ இந்த படியைத் தவிர்க்கவும் (விருப்பத்தேர்வு) →'
              : language === 'hi'
              ? '⏩ यह चरण छोड़ें (வैकल्पिक) →'
              : '⏩ Skip this Step (Reports are Optional) →'}
          </span>
        </button>

        <button
          type="button"
          onClick={onDone}
          className="py-3.5 px-8 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 transition-all text-sm active:scale-95 cursor-pointer"
        >
          {uploadedReports.length > 0
            ? (language === 'ta' ? 'முடிந்தது & ஆலோசனைக்குச் செல்' : language === 'hi' ? 'पूर्ण & परामर्श पर जाएं' : 'Done & Proceed to Doctor Consultation')
            : (language === 'ta' ? 'முடிந்தது & டாஷ்போர்டு திரும்பு' : language === 'hi' ? 'पूर्ण & डैशबोर्ड पर जाएं' : 'Done & Return to Dashboard')}
        </button>
      </div>
    </div>
  );
};
