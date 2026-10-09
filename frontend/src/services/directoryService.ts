import { Hospital, DoctorDirectoryEntry, MedicineSystem } from '../types';

export const HOSPITALS: Hospital[] = [
  // AYURVEDA HOSPITALS
  {
    id: 'HOSP-AYU-1',
    name: {
      en: 'AIHC All India Ayurvedic Research Institute & Hospital',
      ta: 'AIHC அகில இந்திய ஆயுர்வேத ஆராய்ச்சி நிறுவனம் & மருத்துவமனை',
      hi: 'AIHC अखिल भारतीय आयुर्वेद अनुसंधान संस्थान एवं अस्पताल',
    },
    category: 'AYURVEDA',
    location: {
      en: 'Central AYUSH Complex, Sector 4, Chennai',
      ta: 'மத்திய ஆயுஷ் வளாகம், பகுதி 4, சென்னை',
      hi: 'केंद्रीय आयुष परिसर, सेक्टर 4, चेन्नई',
    },
    distanceKm: '2.4 km',
    opdWing: {
      en: 'Panchakarma & Kayachikitsa OPD Wing',
      ta: 'பஞ்சகர்மா மற்றும் காயசிகிச்சை வெளிநோயாளி பிரிவு',
      hi: 'पंचकर्म एवं कायचिकित्सा ओपीडी विंग',
    },
    facilities: {
      en: ['Panchakarma Theatres', 'Herbal Pharmacy', 'Nadi Pariksha Lab', 'Inpatient Ward'],
      ta: ['பஞ்சகர்மா சிகிச்சை அரங்கம்', 'மூலிகை மருந்தகம்', 'நாடி பரிசோதனை கூடம்', 'உள்நோயாளி பிரிவு'],
      hi: ['पंचकर्म थिएटर', 'हर्बल फार्मेसी', 'नाड़ी परीक्षा लैब', 'इनपेशेंट वार्ड'],
    },
    rating: 4.9,
  },
  {
    id: 'HOSP-AYU-2',
    name: {
      en: 'Government Ayurvedic Medical College & Hospital',
      ta: 'அரசு ஆயுர்வேத மருத்துவக் கல்லூரி மற்றும் மருத்துவமனை',
      hi: 'राजकीय आयुर्वेद मेडिकल कॉलेज एवं अस्पताल',
    },
    category: 'AYURVEDA',
    location: {
      en: 'Arignar Anna Hospital Campus, Arumbakkam',
      ta: 'அறிஞர் அண்ணா மருத்துவமனை வளாகம், அரும்பாக்கம்',
      hi: 'अरिग्नार अन्ना अस्पताल परिसर, अरुंबक्कम',
    },
    distanceKm: '4.8 km',
    opdWing: {
      en: 'Shalya & Shalakya Specialty Clinic',
      ta: 'சல்ய & சாலாக்கிய சிறப்பு சிகிச்சை பிரிவு',
      hi: 'शल्य एवं शालाक्य विशेष क्लिनिक',
    },
    facilities: {
      en: ['Classical Pharmacy', 'Yoga Therapy Hall', 'Diet Counseling'],
      ta: ['பாரம்பரிய மருந்தகம்', 'யோகா அரங்கம்', 'உணவு ஆலோசனை'],
      hi: ['पारंपरिक फार्मेसी', 'योग थेरेपी हॉल', 'आहार परामर्श'],
    },
    rating: 4.7,
  },

  // SIDDHA HOSPITALS
  {
    id: 'HOSP-SID-1',
    name: {
      en: 'National Institute of Siddha (NIS) Hospital',
      ta: 'தேசிய சித்த மருத்துவ நிறுவனம் (NIS) மருத்துவமனை',
      hi: 'राष्ट्रीय सिद्ध संस्थान (NIS) अस्पताल',
    },
    category: 'SIDDHA',
    location: {
      en: 'Grand Southern Trunk Rd, Tambaram Sanatorium',
      ta: 'ஜிஎஸ்டி சாலை, தாம்பரம் சானடோரியம்',
      hi: 'जीएसटी रोड, ताम्बरम सेनेटोरियम',
    },
    distanceKm: '3.1 km',
    opdWing: {
      en: 'Maruthuvam & Varmam Therapy Block',
      ta: 'மருத்துவம் மற்றும் வர்ம சிகிச்சை பிரிவு',
      hi: 'मारुथुवम एवं वर्मम थेरेपी ब्लॉक',
    },
    facilities: {
      en: ['Varmam Therapy Unit', 'Thokkanam Massage', 'Kayakarpam Clinic', 'Herbal Garden'],
      ta: ['வர்ம சிகிச்சை பிரிவு', 'தொக்கண சிகிச்சை', 'காயகற்ப மையம்', 'மூலிகைத் தோட்டம்'],
      hi: ['वर्मम थेरेपी यूनिट', 'थोकनम मालिश', 'कायाकल्प क्लिनिक', 'हर्बल गार्डन'],
    },
    rating: 4.9,
  },
  {
    id: 'HOSP-SID-2',
    name: {
      en: 'Government Siddha Care & Varmam Research Center',
      ta: 'அரசு சித்த பராமரிப்பு & வர்ம ஆராய்ச்சி மையம்',
      hi: 'सरकारी सिद्ध केयर एवं वर्मम रिसर्च सेंटर',
    },
    category: 'SIDDHA',
    location: {
      en: 'Anna Nagar West Extension, Chennai',
      ta: 'அண்ணா நகர் மேற்கு விரிவாக்கம், சென்னை',
      hi: 'अन्ना नगर वेस्ट एक्सटेंशन, चेन्नई',
    },
    distanceKm: '5.6 km',
    opdWing: {
      en: 'Envagai Thervu Diagnostic OPD',
      ta: 'எண்வகைத் தேர்வு நோய் நாடல் பிரிவு',
      hi: 'एनवागई थेरवु नैदानिक ओपीडी',
    },
    facilities: {
      en: ['Gunapadam Pharmacy', 'Bone & Joint Special OPD', 'Chronic Skin Care'],
      ta: ['குணபாடம் மருந்தகம்', 'மூட்டு எலும்பு சிறப்பு பிரிவு', 'தோல் நோய் சிகிச்சை'],
      hi: ['गुणापदम फार्मेसी', 'अस्थि एवं जोड़ विशेष ओपीडी', 'त्वचा रोग चिकित्सा'],
    },
    rating: 4.8,
  },

  // UNANI HOSPITALS
  {
    id: 'HOSP-UNA-1',
    name: {
      en: 'Government Unani Medical College & General Hospital',
      ta: 'அரசு யுனானி மருத்துவக் கல்லூரி மற்றும் பொது மருத்துவமனை',
      hi: 'राजकीय यूनानी मेडिकल कॉलेज एवं सामान्य अस्पताल',
    },
    category: 'UNANI',
    location: {
      en: 'Poonamallee High Road, Kilpauk',
      ta: 'பூந்தமல்லி நெடுஞ்சாலை, கீழ்ப்பாக்கம்',
      hi: 'पूनमल्ली हाई रोड, किलपॉक',
    },
    distanceKm: '3.9 km',
    opdWing: {
      en: 'Ilaj-bit-Tadbeer (Regimenal Therapy) OPD',
      ta: 'இலாஜ்-பித்-தத்பீர் முறைப்படுத்தப்பட்ட சிகிச்சை பிரிவு',
      hi: 'इलाज-बित-तदबीर (रेजिमेनल थेरेपी) ओपीडी',
    },
    facilities: {
      en: ['Cupping (Hijama) Unit', 'Hammam / Steam Bath', 'Moalajat Clinic', 'Unani Dispensary'],
      ta: ['ஹிஜாமா சிகிச்சை கூடம்', 'நீராவி குளியல் பிரிவு', 'மொஆலஜத் பிரிவு', 'யுனானி மருந்தகம்'],
      hi: ['हिजामा (कपिंग) यूनिट', 'हम्माम / स्टीम बाथ', 'मोआलजात क्लिनिक', 'यूनानी औषधालय'],
    },
    rating: 4.8,
  },
  {
    id: 'HOSP-UNA-2',
    name: {
      en: 'AIHC Regional Unani Healthcare & Research Center',
      ta: 'AIHC மண்டல யுனானி சுகாதார மற்றும் ஆராய்ச்சி மையம்',
      hi: 'AIHC क्षेत्रीय यूनानी स्वास्थ्य सेवा एवं अनुसंधान केंद्र',
    },
    category: 'UNANI',
    location: {
      en: 'Royapettah High Road, Central Chennai',
      ta: 'ராயப்பேட்டை நெடுஞ்சாலை, மத்திய சென்னை',
      hi: 'रायपेटा हाई रोड, सेंट्रल चेन्नई',
    },
    distanceKm: '6.2 km',
    opdWing: {
      en: 'Mizaj Temperament Assessment OPD',
      ta: 'மிசாஜ் உடலமைப்பு மற்றும் நாடிப் பரிசோதனை பிரிவு',
      hi: 'मिजाज मूल्यांकन एवं परामर्श ओपीडी',
    },
    facilities: {
      en: ['Herbal Compound Dispensary', 'Lifestyle & Nutrition Lab'],
      ta: ['மூலிகை கூட்டு மருந்தகம்', 'வாழ்க்கை முறை & ஊட்டச்சத்து மையம்'],
      hi: ['हर्बल कंपाउंड औषधालय', 'जीवनशैली एवं पोषण केंद्र'],
    },
    rating: 4.6,
  },

  // YOGA & NATUROPATHY (YUVA) HOSPITALS
  {
    id: 'HOSP-YUV-1',
    name: {
      en: 'Government Yoga & Naturopathy Medical College & Hospital',
      ta: 'அரசு யோகா மற்றும் இயற்கை மருத்துவக் கல்லூரி மருத்துவமனை',
      hi: 'राजकीय योग एवं प्राकृतिक चिकित्सा मेडिकल कॉलेज एवं अस्पताल',
    },
    category: 'YOGA_NATUROPATHY',
    location: {
      en: 'Near Arignar Anna Arch, Arumbakkam',
      ta: 'அறிஞர் அண்ணா வளைவு அருகில், அரும்பாக்கம்',
      hi: 'अरिग्नार अन्ना आर्क के पास, अरुंबक्कम',
    },
    distanceKm: '4.5 km',
    opdWing: {
      en: 'Hydrotherapy & Mud Therapy Wellness Wing',
      ta: 'நீர்மருத்துவம் மற்றும் மண் சிகிச்சை பிரிவு',
      hi: 'जल चिकित्सा एवं मृत्तिका चिकित्सा विंग',
    },
    facilities: {
      en: ['Therapeutic Yoga Hall', 'Hydrotherapy Pools', 'Acupuncture Unit', 'Raw Food Diet Center'],
      ta: ['சிகிச்சை யோகா கூடம்', 'நீர் சிகிச்சை தொட்டிகள்', 'அக்குபஞ்சர் பிரிவு', 'இயற்கை உணவு மையம்'],
      hi: ['उपचारात्मक योग हॉल', 'जल चिकित्सा पूल', 'एक्यूपंक्चर यूनिट', 'प्राकृतिक आहार केंद्र'],
    },
    rating: 4.9,
  },
  {
    id: 'HOSP-YUV-2',
    name: {
      en: 'AIHC Yuva Lifestyle Medicine & Naturopathy Pavilion',
      ta: 'AIHC யுவா வாழ்க்கை முறை மருத்துவம் & இயற்கை நல மையம்',
      hi: 'AIHC युवा जीवनशैली चिकित्सा एवं प्राकृतिक चिकित्सा केंद्र',
    },
    category: 'YOGA_NATUROPATHY',
    location: {
      en: 'Besant Nagar Beach Road, Chennai',
      ta: 'பெசன்ட் நகர் கடற்கரை சாலை, சென்னை',
      hi: 'बेसेंट नगर बीच रोड, चेन्नई',
    },
    distanceKm: '7.0 km',
    opdWing: {
      en: 'Pranayama, Fasting & Metabolic Reversal Wing',
      ta: 'பிராணாயாமம், உண்ணாநோன்பு மற்றும் வளர்சிதை மாற்ற பிரிவு',
      hi: 'प्राणायाम, उपवास एवं मेटाबोलिक रिवर्सल विंग',
    },
    facilities: {
      en: ['Sun Therapy Deck', 'Meditation Sanctuary', 'Herbal Detox Bar'],
      ta: ['சூரிய ஒளி சிகிச்சை தளம்', 'தியான அரங்கம்', 'மூலிகை நச்சுநீக்க மையம்'],
      hi: ['सूर्य स्नान डेक', 'ध्यान कक्ष', 'हर्बल डिटॉक्स बार'],
    },
    rating: 4.7,
  },

  // ALLOPATHY & HOMEOPATHY (HOLLOPATHY) HOSPITALS
  {
    id: 'HOSP-ALL-1',
    name: {
      en: 'AIHC Government General Multi-Speciality Hospital',
      ta: 'AIHC அரசு பொது பல்நோக்கு உயர் சிறப்பு மருத்துவமனை',
      hi: 'AIHC सरकारी सामान्य मल्टी-स्पेशियलिटी अस्पताल',
    },
    category: 'ALLOPATHY_HOMEOPATHY',
    location: {
      en: 'EVR Periyar Salai, Park Town',
      ta: 'ஈவெரா பெரியார் சாலை, பார்க் டவுன்',
      hi: 'ईवीआर पेरियार सलाई, पार्क टाउन',
    },
    distanceKm: '1.8 km',
    opdWing: {
      en: 'Tower 2 - General Medicine & Specialized OPD',
      ta: 'கோபுரம் 2 - பொது மருத்துவம் மற்றும் சிறப்பு பிரிவு',
      hi: 'टावर 2 - सामान्य चिकित्सा एवं विशेष ओपीडी',
    },
    facilities: {
      en: ['24x7 Trauma Care', 'ICU & Cath Lab', 'Advanced Imaging / CT-MRI', 'Central Automated Lab'],
      ta: ['24 மணிநேர அவசர சிகிச்சை', 'தீவிர சிகிச்சைப் பிரிவு', 'சிடி / எம்ஆர்ஐ ஸ்கேன்', 'மைய தானியங்கி ஆய்வகம்'],
      hi: ['24x7 ट्रॉमा केयर', 'आईसीयू एवं कैथ लैब', 'सीटी / एमआरआई स्कैन', 'केंद्रीय स्वचालित लैब'],
    },
    rating: 4.9,
  },
  {
    id: 'HOSP-ALL-2',
    name: {
      en: 'AIHC City Health Medical Complex & Homeopathy Wing',
      ta: 'AIHC நகர்ப்புற மருத்துவ வளாகம் & ஹோமியோபதி பிரிவு',
      hi: 'AIHC सिटी हेल्थ मेडिकल कॉम्प्लेक्स एवं होम्योपैथी विंग',
    },
    category: 'ALLOPATHY_HOMEOPATHY',
    location: {
      en: 'Anna Salai, Thousand Lights',
      ta: 'அண்ணா சாலை, ஆயிரம் விளக்கு',
      hi: 'अन्ना सलाई, थाउजेंड लाइट्स',
    },
    distanceKm: '3.5 km',
    opdWing: {
      en: 'Block C - Internal Medicine & Integrated OPD',
      ta: 'பிளாக் சி - உள் மருத்துவம் மற்றும் ஒருங்கிணைந்த பிரிவு',
      hi: 'ब्लॉक सी - आंतरिक चिकित्सा एवं एकीकृत ओपीडी',
    },
    facilities: {
      en: ['Cardiology Clinic', 'Gastroenterology Suite', 'Homeopathy Dispensary', 'Daycare Surgery'],
      ta: ['இதய சிகிச்சை மையம்', 'இரைப்பை குடல் மையம்', 'ஹோமியோபதி மருந்தகம்', 'பகல்நேர அறுவை சிகிச்சை'],
      hi: ['कार्डियोलॉजी क्लिनिक', 'गैस्ट्रोएंटरोलॉजी सुइट', 'होम्योपैथी औषधालय', 'डेकेयर सर्जरी'],
    },
    rating: 4.8,
  },
];

