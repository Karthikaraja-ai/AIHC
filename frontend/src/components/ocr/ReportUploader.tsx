import React, { useState, useRef } from 'react';
import { ocrService } from '../../services/ocrService';
import { MedicalReport } from '../../types/ocr';
import { useTranslation } from '../../i18n';
import {
  Camera,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Sparkles,
  ShieldCheck,
  Activity,
  Heart,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface ReportUploaderProps {
  patientId: string;
  onReportProcessed: (report: MedicalReport) => void;
  defaultRoutineCategory?: string;
}

export const ReportUploader: React.FC<ReportUploaderProps> = ({
  patientId,
  onReportProcessed,
}) => {
  const { language } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeScanningTitle, setActiveScanningTitle] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successReport, setSuccessReport] = useState<MedicalReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick 1-Tap Routine Test Scanners for Patient Mobile & Own Devices
  const routineScanners = [
    {
      id: 'sugar_panel',
      category: 'Blood Sugar / Diabetic Panel',
      title: {
        en: 'Blood Sugar / Diabetes Report',
        ta: 'ரத்த சர்க்கரை / நீரிழிவு அறிக்கை',
        hi: 'ब्लड शुगर / मधुमेह रिपोर्ट',
      },
      subtitle: {
        en: 'Fasting Glucose 142 mg/dL, HbA1c 7.4%',
        ta: 'பாஸ்டிங் சர்க்கரை 142 mg/dL, HbA1c 7.4%',
        hi: 'फास्टिंग ग्लूकोज 142 mg/dL, एचबीए1सी 7.4%',
      },
      icon: Activity,
    },
    {
      id: 'bp_cardiac',
      category: 'Blood Pressure / Cardiac Panel',
      title: {
        en: 'Blood Pressure & Heart Report',
        ta: 'ரத்த அழுத்தம் & இதய பரிசோதனை',
        hi: 'ब्लड प्रेशर एवं हृदय रिपोर्ट',
      },
      subtitle: {
        en: 'BP 145/95 mmHg, Heart Rate 82 bpm',
        ta: 'ரத்த அழுத்தம் 145/95 mmHg, நாடி 82 bpm',
        hi: 'बीपी 145/95 mmHg, पल्स 82 bpm',
      },
      icon: Heart,
    },
    {
      id: 'thyroid_tft',
      category: 'Thyroid Function (TFT)',
      title: {
        en: 'Thyroid Profile (TSH / T3 / T4)',
        ta: 'தைராய்டு ஹார்மோன் அறிக்கை (TFT)',
        hi: 'थायराइड प्रोफाइल (टीशएच / टी3 / टी4)',
      },
      subtitle: {
        en: 'TSH 6.80 mIU/L, FT3 3.1 pg/mL',
        ta: 'TSH 6.80 mIU/L, FT3 3.1 pg/mL',
        hi: 'टीशएच 6.80 mIU/L, एफटी3 3.1 pg/mL',
      },
      icon: Sparkles,
    },
    {
      id: 'lipid_profile',
      category: 'Lipid Profile',
      title: {
        en: 'Lipid Profile / Cholesterol',
        ta: 'கொலஸ்ட்ரால் / கொழுப்பு அளவு அறிக்கை',
        hi: 'लिपिड प्रोफाइल / कोलेस्ट्रॉल',
      },
      subtitle: {
        en: 'Total Cholesterol 238 mg/dL, Triglycerides 190',
        ta: 'மொத்த கொலஸ்ட்ரால் 238 mg/dL, ட்ரைகிளிசரைடு 190',
        hi: 'कुल कोलेस्ट्रॉल 238 mg/dL, ट्राइग्लिसराइड 190',
      },
      icon: Activity,
    },
    {
      id: 'cbc_panel',
      category: 'Complete Blood Count (CBC)',
      title: {
        en: 'Complete Blood Count (CBC)',
        ta: 'முழுமையான ரத்த அணுக்கள் அறிக்கை (CBC)',
        hi: 'कंप्लीट ब्लड काउंट (सीबीसी)',
      },
      subtitle: {
        en: 'Hemoglobin 10.8 g/dL, Total WBC 11,800',
        ta: 'ஹீமோகுளோபின் 10.8 g/dL, வெள்ளை அணுக்கள் 11,800',
        hi: 'हीमोग्लोबिन 10.8 g/dL, डब्ल्यूबीसी 11,800',
      },
      icon: FileText,
    },
  ];

  // Process selected file (from Camera snapshot or Device file storage)
  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)) {
      setErrorMessage(
        language === 'ta'
          ? 'தயவுசெய்து கேமரா புகைப்படம், PDF அல்லது JPG/PNG ஆவணத்தை தேர்ந்தெடுக்கவும்.'
          : language === 'hi'
          ? 'कृपया कैमरा फोटो, पीडीएफ या जेपीजी/पीएनजी दस्तावेज चुनें।'
          : 'Please select a camera photo, PDF, or JPG/PNG document.'
      );
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setActiveScanningTitle(file.name || 'Mobile Camera Document');
    setUploadProgress(25);

    const timer1 = setTimeout(() => setUploadProgress(55), 450);
    const timer2 = setTimeout(() => setUploadProgress(85), 900);

    try {
      const report = await ocrService.processDocument(file, patientId);
      setUploadProgress(100);
      setIsProcessing(false);
      setSuccessReport(report);
      onReportProcessed(report);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Error processing report via OCR. Please try again.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
    }
  };

  // 1-Tap Quick Scan directly on Mobile / Personal Device
  const handleQuickRoutineScan = (scanner: typeof routineScanners[0]) => {
    setErrorMessage(null);
    setIsProcessing(true);
    setActiveScanningTitle(scanner.title[language] || scanner.title.en);
    setUploadProgress(30);

    const t1 = setTimeout(() => setUploadProgress(65), 400);
    const t2 = setTimeout(() => setUploadProgress(90), 800);

    setTimeout(() => {
      clearTimeout(t1);
      clearTimeout(t2);
      setUploadProgress(100);
      setIsProcessing(false);

      const report = ocrService.scanPhysicalDocument(
        scanner.category,
        patientId,
        scanner.title[language] || scanner.title.en
      );
      setSuccessReport(report);
      onReportProcessed(report);
    }, 1100);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hidden File Inputs: 1 for Native Mobile Camera & 1 for Storage Files */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Title & Instructions */}
      <div className="space-y-1">
        <h3 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-brand-600" />
          <span>
            {language === 'ta'
              ? 'மொபைல் கேமரா அல்லது சாதனம் மூலம் அறிக்கையை ஸ்கேன் செய்யவும்'
              : language === 'hi'
              ? 'मोबाइल कैमरा या डिवाइस से रिपोर्ट स्कैन करें'
              : 'Scan Report on Mobile or Your Own Device'}
          </span>
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {language === 'ta'
            ? 'உங்கள் மொபைல் கேமரா மூலம் காகித அறிக்கையைப் புகைப்படம் எடுக்கலாம், அல்லது ஏற்கனவே உள்ள PDF/படக் கோப்பைத் தேர்ந்தெடுக்கலாம்.'
            : language === 'hi'
            ? 'आप अपने मोबाइल कैमरे से पेपर रिपोर्ट की फोटो ले सकते हैं, या फोन में मौजूद पीडीएफ/इमेज अपलोड कर सकते हैं।'
            : 'Take a clear photo of your paper test report using your device camera, or select a stored PDF/Image.'}
        </p>
      </div>

      {/* Active OCR Optical Scanner Simulation Animation */}
      {isProcessing && (
        <div className="relative rounded-3xl overflow-hidden border-2 border-brand-500 bg-slate-950 p-6 text-white shadow-2xl space-y-4 animate-scale-in">
          {/* Animated Laser Scanning Beam */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-300 to-brand-400 shadow-[0_0_15px_#10b981] animate-bounce-short" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <ScanLine className="w-4 h-4 animate-spin" />
              <span>
                {language === 'ta' ? 'ஆப்டிகல் ஸ்கேனர் செயல்படுகிறது...' : language === 'hi' ? 'ऑप्टिकल स्कैनर सक्रिय...' : 'Optical OCR Scanner Active...'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300">{uploadProgress}%</span>
          </div>

          <div className="text-center py-4 space-y-2">
            <h4 className="text-lg font-black text-white">{activeScanningTitle}</h4>
            <p className="text-xs text-slate-300">
              {language === 'ta'
                ? 'பரிசோதனை அளவுகள், இயல்பு வரம்புகள் மற்றும் மருத்துவக் குறிப்புகள் கண்டறியப்படுகின்றன...'
                : language === 'hi'
                ? 'नैदानिक पैरामीटर एवं संदर्भ श्रेणियों का विश्लेषण किया जा रहा है...'
                : 'Extracting diagnostic biomarkers, reference ranges & clinical observations...'}
            </p>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* TWO PRIMARY SCANNING ACTIONS FOR PATIENT DEVICE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ACTION 1: Direct Native Mobile Camera Scanner */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => cameraInputRef.current?.click()}
          className="p-5 rounded-3xl border-2 border-brand-300 bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 hover:from-brand-500 hover:to-indigo-500 text-white shadow-xl shadow-brand-500/20 text-left transition-all flex flex-col justify-between gap-4 active:scale-95 cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30">
              📸 {language === 'ta' ? 'மொபைல் கேமரா' : language === 'hi' ? 'मोबाइल कैमरा' : 'Mobile Camera'}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-black leading-snug">
              {language === 'ta' ? 'கேமரா மூலம் அறிக்கையை ஸ்கேன் செய்' : language === 'hi' ? 'कैमरे से रिपोर्ट स्कैन करें' : 'Scan Report with Camera'}
            </h4>
            <p className="text-xs text-indigo-100 font-medium leading-relaxed">
              {language === 'ta'
                ? 'உங்கள் மொபைல் கேமராவைத் திறந்து காகித அறிக்கையைப் புகைப்படம் எடுக்க அழுத்தவும்.'
                : language === 'hi'
                ? 'मोबाइल कैमरा खोलकर पेपर टेस्ट रिपोर्ट की साफ फोटो लेने के लिए दबाएं।'
                : 'Open device camera to capture a clear photo of your printed lab test report.'}
            </p>
          </div>
        </button>

        {/* ACTION 2: Device File / PDF / Gallery Upload */}
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => fileInputRef.current?.click()}
          className="p-5 rounded-3xl border-2 border-slate-200 hover:border-brand-400 bg-slate-50 hover:bg-white text-left transition-all flex flex-col justify-between gap-4 active:scale-95 cursor-pointer group shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-200 group-hover:border-brand-300 transition-colors">
              <Upload className="w-6 h-6 text-brand-600" />
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700">
              📄 {language === 'ta' ? 'கோப்புகள் / PDF' : language === 'hi' ? 'फाइल / पीडीएफ' : 'Device Storage / PDF'}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-900 leading-snug">
              {language === 'ta' ? 'சாதனத்திலிருந்து PDF / படம் தேர்வுசெய்' : language === 'hi' ? 'डिवाइस से पीडीएफ / इमेज चुनें' : 'Choose File / PDF from Device'}
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {language === 'ta'
                ? 'உங்கள் மொபைலில் பதிவிறக்கம் செய்யப்பட்ட ஆய்வக PDF அல்லது கேலரி படத்தை பதிவேற்றவும்.'
                : language === 'hi'
                ? 'फोन में सहेजी गई पैथोलॉजी लैब रिपोर्ट (पीडीएफ/जेपीजी) का चयन करें।'
                : 'Upload digital PDF lab test results or saved photos from phone storage.'}
            </p>
          </div>
        </button>
      </div>

      {/* QUICK 1-TAP ROUTINE LAB TEST SCANNERS */}
      <div className="p-5 bg-purple-50/70 rounded-3xl border border-purple-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-700" />
            <span className="text-xs font-black uppercase tracking-wider text-purple-900">
              {language === 'ta' ? 'விரைவு வழக்கமான பரிசோதனை ஸ்கேன் (1-டச்):' : language === 'hi' ? 'त्वरित नियमित टेस्ट स्कैनर (1-टच):' : '1-Tap Quick Routine Test Scanners:'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-purple-700 hidden sm:inline">
            {language === 'ta' ? 'உடனடி அறிக்கை உருவாக்கம்' : language === 'hi' ? 'तुरंत रिपोर्ट तैयार करें' : 'Instant Diagnostic Scan'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {routineScanners.map((sc) => {
            const IconComponent = sc.icon;
            const title = sc.title[language] || sc.title.en;
            const subtitle = sc.subtitle[language] || sc.subtitle.en;

            return (
              <button
                key={sc.id}
                type="button"
                disabled={isProcessing}
                onClick={() => handleQuickRoutineScan(sc)}
                className="p-3 bg-white rounded-2xl border border-purple-200 hover:border-brand-500 hover:shadow-md text-left transition-all active:scale-95 flex items-start gap-3 cursor-pointer group"
              >
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700 group-hover:bg-brand-600 group-hover:text-white transition-colors shrink-0">
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-900 block leading-tight truncate">
                    {title}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate mt-0.5 font-medium">
                    {subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message Notice */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-4 bg-rose-50 text-rose-900 rounded-2xl text-xs border border-rose-200 animate-scale-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <span className="font-extrabold block text-rose-800">Scanner Notice</span>
            <p className="leading-relaxed text-rose-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Scanned Report Result Preview */}
      {successReport && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 md:p-6 text-emerald-950 space-y-4 animate-scale-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-base text-emerald-950">
                    {successReport.reportTitle}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 border border-emerald-300">
                    ✓ Scanned on Device
                  </span>
                </div>
                <p className="text-xs text-emerald-800 font-medium">
                  {successReport.extractedParameters.length} diagnostic parameters extracted &amp; filed to doctor\'s OPD queue.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-emerald-800 bg-white/80 px-2.5 py-1 rounded-xl border border-emerald-200">
              {successReport.reportDate}
            </span>
          </div>

          {/* Critical Doctor Findings Alert if abnormal */}
          {successReport.criticalFindings && successReport.criticalFindings.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-300 space-y-1 text-xs">
              <span className="font-black text-amber-900 flex items-center gap-1.5 uppercase text-[10px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Doctor Attention Highlights:</span>
              </span>
              {successReport.criticalFindings.map((cf, idx) => (
                <p key={idx} className="text-amber-800 font-semibold text-[11px] leading-tight pl-4">
                  • {cf}
                </p>
              ))}
            </div>
          )}

          {/* Extracted Parameters Table Preview */}
          <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden shadow-xs">
            <div className="p-2.5 bg-emerald-100/60 border-b border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>Diagnostic Parameter</span>
              <span>Observed Value</span>
            </div>
            <div className="divide-y divide-emerald-100 max-h-48 overflow-y-auto">
              {successReport.extractedParameters.slice(0, 6).map((param, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-800 block leading-tight">{param.parameterName}</span>
                    <span className="text-[10px] text-slate-400">Ref: {param.referenceRange}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold text-xs ${param.isAbnormal ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {param.measuredValue} {param.unit}
                    </span>
                    <span className={`block text-[10px] font-bold ${param.isAbnormal ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {param.isAbnormal ? '⚠️ Check' : '✓ Normal'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DPDP Compliance and Doctor Assignment Confirmation */}
          <div className="flex items-center justify-between text-xs text-emerald-800 pt-1">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Attached to Doctor OPD Consultation</span>
            </span>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="text-[11px] text-brand-700 hover:text-brand-900 font-bold flex items-center gap-1 underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Scan Another Sheet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
