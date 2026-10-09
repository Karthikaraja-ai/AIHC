import React, { useState } from 'react';
import { BodyMapSelection, BodyRegionId } from '../../types/ai';
import { useTranslation } from '../../i18n';
import { VoiceButton } from '../common/VoiceButton';
import { RotateCw, ZoomIn, ZoomOut, Trash2, Check, User, Baby } from 'lucide-react';

interface BodyMapProps {
  initialAgeGroup?: 'ADULT' | 'CHILD';
  initialSex?: 'MALE' | 'FEMALE';
  onSelectionChange: (selections: BodyMapSelection[]) => void;
  selectedSelections?: BodyMapSelection[];
}

interface RegionMeta {
  id: BodyRegionId;
  nameEn: string;
  nameTa: string;
  nameHi: string;
  side: 'FRONT' | 'BACK' | 'BOTH';
  pathD: string;
  centerPos: { x: number; y: number };
}

export const BodyMap: React.FC<BodyMapProps> = ({
  initialAgeGroup = 'ADULT',
  initialSex = 'FEMALE',
  onSelectionChange,
  selectedSelections = [],
}) => {
  const { language, t } = useTranslation();

  const [ageGroup, setAgeGroup] = useState<'ADULT' | 'CHILD'>(initialAgeGroup);
  const [sex, setSex] = useState<'MALE' | 'FEMALE'>(initialSex);
  const [viewSide, setViewSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedRegions, setSelectedRegions] = useState<BodyMapSelection[]>(selectedSelections);
  const [currentSeverity, setCurrentSeverity] = useState<number>(6);

  // Anatomical body region definitions
  const regions: RegionMeta[] = [
    // Head / Face
    {
      id: 'head',
      nameEn: 'Head & Brain',
      nameTa: 'தலை மற்றும் மூளை',
      nameHi: 'सिर और मस्तिष्क',
      side: 'BOTH',
      pathD: 'M 95 30 A 25 30 0 1 1 145 30 A 25 30 0 1 1 95 30 Z',
      centerPos: { x: 120, y: 35 },
    },
    // Throat & Neck
    {
      id: 'throat_neck',
      nameEn: 'Throat & Neck',
      nameTa: 'தொண்டை மற்றும் கழுத்து',
      nameHi: 'गला और गर्दन',
      side: 'BOTH',
      pathD: 'M 108 62 L 132 62 L 134 82 L 106 82 Z',
      centerPos: { x: 120, y: 72 },
    },
    // Chest (Front) / Upper Back (Back)
    {
      id: viewSide === 'FRONT' ? 'chest' : 'upper_back_spine',
      nameEn: viewSide === 'FRONT' ? 'Chest & Ribs' : 'Upper Back & Spine',
      nameTa: viewSide === 'FRONT' ? 'நெஞ்சு மற்றும் விலா எலும்பு' : 'மேல் முதுகு மற்றும் தண்டுவடம்',
      nameHi: viewSide === 'FRONT' ? 'सीना और पसलियां' : 'ऊपरी पीठ और रीढ़',
      side: 'BOTH',
      pathD: 'M 88 84 L 152 84 L 146 140 L 94 140 Z',
      centerPos: { x: 120, y: 110 },
    },
    // Upper Abdomen (Front) / Lower Back (Back)
    {
      id: viewSide === 'FRONT' ? 'upper_abdomen' : 'lower_back',
      nameEn: viewSide === 'FRONT' ? 'Upper Abdomen / Stomach' : 'Lower Back / Lumbar',
      nameTa: viewSide === 'FRONT' ? 'மேல் வயிறு / இரைப்பை' : 'இடுப்பு / கீழ் முதுகு',
      nameHi: viewSide === 'FRONT' ? 'ऊपरी पेट / आमाशय' : 'कमर / निचली पीठ',
      side: 'BOTH',
      pathD: 'M 94 142 L 146 142 L 142 182 L 98 182 Z',
      centerPos: { x: 120, y: 162 },
    },
    // Lower Abdomen & Pelvis (Front)
    {
      id: viewSide === 'FRONT' ? 'lower_abdomen' : 'pelvis_groin',
      nameEn: viewSide === 'FRONT' ? 'Lower Abdomen & Bladder' : 'Gluteal & Pelvis',
      nameTa: viewSide === 'FRONT' ? 'கீழ் வயிறு & சிறுநீர்ப்பை' : 'இடுப்பு பகுதி',
      nameHi: viewSide === 'FRONT' ? 'निचला पेट और मूत्राशय' : 'कूल्हा क्षेत्र',
      side: 'BOTH',
      pathD: 'M 98 184 L 142 184 L 148 225 L 92 225 Z',
      centerPos: { x: 120, y: 205 },
    },
    // Left Shoulder & Arm
    {
      id: 'left_shoulder_arm',
      nameEn: 'Left Arm & Shoulder',
      nameTa: 'இடது கை மற்றும் தோள்பட்டை',
      nameHi: 'बायां हाथ और कंधा',
      side: 'BOTH',
      pathD: 'M 60 90 L 86 86 L 76 215 L 52 210 Z',
      centerPos: { x: 70, y: 150 },
    },
    // Right Shoulder & Arm
    {
      id: 'right_shoulder_arm',
      nameEn: 'Right Arm & Shoulder',
      nameTa: 'வலது கை மற்றும் தோள்பட்டை',
      nameHi: 'दायां हाथ और कंधा',
      side: 'BOTH',
      pathD: 'M 154 86 L 180 90 L 188 210 L 164 215 Z',
      centerPos: { x: 170, y: 150 },
    },
    // Left Leg & Knee
    {
      id: 'left_leg_knee',
      nameEn: 'Left Leg & Knee',
      nameTa: 'இடது கால் மற்றும் முழங்கால்',
      nameHi: 'बायां पैर और घुटना',
      side: 'BOTH',
      pathD: 'M 94 228 L 118 228 L 114 360 L 88 360 Z',
      centerPos: { x: 104, y: 295 },
    },
    // Right Leg & Knee
    {
      id: 'right_leg_knee',
      nameEn: 'Right Leg & Knee',
      nameTa: 'வலது கால் மற்றும் முழங்கால்',
      nameHi: 'दायां पैर और घुटना',
      side: 'BOTH',
      pathD: 'M 122 228 L 146 228 L 152 360 L 126 360 Z',
      centerPos: { x: 136, y: 295 },
    },
    // Feet & Ankles
    {
      id: 'feet',
      nameEn: 'Ankles & Feet',
      nameTa: 'பாதம் மற்றும் கணுக்கால்',
      nameHi: 'पैर और टखने',
      side: 'BOTH',
      pathD: 'M 86 364 L 154 364 L 156 390 L 84 390 Z',
      centerPos: { x: 120, y: 377 },
    },
  ];

  const handleRegionClick = (region: RegionMeta) => {
    const isSelected = selectedRegions.some(r => r.regionId === region.id);
    let updated: BodyMapSelection[];

    const localizedName = language === 'ta' ? region.nameTa : language === 'hi' ? region.nameHi : region.nameEn;

    if (isSelected) {
      updated = selectedRegions.filter(r => r.regionId !== region.id);
    } else {
      updated = [
        ...selectedRegions,
        {
          regionId: region.id,
          regionName: localizedName,
          side: viewSide,
          painSeverity: currentSeverity,
        },
      ];
    }
    setSelectedRegions(updated);
    onSelectionChange(updated);
  };

  const handleClear = () => {
    setSelectedRegions([]);
    onSelectionChange([]);
  };

  const painFaces = [
    { score: 2, label: 'Mild', emoji: '😊', color: 'text-emerald-500' },
    { score: 4, label: 'Moderate', emoji: '😐', color: 'text-yellow-500' },
    { score: 6, label: 'Hurts More', emoji: '🙁', color: 'text-orange-500' },
    { score: 8, label: 'Severe', emoji: '😣', color: 'text-red-500' },
    { score: 10, label: 'Unbearable', emoji: '😭', color: 'text-red-700 font-bold' },
  ];

  return (
    <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-sm space-y-6">
      {/* Top Controls: Adult/Child, Male/Female, Voice Prompt */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {/* Adult / Child Selection */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setAgeGroup('ADULT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                ageGroup === 'ADULT' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.aiPreConsultation.adult}</span>
            </button>
            <button
              type="button"
              onClick={() => setAgeGroup('CHILD')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                ageGroup === 'CHILD' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Baby className="w-3.5 h-3.5" />
              <span>{t.aiPreConsultation.child}</span>
            </button>
          </div>

          {/* Male / Female Selection */}
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setSex('MALE')}
              className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                sex === 'MALE' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              {t.aiPreConsultation.male}
            </button>
            <button
              type="button"
              onClick={() => setSex('FEMALE')}
              className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                sex === 'FEMALE' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              {t.aiPreConsultation.female}
            </button>
          </div>
        </div>

        {/* Audio helper for low literacy */}
        <VoiceButton
          textToSpeak={t.aiPreConsultation.bodyMapInstruction}
          showSpeak={false}
          size="sm"
        />
      </div>

      {/* Main Interactive Anatomy Canvas & View Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Human Figure */}
        <div className="md:col-span-7 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-indigo-50/30 rounded-3xl border border-slate-100 relative min-h-[420px] overflow-hidden">
          {/* Zoom & View Controls Overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            <button
              type="button"
              onClick={() => setViewSide(viewSide === 'FRONT' ? 'BACK' : 'FRONT')}
              className="px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-slate-200 text-xs font-bold text-brand-700 flex items-center gap-1.5 hover:bg-slate-50 active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{viewSide === 'FRONT' ? t.aiPreConsultation.frontView : t.aiPreConsultation.backView}</span>
            </button>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
            <button
              type="button"
              onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.15))}
              className="p-2 bg-white/95 rounded-xl shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.15))}
              className="p-2 bg-white/95 rounded-xl shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Scalable SVG Model */}
          <div
            className="transition-transform duration-300"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <svg
              viewBox="0 0 240 410"
              className="w-56 md:w-64 h-auto filter drop-shadow-md select-none"
              role="img"
              aria-label="Interactive Human Anatomy Map"
            >
              {/* Outer silhouette outline */}
              <path
                d="M 120 10 C 105 10 90 25 90 45 C 90 60 100 70 105 75 L 85 85 L 55 100 L 45 220 L 70 225 L 82 155 L 85 230 L 75 365 L 75 395 L 115 395 L 115 245 L 125 245 L 125 395 L 165 395 L 165 365 L 155 230 L 158 155 L 170 225 L 195 220 L 185 100 L 155 85 L 135 75 C 140 70 150 60 150 45 C 150 25 135 10 120 10 Z"
                fill="#F1F5F9"
                stroke="#CBD5E1"
                strokeWidth="2"
              />

              {/* Clickable anatomical zones */}
              {regions.map((region) => {
                const isSelected = selectedRegions.some(r => r.regionId === region.id);
                return (
                  <g key={region.id} onClick={() => handleRegionClick(region)} className="cursor-pointer group">
                    <path
                      d={region.pathD}
                      fill={isSelected ? '#EF4444' : '#E0E7FF'}
                      fillOpacity={isSelected ? 0.75 : 0.4}
                      stroke={isSelected ? '#DC2626' : '#818CF8'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-all duration-200 group-hover:fill-brand-300 group-hover:fill-opacity-60"
                    />
                    {isSelected && (
                      <circle
                        cx={region.centerPos.x}
                        cy={region.centerPos.y}
                        r="9"
                        fill="#DC2626"
                        className="animate-ping"
                      />
                    )}
                    {isSelected && (
                      <circle
                        cx={region.centerPos.x}
                        cy={region.centerPos.y}
                        r="6"
                        fill="#FFFFFF"
                        stroke="#DC2626"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="text-xs font-semibold text-slate-500 mt-2">
            {t.aiPreConsultation.bodyMapInstruction}
          </p>
        </div>

        {/* Selected Zones & Pain Severity Scale */}
        <div className="md:col-span-5 space-y-5">
          {/* Selected Regions List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>{t.aiPreConsultation.selectedRegions}:</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs">
                  {selectedRegions.length}
                </span>
              </h4>
              {selectedRegions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.aiPreConsultation.clearSelection}</span>
                </button>
              )}
            </div>

            {selectedRegions.length === 0 ? (
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center text-xs text-slate-400">
                Tap on head, chest, abdomen, back or limbs to pinpoint pain.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedRegions.map((sel) => (
                  <span
                    key={sel.regionId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold animate-scale-in"
                  >
                    <span>{sel.regionName}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span className="text-[11px] font-bold text-red-800">Lvl {sel.painSeverity}/10</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pain Severity Rating (Wong-Baker visual scale) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                {t.aiPreConsultation.painSeverityTitle}
              </label>
              <span className="text-sm font-extrabold text-red-600 px-2 py-0.5 bg-red-50 rounded-lg border border-red-200">
                {currentSeverity} / 10
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="1"
              max="10"
              value={currentSeverity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setCurrentSeverity(val);
                // Update severity on existing selected regions
                const updated = selectedRegions.map(r => ({ ...r, painSeverity: val }));
                setSelectedRegions(updated);
                onSelectionChange(updated);
              }}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />

            {/* Wong-Baker Faces */}
            <div className="grid grid-cols-5 gap-1 pt-1 text-center">
              {painFaces.map((f) => (
                <button
                  key={f.score}
                  type="button"
                  onClick={() => {
                    setCurrentSeverity(f.score);
                    const updated = selectedRegions.map(r => ({ ...r, painSeverity: f.score }));
                    setSelectedRegions(updated);
                    onSelectionChange(updated);
                  }}
                  className={`p-1.5 rounded-xl border transition-all flex flex-col items-center ${
                    currentSeverity >= f.score - 1 && currentSeverity <= f.score
                      ? 'border-brand-600 bg-white shadow-sm ring-2 ring-brand-200'
                      : 'border-transparent hover:bg-white/60'
                  }`}
                >
                  <span className="text-2xl">{f.emoji}</span>
                  <span className="text-[10px] font-bold text-slate-700 mt-1">{f.score}</span>
                  <span className="text-[9px] text-slate-500 leading-tight">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
