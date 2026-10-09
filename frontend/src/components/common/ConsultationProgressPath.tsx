import React from 'react';
import { useTranslation } from '../../i18n';
import { Check, Calendar, Sparkles, FileText, Stethoscope, ChevronRight, CheckCircle2, RotateCcw } from 'lucide-react';

export interface ConsultationProgressPathProps {
  currentStep: 1 | 2 | 3 | 4;
  completedSteps: number[]; // e.g. [1], [1, 2], [1, 2, 3], or [1, 2, 3, 4]
  doctorName?: string;
  hospitalName?: string;
  timeSlot?: string;
  onStepClick?: (step: number) => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  onReverseToStarting?: () => void;
  className?: string;
}

export const ConsultationProgressPath: React.FC<ConsultationProgressPathProps> = ({
  currentStep,
  completedSteps,
  doctorName,
  hospitalName,
  timeSlot,
  onStepClick,
  onPrimaryAction,
  primaryActionLabel,
  onSecondaryAction,
  secondaryActionLabel,
  onReverseToStarting,
  className = '',
}) => {
  const { language } = useTranslation();

  const steps = [
    {
      step: 1,
      id: 'book-appointment',
      title: language === 'ta' ? 'முன்பதிவு' : language === 'hi' ? 'अपॉइंटमेंट' : 'Book Appointment',
      subtitle: language === 'ta' ? 'மருத்துவர் தேர்வு' : language === 'hi' ? 'डॉक्टर और समय' : 'Doctor & Slot',
      isOptional: false,
      icon: Calendar,
    },
    {
      step: 2,
      id: 'ai-pre-consultation',
      title: language === 'ta' ? 'ஆரம்பப் பரிசோதனை' : language === 'hi' ? 'पूर्व-परामर्श' : 'Pre-Consultation',
      subtitle: language === 'ta' ? 'அறிகுறிகள் & விவரங்கள்' : language === 'hi' ? 'लक्षण और विवरण' : 'Symptoms & Details',
      isOptional: false,
      icon: Sparkles,
    },
    {
      step: 3,
      id: 'upload-reports',
      title: language === 'ta' ? 'அறிக்கைகள் பதிவேற்றம்' : language === 'hi' ? 'रिपोर्ट अपलोड' : 'Upload Reports',
      subtitle: language === 'ta' ? 'ஆய்வக சோதனைகள் (விருப்பத்தேர்வு)' : language === 'hi' ? 'लैब टेस्ट (वैकल्पिक)' : 'Lab Reports (Optional)',
      isOptional: true,
      icon: FileText,
    },
    {
      step: 4,
      id: 'doctor-consultation',
      title: language === 'ta' ? 'மருத்துவர் ஆலோசனை' : language === 'hi' ? 'डॉक्टर परामर्श' : 'Doctor Consultation',
      subtitle: language === 'ta' ? 'மருந்துச்சீட்டு & கவனிப்பு' : language === 'hi' ? 'दवा और देखभाल' : 'Rx & Clinical Care',
      isOptional: false,
      icon: Stethoscope,
    },
  ];

  const totalCompleted = completedSteps.length;

  const getConfirmationMessage = () => {
    if (totalCompleted === 0) {
      return language === 'ta'
        ? 'படி 1: உங்கள் மருத்துவ ஆலோசனையைத் தொடங்க மருத்துவரை முன்பதிவு செய்யவும்.'
        : language === 'hi'
        ? 'चरण 1: अपना परामर्श शुरू करने के लिए डॉक्टर अपॉइंटमेंट बुक करें।'
        : 'Step 1: Book an appointment with your preferred doctor to start the process.';
    }
    if (totalCompleted === 1) {
      return language === 'ta'
        ? `✓ படி 1 முடிந்தது: முன்பதிவு உறுதி செய்யப்பட்டது${doctorName ? ` (${doctorName})` : ''}. அடுத்து: ஆரம்பப் பரிசோதனையை முடிக்கவும்.`
        : language === 'hi'
        ? `✓ चरण 1 पूर्ण: अपॉइंटमेंट कन्फर्म${doctorName ? ` (${doctorName})` : ''}। अगला: पूर्व-परामर्श पूरा करें।`
        : `✓ Step 1 Completed: Appointment Confirmed${doctorName ? ` with ${doctorName}` : ''}! Next: Complete Pre-Consultation.`;
    }
    if (totalCompleted === 2) {
      return language === 'ta'
        ? '✓ 2 படிகள் முடிந்தது: ஆரம்பப் பரிசோதனை வெற்றிகரமாக முடிந்தது! மருத்துவ அறிக்கைகளை பதிவேற்றலாம்.'
        : language === 'hi'
        ? '✓ 2 चरण पूर्ण: पूर्व-परामर्श पूरा हुआ! अपनी टेस्ट रिपोर्ट अपलोड कर सकते हैं।'
        : '✓ 2 Steps Completed: Pre-Consultation Finished & Verified! You may now upload medical test reports.';
    }
    if (totalCompleted === 3) {
      return language === 'ta'
        ? '✓ 3 படிகள் முடிந்தது: அறிக்கைகள் சமர்ப்பிக்கப்பட்டன! மருத்துவர் மதிப்பாய்வுக்கு தயாராக உள்ளது.'
        : language === 'hi'
        ? '✓ 3 चरण पूर्ण: रिपोर्ट अपलोड की गईं! डॉक्टर के समीक्षा के लिए तैयार है।'
        : '✓ 3 Steps Completed: Reports Uploaded & Verified! Ready for Attending Doctor review.';
    }
    return language === 'ta'
      ? '✓ முழு செயல்முறையும் முடிந்தது! 4 படிகளும் வெற்றிகரமாக சரிபார்க்கப்பட்டன. புதிய ஆலோசனையைத் தொடங்க செயல்முறையை மீட்டமைக்கலாம்.'
      : language === 'hi'
      ? '✓ पूरी प्रक्रिया पूर्ण! सभी 4 चरण सफलतापूर्वक पूरे हुए। नया परामर्श शुरू करने के लिए प्रक्रिया को रीसेट कर सकते हैं।'
      : '✓ Consultation Process Completed! All 4 steps successfully finished & verified. You can reverse to starting to begin a new consultation.';
  };

  return (
    <div className={`bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-sm space-y-4 ${className}`}>
      {/* Title Bar & Progress Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-wider">
            {language === 'ta' ? 'மருத்துவ ஆலோசனை செயல்முறைப் பாதை' : language === 'hi' ? 'परामर्श प्रक्रिया पथ' : 'Consultation Process Path'}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>
              {totalCompleted}/4 {language === 'ta' ? 'படிகள் முடிந்தது' : language === 'hi' ? 'चरण पूर्ण' : 'Steps Completed'}
            </span>
          </span>
        </div>
      </div>

      {/* Horizontal Visual Process Path with Ticks */}
      <div className="pt-2 pb-1 overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between min-w-[540px] md:min-w-full px-2">
          {steps.map((item, index) => {
            const isCompleted = completedSteps.includes(item.step);
            const isActive = item.step === currentStep && !isCompleted;
            const isClickable = Boolean(onStepClick && (isCompleted || isActive));
            const Icon = item.icon;

            return (
              <React.Fragment key={item.step}>
                {/* Step Node */}
                <div
                  onClick={() => isClickable && onStepClick && onStepClick(item.step)}
                  className={`flex flex-col items-center text-center group transition-all ${
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  style={{ width: '110px' }}
                >
                  {/* Circle Indicator */}
                  <div className="relative mb-2">
                    {isCompleted ? (
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200 ring-4 ring-emerald-100 transition-transform group-hover:scale-105">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                    ) : isActive ? (
                      <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-200 ring-4 ring-brand-100 animate-pulse transition-transform group-hover:scale-105">
                        <Icon className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 border-2 border-dashed border-slate-300 flex items-center justify-center text-xs font-black">
                        {item.step}
                      </div>
                    )}

                    {/* Checkmark tick badge for completed status */}
                    {isCompleted && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-sm border border-emerald-200 text-[10px] font-black">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="space-y-0.5">
                    <span
                      className={`text-xs font-bold leading-tight line-clamp-1 ${
                        isCompleted
                          ? 'text-emerald-800 font-extrabold'
                          : isActive
                          ? 'text-brand-700 font-extrabold'
                          : 'text-slate-400 font-medium'
                      }`}
                    >
                      {item.step}. {item.title}
                    </span>
                    {item.isOptional && (
                      <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-black">
                        {language === 'ta' ? 'விருப்பத்தேர்வு' : language === 'hi' ? 'वैकल्पिक' : 'Optional'}
                      </span>
                    )}
                    <span
                      className={`block text-[10px] truncate max-w-[100px] ${
                        isCompleted
                          ? 'text-emerald-600 font-semibold'
                          : isActive
                          ? 'text-brand-600 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {isCompleted ? '✓ Completed' : isActive ? 'Current Step' : item.subtitle}
                    </span>
                  </div>
                </div>

                {/* Connecting Line Between Steps */}
                {index < steps.length - 1 && (
                  <div className="flex-1 flex items-center px-1">
                    <div
                      className={`h-1 w-full rounded-full transition-all ${
                        completedSteps.includes(item.step) && (completedSteps.includes(steps[index + 1].step) || steps[index + 1].step === currentStep)
                          ? 'bg-emerald-500'
                          : completedSteps.includes(item.step)
                          ? 'bg-gradient-to-r from-emerald-500 to-brand-400'
                          : 'bg-slate-200 border-t border-dashed border-slate-300'
                      }`}
                    />
                    <ChevronRight
                      className={`w-4 h-4 -ml-2 shrink-0 ${
                        completedSteps.includes(item.step) ? 'text-emerald-500' : 'text-slate-300'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Confirmation & Next Action Banner with Ticks */}
      <div
        className={`p-4 md:p-5 rounded-2xl text-xs space-y-3 transition-colors ${
          totalCompleted === 4
            ? 'bg-emerald-100/80 text-emerald-950 border border-emerald-300'
            : totalCompleted > 0
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
            : 'bg-brand-50/70 text-slate-800 border border-brand-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              totalCompleted > 0 ? 'text-emerald-600' : 'text-brand-600'
            }`}
          />
          <div className="flex-1">
            <p className="font-bold text-sm leading-relaxed">{getConfirmationMessage()}</p>
            {(doctorName || hospitalName || timeSlot) && (
              <p className="text-xs text-slate-600 mt-1">
                {doctorName && <span>Doctor: <strong>{doctorName}</strong></span>}
                {timeSlot && <span> • <strong>{timeSlot}</strong></span>}
                {hospitalName && <span> • {hospitalName}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons for Current Step */}
        {(onPrimaryAction || onSecondaryAction || (totalCompleted === 4 && onReverseToStarting)) && (
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {totalCompleted === 4 && onReverseToStarting && (
              <button
                type="button"
                onClick={onReverseToStarting}
                className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl shadow-md text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {language === 'ta'
                    ? '🔄 தொடக்கத்திற்குத் திரும்பு (புதிய ஆலோசனை)'
                    : language === 'hi'
                    ? '🔄 आरंभ पर वापस जाएं (नया परामर्श)'
                    : '🔄 Start New Consultation (Reverse to Starting)'}
                </span>
              </button>
            )}
            {onPrimaryAction && primaryActionLabel && (
              <button
                type="button"
                onClick={onPrimaryAction}
                className="py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <span>{primaryActionLabel}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {onSecondaryAction && secondaryActionLabel && (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="py-3 px-5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {secondaryActionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
