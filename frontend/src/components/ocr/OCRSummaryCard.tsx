import React, { useState, useEffect } from 'react';
import { MedicalReport } from '../../types/ocr';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { VoiceButton } from '../common/VoiceButton';
import { ocrService } from '../../services/ocrService';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Eye,
  Download,
  Sparkles,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface OCRSummaryCardProps {
  report: MedicalReport;
  showDoctorVerificationAction?: boolean;
  onVerify?: () => void;
  onViewOriginal?: () => void;
  initialSummarized?: boolean;
  forceEnglish?: boolean;
}

export const OCRSummaryCard: React.FC<OCRSummaryCardProps> = ({
  report,
  showDoctorVerificationAction = false,
  onVerify,
  onViewOriginal,
  initialSummarized = false,
  forceEnglish = false,
}) => {
  const { language, t } = useTranslation();
  const { activeRole } = useAuth();
  const isStaff = activeRole !== 'PATIENT' || forceEnglish;
  const effectiveLanguage = isStaff ? 'en' : language;
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  // Patient touches the AI report Summarizer to summarize the report
  const [isSummarized, setIsSummarized] = useState(initialSummarized);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    setIsSummarized(initialSummarized);
    setIsSummarizing(false);
  }, [report.id, initialSummarized]);

  const localizedSummary =
    effectiveLanguage === 'ta'
      ? report.aiSummary?.ta || ''
      : effectiveLanguage === 'hi'
      ? report.aiSummary?.hi || ''
      : report.aiSummary?.en || '';

  const handleTriggerSummarizer = () => {
    setIsSummarizing(true);
    setTimeout(() => {
      setIsSummarizing(false);
      setIsSummarized(true);
    }, 500);
  };

  const handleDownloadOriginal = () => {
    if (report.fileDataUri && report.fileDataUri.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = report.fileDataUri;
      a.download = `${report.reportTitle.replace(/\s+/g, '_')}_Original.${report.fileType.toLowerCase()}`;
      a.click();
    } else {
      const rawText =
        report.extractedRawText ||
        `DIAGNOSTIC LABORATORY REPORT\nTitle: ${report.reportTitle}\nDate: ${report.reportDate}\nPatient ID: ${report.patientId}\n\nParameters:\n${(
          report.extractedParameters || []
        )
          .map((p) => `${p.parameterName}: ${p.measuredValue} ${p.unit} (Ref: ${p.referenceRange})`)
          .join('\n')}`;
      const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.reportTitle.replace(/\s+/g, '_')}_OriginalScan.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleView = () => {
    if (onViewOriginal) {
      onViewOriginal();
    } else {
      setShowPreviewModal(true);
    }
  };

  const abnormalParams = report.extractedParameters.filter((p) => p.isAbnormal);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base md:text-lg font-bold text-slate-900">{report.reportTitle}</h4>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                {report.fileType}
              </span>
              {report.ocrStatus && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase tracking-wider">
                  OCR: {report.ocrStatus}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {t.common.details}: {new Date(report.uploadedAt).toLocaleDateString()} • {report.id}
            </p>
          </div>
        </div>

        {/* Verification Status */}
        <div className="flex items-center gap-2">
          {report.doctorVerificationStatus === 'VERIFIED' ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.reports.verified}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.reports.unverified}</span>
            </span>
          )}

          {showDoctorVerificationAction && report.doctorVerificationStatus !== 'VERIFIED' && onVerify && (
            <button
              onClick={onVerify}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1 active:scale-95"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Verify & Sign Off</span>
            </button>
          )}
        </div>
      </div>

      {/* Dual Split: Original Document vs AI Report Summarizer Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Original Document Preview & Actions */}
        <div className="lg:col-span-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t.reports.originalReport}
              </span>
              <span className="text-[11px] text-brand-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.reports.originalPreserved}</span>
              </span>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-inner flex flex-col items-center justify-center min-h-[140px] text-center">
              <FileText className="w-12 h-12 text-brand-500/70 mb-2" />
              <p className="text-xs font-semibold text-slate-700 truncate max-w-full">
                {report.reportTitle}.{report.fileType.toLowerCase()}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {(report.fileSizeBytes / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          {/* Action Buttons: VIEW ORIGINAL REPORT & VIEW AI SUMMARY */}
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleView}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs border border-slate-300 shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Eye className="w-4 h-4 text-brand-600" />
                <span>{t.reports.viewOriginal}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isSummarized) {
                    handleTriggerSummarizer();
                  }
                }}
                className="py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-purple-200" />
                <span>{t.reports.aiSummary}</span>
              </button>
            </div>
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={handleDownloadOriginal}
                className="py-1 px-3 text-slate-500 hover:text-slate-700 font-semibold text-[11px] flex items-center gap-1 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.reports.downloadOriginal}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: AI Report Summarizer */}
        <div className="lg:col-span-8 space-y-4">
          {!isSummarized ? (
            /* Patient Touch To Summarize Interactive Panel */
            <div className="p-6 md:p-8 bg-gradient-to-br from-purple-500/10 via-brand-500/5 to-indigo-500/10 rounded-3xl border-2 border-dashed border-purple-200 text-center space-y-5 shadow-sm hover:border-purple-300 transition-all">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-purple-200 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
                  {t.reports.touchToSummarize}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {effectiveLanguage === 'ta'
                    ? 'நோயாளி இந்த அறிக்கையின் முக்கிய தகவல்கள், மாறுபட்ட அளவுகள் மற்றும் குறிச்சொற்களைப் பெற கீழே உள்ள பொத்தானைத் தொடவும்.'
                    : effectiveLanguage === 'hi'
                    ? 'मरीज़ इस रिपोर्ट से मुख्य निष्कर्ष, असामान्य मान और कीवर्ड प्राप्त करने के लिए नीचे दिए गए बटन को स्पर्श करें।'
                    : 'Touch the button below to extract key findings, abnormal parameters, and medical keywords.'}
                </p>
              </div>

              {/* Touch Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTriggerSummarizer}
                  disabled={isSummarizing}
                  className="py-4 px-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-600 hover:from-purple-700 hover:to-brand-700 text-white font-bold rounded-2xl shadow-xl shadow-purple-500/25 text-sm md:text-base flex items-center justify-center gap-2.5 mx-auto transition-all active:scale-95 cursor-pointer"
                >
                  {isSummarizing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{t.reports.processingOcr}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-purple-200" />
                      <span>{t.reports.touchToSummarize}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Summarized Report Output */
            <div className="space-y-4 animate-fade-in">
              {/* Low OCR Confidence Warning if applicable */}
              {(report.isLowConfidence || (report.confidenceScore && report.confidenceScore < 0.75)) && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-300 flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block">{t.common.error}</span>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      {t.reports.poorClarityNotice}
                    </p>
                  </div>
                </div>
              )}

              {/* AI Short Summary */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>{t.reports.aiSummary}</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      ✓ {t.common.completed}
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    <VoiceButton
                      textToSpeak={localizedSummary}
                      showListen={false}
                      showSpeak={true}
                      size="sm"
                    />
                    <button
                      type="button"
                      onClick={() => setIsSummarized(false)}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{t.common.tryAgain}</span>
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-brand-50/70 rounded-2xl border border-brand-100 text-xs md:text-sm text-brand-950 font-medium leading-relaxed whitespace-pre-wrap">
                  {localizedSummary}
                </div>
              </div>

              {/* Important Findings / Abnormal Values Alert */}
              {abnormalParams.length > 0 && (
                <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-800">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>{t.reports.abnormalDetected} ({abnormalParams.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {abnormalParams.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white text-red-700 border border-red-200 font-bold text-[11px] shadow-xs"
                      >
                        {p.parameterName}: {p.measuredValue} {p.unit} ({p.severity})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Parameters Table */}
              {report.extractedParameters.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-3">{t.reports.parameter}</th>
                        <th className="py-2.5 px-3">{t.reports.value}</th>
                        <th className="py-2.5 px-3">{t.reports.normalRange}</th>
                        <th className="py-2.5 px-3">{t.reports.status}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.extractedParameters.map((param, idx) => (
                        <tr key={idx} className={param.isAbnormal ? 'bg-red-50/40' : 'hover:bg-slate-50/50'}>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{param.parameterName}</td>
                          <td className="py-2.5 px-3 font-bold">
                            <span className={param.isAbnormal ? 'text-red-600' : 'text-slate-900'}>
                              {param.measuredValue} {param.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{param.referenceRange}</td>
                          <td className="py-2.5 px-3">
                            {param.isAbnormal ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                                {param.severity}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                                {t.reports.normal}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-[11px] text-slate-400 italic">
                ⚠️ {t.reports.ocrDisclaimer}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Built-in Original Document Viewer Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {t.reports.originalReport}: {report.reportTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              {report.fileDataUri && report.fileDataUri.startsWith('data:image') ? (
                <img
                  src={report.fileDataUri}
                  alt={report.reportTitle}
                  className="max-h-[60vh] mx-auto object-contain rounded-xl border border-slate-300"
                />
              ) : (
                <div className="font-mono text-xs text-slate-800 whitespace-pre-wrap bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto">
                  {report.extractedRawText || 'Original document preview.'}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-mono">
                {report.fileType} • {Math.round(report.fileSizeBytes / 1024)} KB
              </span>
              <button
                type="button"
                onClick={handleDownloadOriginal}
                className="py-2 px-4 bg-brand-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.reports.downloadOriginal}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