export const DOCTORS: DoctorDirectoryEntry[] = [
  // AYURVEDA DOCTORS
  {
    id: 'DOC-AYU-1',
    name: {
      en: 'Dr. B. Ramanathan',
      ta: 'மருத்துவர் பி. ராமநாதன்',
      hi: 'डॉ. बी. रामनाथन',
    },
    qualification: 'BAMS, MD (Ayurveda)',
    medicineSystem: 'AYURVEDA',
    department: {
      en: 'Kayachikitsa (Internal Medicine & Tridosha)',
      ta: 'காயசிகிச்சை (உள் மருத்துவம் & திரிதோஷம்)',
      hi: 'कायचिकित्सा (आंतरिक चिकित्सा एवं त्रिदोष)',
    },
    hospitalId: 'HOSP-AYU-1',
    roomNumber: 'OPD Room 104, Ground Floor',
    experience: {
      en: '18 Years Clinical Experience',
      ta: '18 ஆண்டுகள் மருத்துவ அனுபவம்',
      hi: '18 वर्ष का नैदानिक अनुभव',
    },
    timings: '09:00 AM - 01:30 PM',
    status: 'AVAILABLE',
    currentToken: 14,
    estimatedWaitMins: 10,
    languages: ['Tamil', 'English', 'Hindi'],
  },
  {
    id: 'DOC-AYU-2',
    name: {
      en: 'Dr. Archana Swaminathan',
      ta: 'மருத்துவர் அர்ச்சனா சுவாமிநாதன்',
      hi: 'डॉ. अर्चना स्वामीनाथन',
    },
    qualification: 'BAMS, Fellowship in Panchakarma',
    medicineSystem: 'AYURVEDA',
    department: {
      en: 'Panchakarma & Detoxification Therapy',
      ta: 'பஞ்சகர்மா மற்றும் நச்சுநீக்க சிகிச்சை',
      hi: 'पंचकर्म एवं विषहरण चिकित्सा',
    },
    hospitalId: 'HOSP-AYU-1',
    roomNumber: 'OPD Room 106, Ground Floor',
    experience: {
      en: '12 Years Clinical Experience',
      ta: '12 ஆண்டுகள் மருத்துவ அனுபவம்',
      hi: '12 वर्ष का नैदानिक अनुभव',
    },
    timings: '10:00 AM - 03:00 PM',
    status: 'NEXT_TOKEN',
    currentToken: 8,
    estimatedWaitMins: 15,
    languages: ['Tamil', 'English'],
  },
  {
    id: 'DOC-AYU-3',
    name: {
      en: 'Dr. M. K. Rajesh Vaidya',
      ta: 'மருத்துவர் எம். கே. ராஜேஷ் வைத்யா',
      hi: 'डॉ. एम. के. राजेश वैद्य',
    },
    qualification: 'BAMS, MD (Ayu - Shalya Tantra)',
    medicineSystem: 'AYURVEDA',
    department: {
      en: 'Asthi & Sandhi (Joints & Spine Care)',
      ta: 'அஸ்தி & சந்தி (மூட்டு மற்றும் முதுகு தண்டு பராமரிப்பு)',
      hi: 'अस्थि एवं संधि (जोड़ों एवं रीढ़ की हड्डी)',
    },
    hospitalId: 'HOSP-AYU-2',
    roomNumber: 'OPD Room 202, 1st Floor',
    experience: {
      en: '15 Years Experience',
      ta: '15 ஆண்டுகள் அனுபவம்',
      hi: '15 वर्ष का अनुभव',
    },
    timings: '08:30 AM - 01:00 PM',
    status: 'AVAILABLE',
    currentToken: 19,
    estimatedWaitMins: 5,
    languages: ['Tamil', 'English', 'Hindi'],
  },

  // SIDDHA DOCTORS
  {
    id: 'DOC-SID-1',
    name: {
      en: 'Dr. S. K. Murugesan',
      ta: 'மருத்துவர் எஸ். கே. முருகேசன்',
      hi: 'डॉ. एस. के. मुरुगेसन',
    },
    qualification: 'BSMS, MD (Siddha - Maruthuvam)',
    medicineSystem: 'SIDDHA',
    department: {
      en: 'Gunapadam & Mukkuttram Specialty',
      ta: 'குணபாடம் & முக்குற்றம் சிறப்பு மருத்துவம்',
      hi: 'गुणापदम एवं मुक्कुट्रम विशेषता',
    },
    hospitalId: 'HOSP-SID-1',
    roomNumber: 'OPD Room 101, Main Block',
    experience: {
      en: '21 Years Senior Siddha Specialist',
      ta: '21 ஆண்டுகள் முதுநிலை சித்த மருத்துவர்',
      hi: '21 वर्ष वरिष्ठ सिद्ध विशेषज्ञ',
    },
    timings: '08:30 AM - 01:00 PM',
    status: 'AVAILABLE',
    currentToken: 22,
    estimatedWaitMins: 8,
    languages: ['Tamil', 'English'],
  },
  {
    id: 'DOC-SID-2',
    name: {
      en: 'Dr. Thamarai Selvi',
      ta: 'மருத்துவர் தாமரைச் செல்வி',
      hi: 'डॉ. थामराई सेल्वी',
    },
    qualification: 'BSMS, Diploma in Varmam Therapy',
    medicineSystem: 'SIDDHA',
    department: {
      en: 'Sirappu Maruthuvam & Varmam Care',
      ta: 'சிறப்பு மருத்துவம் & வர்ம சிகிச்சை பிரிவு',
      hi: 'सिरप्पु मारुथुवम एवं वर्मम केयर',
    },
    hospitalId: 'HOSP-SID-1',
    roomNumber: 'OPD Room 108, Ground Floor',
    experience: {
      en: '14 Years Experience',
      ta: '14 ஆண்டுகள் அனுபவம்',
      hi: '14 वर्ष का अनुभव',
    },
    timings: '09:30 AM - 02:00 PM',
    status: 'IN_CONSULTATION',
    currentToken: 16,
    estimatedWaitMins: 20,
    languages: ['Tamil', 'English'],
  },
  {
    id: 'DOC-SID-3',
    name: {
      en: 'Dr. R. Ilangovan',
      ta: 'மருத்துவர் ஆர். இளங்கோவன்',
      hi: 'डॉ. आर. इलांगोवन',
    },
    qualification: 'BSMS, MD (Siddha)',
    medicineSystem: 'SIDDHA',
    department: {
      en: 'Siddha General Medicine & Envagai Thervu',
      ta: 'சித்த பொது மருத்துவம் & எண்வகைத் தேர்வு',
      hi: 'सिद्ध सामान्य चिकित्सा एवं एनवागई थेरवु',
    },
    hospitalId: 'HOSP-SID-2',
    roomNumber: 'OPD Room 205, 1st Floor',
    experience: {
      en: '10 Years Experience',
      ta: '10 ஆண்டுகள் அனுபவம்',
      hi: '10 वर्ष का अनुभव',
    },
    timings: '09:00 AM - 02:30 PM',
    status: 'AVAILABLE',
    currentToken: 11,
    estimatedWaitMins: 12,
    languages: ['Tamil', 'English', 'Hindi'],
  },

  // UNANI DOCTORS
  {
    id: 'DOC-UNA-1',
    name: {
      en: 'Dr. Hakim Mohammad Aslam',
      ta: 'ஹக்கீம் முகமது அஸ்லம்',
      hi: 'डॉ. हकीम मोहम्मद असलम',
    },
    qualification: 'BUMS, MD (Unani - Moalajat)',
    medicineSystem: 'UNANI',
    department: {
      en: 'Moalajat (General Internal Medicine) & Mizaj',
      ta: 'மொஆலஜத் (உள் மருத்துவம்) & மிசாஜ் பகுப்பாய்வு',
      hi: 'मोआलजात (आंतरिक चिकित्सा) एवं मिजाज',
    },
    hospitalId: 'HOSP-UNA-1',
    roomNumber: 'OPD Room 103, Ground Floor',
    experience: {
      en: '19 Years Experience',
      ta: '19 ஆண்டுகள் அனுபவம்',
      hi: '19 वर्ष का अनुभव',
    },
    timings: '09:00 AM - 01:00 PM',
    status: 'AVAILABLE',
    currentToken: 15,
    estimatedWaitMins: 10,
    languages: ['Urdu', 'Tamil', 'English', 'Hindi'],
  },
  {
    id: 'DOC-UNA-2',
    name: {
      en: 'Dr. Yasmeen Fathima',
      ta: 'மருத்துவர் யாஸ்மின் பாத்திமா',
      hi: 'डॉ. यासमीन फातिमा',
    },
    qualification: 'BUMS, Specialist in Ilaj-bit-Tadbeer',
    medicineSystem: 'UNANI',
    department: {
      en: 'Ilaj-bit-Tadbeer & Hijama (Cupping Therapy)',
      ta: 'இலாஜ்-பித்-தத்பீர் & ஹிஜாமா சிகிச்சை',
      hi: 'इलाज-बित-तदबीर एवं हिजामा थेरेपी',
    },
    hospitalId: 'HOSP-UNA-1',
    roomNumber: 'OPD Room 112, Therapy Wing',
    experience: {
      en: '11 Years Experience',
      ta: '11 ஆண்டுகள் அனுபவம்',
      hi: '11 वर्ष का अनुभव',
    },
    timings: '10:00 AM - 02:30 PM',
    status: 'NEXT_TOKEN',
    currentToken: 9,
    estimatedWaitMins: 15,
    languages: ['Tamil', 'English', 'Hindi'],
  },

  // YOGA & NATUROPATHY (YUVA) DOCTORS
  {
    id: 'DOC-YUV-1',
    name: {
      en: 'Dr. K. Soundararajan',
      ta: 'மருத்துவர் கே. சௌந்தரராஜன்',
      hi: 'डॉ. के. सौंदरराजन',
    },
    qualification: 'BNYS, MD (Naturopathy & Yoga)',
    medicineSystem: 'YOGA_NATUROPATHY',
    department: {
      en: 'Panchamahabhuta & Lifestyle Reversal',
      ta: 'பஞ்சபூத சமநிலை & வாழ்க்கை முறை மேலாண்மை',
      hi: 'पंचमहाभूत एवं जीवनशैली सुधार',
    },
    hospitalId: 'HOSP-YUV-1',
    roomNumber: 'OPD Room 102, Wellness Wing',
    experience: {
      en: '16 Years Clinical Practice',
      ta: '16 ஆண்டுகள் மருத்துவ அனுபவம்',
      hi: '16 वर्ष का नैदानिक अनुभव',
    },
    timings: '08:00 AM - 12:30 PM',
    status: 'AVAILABLE',
    currentToken: 12,
    estimatedWaitMins: 5,
    languages: ['Tamil', 'English', 'Hindi'],
  },
  {
    id: 'DOC-YUV-2',
    name: {
      en: 'Dr. Meera Nambiar',
      ta: 'மருத்துவர் மீரா நம்பியார்',
      hi: 'डॉ. मीरा नंबियार',
    },
    qualification: 'BNYS, Dip in Clinical Acupuncture',
    medicineSystem: 'YOGA_NATUROPATHY',
    department: {
      en: 'Hydrotherapy & Therapeutic Fasting',
      ta: 'நீர் சிகிச்சை & இயற்கை உணவு ஆலோசனை',
      hi: 'जल चिकित्सा एवं उपचारात्मक उपवास',
    },
    hospitalId: 'HOSP-YUV-1',
    roomNumber: 'OPD Room 107, Ground Floor',
    experience: {
      en: '13 Years Experience',
      ta: '13 ஆண்டுகள் அனுபவம்',
      hi: '13 वर्ष का अनुभव',
    },
    timings: '09:00 AM - 01:30 PM',
    status: 'AVAILABLE',
    currentToken: 7,
    estimatedWaitMins: 8,
    languages: ['Tamil', 'English', 'Hindi'],
  },

  // ALLOPATHY & HOMEOPATHY (HOLLOPATHY) DOCTORS
  {
    id: 'DOC-ALL-1',
    name: {
      en: 'Dr. A. Sundaram',
      ta: 'மருத்துவர் ஏ. சுந்தரம்',
      hi: 'डॉ. ए. सुंदरम',
    },
    qualification: 'MBBS, MD (General Medicine)',
    medicineSystem: 'ALLOPATHY_HOMEOPATHY',
    department: {
      en: 'General Medicine & Acute OPD',
      ta: 'பொது மருத்துவம் மற்றும் தீவிர வெளிநோயாளி பிரிவு',
      hi: 'सामान्य चिकित्सा एवं ओपीडी',
    },
    hospitalId: 'HOSP-ALL-1',
    roomNumber: 'OPD Room 114, Block A',
    experience: {
      en: '22 Years Senior Physician',
      ta: '22 ஆண்டுகள் மூத்த மருத்துவர்',
      hi: '22 वर्ष वरिष्ठ चिकित्सक',
    },
    timings: '08:30 AM - 02:00 PM',
    status: 'AVAILABLE',
    currentToken: 28,
    estimatedWaitMins: 10,
    languages: ['Tamil', 'English', 'Hindi'],
  },
  {
    id: 'DOC-ALL-2',
    name: {
      en: 'Dr. Priya Natarajan',
      ta: 'மருத்துவர் பிரியா நடராஜன்',
      hi: 'डॉ. प्रिया नटराजन',
    },
    qualification: 'MBBS, MD, DM (Cardiology)',
    medicineSystem: 'ALLOPATHY_HOMEOPATHY',
    department: {
      en: 'Cardiology & Heart Care',
      ta: 'இதய சிகிச்சை மற்றும் தீவிர இதய பராமரிப்பு',
      hi: 'कार्डियोलॉजी एवं हृदय रोग विशेषज्ञ',
    },
    hospitalId: 'HOSP-ALL-1',
    roomNumber: 'OPD Room 210, 2nd Floor',
    experience: {
      en: '15 Years Cardiologist',
      ta: '15 ஆண்டுகள் இதய நிபுணர்',
      hi: '15 वर्ष हृदय रोग विशेषज्ञ',
    },
    timings: '09:30 AM - 01:30 PM',
    status: 'NEXT_TOKEN',
    currentToken: 18,
    estimatedWaitMins: 15,
    languages: ['Tamil', 'English', 'Hindi'],
  },
  {
    id: 'DOC-ALL-3',
    name: {
      en: 'Dr. K. Vignesh',
      ta: 'மருத்துவர் கே. விக்னேஷ்',
      hi: 'डॉ. के. विग्नेश',
    },
    qualification: 'MBBS, MD (Gastroenterology)',
    medicineSystem: 'ALLOPATHY_HOMEOPATHY',
    department: {
      en: 'Gastroenterology (Digestive & Liver)',
      ta: 'இரைப்பை குடல் & கல்லீரல் சிறப்பு பிரிவு',
      hi: 'गैस्ट्रोएंटरोलॉजी (पाचन एवं यकृत)',
    },
    hospitalId: 'HOSP-ALL-2',
    roomNumber: 'OPD Room 105, Ground Floor',
    experience: {
      en: '11 Years Experience',
      ta: '11 ஆண்டுகள் அனுபவம்',
      hi: '11 वर्ष का अनुभव',
    },
    timings: '09:00 AM - 02:00 PM',
    status: 'AVAILABLE',
    currentToken: 14,
    estimatedWaitMins: 10,
    languages: ['Tamil', 'English'],
  },
  {
    id: 'DOC-ALL-4',
    name: {
      en: 'Dr. S. Shanthi',
      ta: 'மருத்துவர் எஸ். சாந்தி',
      hi: 'डॉ. எஸ். शांति',
    },
    qualification: 'MBBS, MS (Orthopaedics)',
    medicineSystem: 'ALLOPATHY_HOMEOPATHY',
    department: {
      en: 'Orthopaedics & Joint Replacement',
      ta: 'எலும்பு மற்றும் மூட்டு மாற்று அறுவை சிகிச்சை பிரிவு',
      hi: 'हड्डी एवं जोड़ प्रत्यारोपण विशेषज्ञ',
    },
    hospitalId: 'HOSP-ALL-1',
    roomNumber: 'OPD Room 118, Ground Floor',
    experience: {
      en: '17 Years Experience',
      ta: '17 ஆண்டுகள் அனுபவம்',
      hi: '17 वर्ष का अनुभव',
    },
    timings: '10:00 AM - 03:00 PM',
    status: 'AVAILABLE',
    currentToken: 21,
    estimatedWaitMins: 12,
    languages: ['Tamil', 'English', 'Hindi'],
  },
];

class DirectoryService {
  public getHospitalsBySystem(system: MedicineSystem): Hospital[] {
    return HOSPITALS.filter(h => h.category === system);
  }

  public getDoctorsBySystem(system: MedicineSystem, hospitalId?: string): DoctorDirectoryEntry[] {
    return DOCTORS.filter(d => {
      const systemMatch = d.medicineSystem === system;
      if (hospitalId) {
        return systemMatch && d.hospitalId === hospitalId;
      }
      return systemMatch;
    });
  }

  public getHospitalById(id: string): Hospital | undefined {
    return HOSPITALS.find(h => h.id === id);
  }

  public getDoctorById(id: string): DoctorDirectoryEntry | undefined {
    return DOCTORS.find(d => d.id === id);
  }

  public getAllDoctors(): DoctorDirectoryEntry[] {
    return DOCTORS;
  }
}

export const directoryService = new DirectoryService();
