import React from 'react';
import { useTranslation } from '../../i18n';
import { MedicineSystem } from '../../types';
import { VoiceButton } from '../../components/common/VoiceButton';
import {
  Leaf,
  Sparkles,
  Compass,
  Activity,
  Heart,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Check,
} from 'lucide-react';

interface MedicineSystemSelectScreenProps {
  selectedSystem?: MedicineSystem;
  onSelectSystem: (system: MedicineSystem) => void;
  onBack: () => void;
}

export const MedicineSystemSelectScreen: React.FC<MedicineSystemSelectScreenProps> = ({
  selectedSystem,
  onSelectSystem,
  onBack,
}) => {
  const { language, t } = useTranslation();

  const systems: Array<{
    id: MedicineSystem;
    title: { en: string; ta: string; hi: string };
    subLabel: { en: string; ta: string; hi: string };
    icon: any;
    color: string;
    badge: string;
  }> = [
    {
      id: 'AYURVEDA',
      title: {
        en: 'Ayurveda (ஆயுர்வேதம்)',
        ta: 'ஆயுர்வேதம் (Ayurveda)',
        hi: 'आयुर्वेद (Ayurveda)',
      },
      subLabel: {
        en: 'Tridosha (Vata, Pitta, Kapha) balance, Panchakarma detox & classical herbal therapy',
        ta: 'திரிதோஷ சமநிலை, பஞ்சகர்மா நச்சுநீக்கம் மற்றும் பாரம்பரிய மூலிகை ஆரோக்கியம்',
        hi: 'त्रिदोष संतुलन, पंचकर्म विषहरण एवं पारंपरिक हर्बल चिकित्सा',
      },
      icon: Leaf,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Tridosha & Panchakarma',
    },
    {
      id: 'UNANI',
      title: {
        en: 'Unani (யுனானி)',
        ta: 'யுனானி மருத்துவம் (Unani)',
        hi: 'यूनानी चिकित्सा (Unani)',
      },
      subLabel: {
        en: 'Mizaj (Temperament) equilibrium, Ilaj-bit-Tadbeer regimens & Hijama cupping',
        ta: 'மிசாஜ் உடலமைப்பு சமநிலை, இலாஜ்-பித்-தத்பீர் மற்றும் ஹிஜாமா சிகிச்சை',
        hi: 'मिज़ाज संतुलन, इलाज-बित-तदबीर एवं हिजामा कपिंग थेरेपी',
      },
      icon: Compass,
      color: 'from-amber-500 to-orange-600',
      badge: 'Mizaj & Natural Regimen',
    },
    {
      id: 'SIDDHA',
      title: {
        en: 'Siddha (சித்தா)',
        ta: 'சித்தா மருத்துவம் (Siddha)',
        hi: 'सिद्ध चिकित्सा (Siddha)',
      },
      subLabel: {
        en: 'Mukkuttram harmony, Envagai Thervu (8 diagnostic methods), Varmam & Kayakarpam',
        ta: 'முக்குற்றம் சமநிலை, எண்வகைத் தேர்வு, வர்ம சிகிச்சை மற்றும் காயகற்பம்',
        hi: 'मुक्कुट्रम संतुलन, एनवागई थेरवु, वर्मम एवं कायाकल्प उपचार',
      },
      icon: Sparkles,
      color: 'from-purple-600 to-indigo-600',
      badge: 'Mukkuttram & Varmam',
    },
    {
      id: 'YOGA_NATUROPATHY',
      title: {
        en: 'Yuva - Yoga & Naturopathy (யோகா)',
        ta: 'யுவா - யோகா & இயற்கை மருத்துவம் (Yuva)',
        hi: 'युवा - योग एवं प्राकृतिक चिकित्सा (Yuva)',
      },
      subLabel: {
        en: 'Panchamahabhuta elements, Prana breathing, hydrotherapy & lifestyle fasting',
        ta: 'பஞ்சபூத கூறுகள், பிராணாயாமம், நீர் சிகிச்சை மற்றும் இயற்கை வாழ்வியல் உணவு',
        hi: 'पंचमहाभूत तत्व, प्राणायाम, जल चिकित्सा एवं प्राकृतिक आहार',
      },
      icon: Activity,
      color: 'from-sky-500 to-blue-600',
      badge: 'Panchamahabhuta & Prana',
    },
    {
      id: 'HOMOEOPATHY',
      title: {
        en: 'Homoeopathy (ஹோமியோபதி)',
        ta: 'ஹோமியோபதி மருத்துவம் (Homoeopathy)',
        hi: 'होम्योपैथी चिकित्सा (Homoeopathy)',
      },
      subLabel: {
        en: 'Similia Similibus Curentur, individualized constitutional case-taking & vital force harmony',
        ta: 'ஒத்தவை ஒத்தவற்றை குணமாக்கும் தத்துவம், தனிநபர் மரபுவழிக் குறிப்புகள் மற்றும் உயிர் ஆற்றல் சமநிலை',
        hi: 'समरूपता सिद्धांत (सदृश चिकित्सा), व्यक्तिगत संविधानिक केस-टेकिंग एवं जीवन शक्ति संतुलन',
      },
      icon: Sparkles,
      color: 'from-teal-500 to-cyan-600',
      badge: 'Similia & Vital Force',
    },
    {
      id: 'ALLOPATHY_HOMEOPATHY',
      title: {
        en: 'Hollopathy - Allopathy & Modern OPD (அலோபதி)',
        ta: 'அலோபதி & நவீன மருத்துவ அறிவியல் (Modern OPD)',
        hi: 'एलोपैथी एवं आधुनिक चिकित्सा (Modern OPD)',
      },
      subLabel: {
        en: 'Modern clinical medicine, diagnostic investigations, intensive care & general OPD',
        ta: 'நவீன மருத்துவ அறிவியல், துல்லிய ஆய்வக சோதனைகள் மற்றும் தீவிர சிகிச்சை பிரிவு',
        hi: 'प्रमाण-आधारित आधुनिक नैदानिक जांच, विशेषज्ञ ओपीडी एवं संपूर्ण उपचार',
      },
      icon: Heart,
      color: 'from-rose-500 to-pink-600',
      badge: 'Modern Evidence-Based OPD',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-fade-in space-y-6">
      {/* Top Navigation Bar */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              {t.medicineSystems.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              {t.medicineSystems.subtitle}
            </p>
          </div>
        </div>

        <VoiceButton
          textToSpeak={`${t.medicineSystems.title}. ${t.medicineSystems.subtitle}. ${t.medicineSystems.selectSystemPrompt}`}
          showSpeak={false}
          size="md"
        />
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-900 flex items-center gap-2.5">
        <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
        <span>
          Choose your preferred healing methodology. Questions will adapt specifically to your selected system.
        </span>
      </div>

      {/* System Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {systems.map((item) => {
          const isSelected = selectedSystem === item.id;
          const Icon = item.icon;
          const title = item.title[language] || item.title.en;
          const sub = item.subLabel[language] || item.subLabel.en;

          return (
            <div
              key={item.id}
              onClick={() => onSelectSystem(item.id)}
              className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/70 shadow-md ring-2 ring-brand-100'
                  : 'bg-white border-slate-100 hover:border-brand-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 leading-snug">
                      {title}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-700">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium max-w-xl">
                    {sub}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <div onClick={(e) => e.stopPropagation()}>
                  <VoiceButton
                    textToSpeak={`${title}. ${sub}`}
                    showSpeak={false}
                    size="sm"
                  />
                </div>

                <button
                  type="button"
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-brand-200'
                      : 'bg-slate-100 group-hover:bg-brand-600 group-hover:text-white text-slate-700'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Selected</span>
                    </>
                  ) : (
                    <>
                      <span>Select</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
