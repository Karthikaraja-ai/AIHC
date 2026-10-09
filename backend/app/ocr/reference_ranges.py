from typing import List, Dict, Any

CLINICAL_KEYWORDS = [
    # Hematology / CBC
    'hemoglobin', 'hb', 'wbc', 'leukocyte', 'rbc', 'erythrocyte', 'platelet', 'platelets',
    'pcv', 'hematocrit', 'mcv', 'mch', 'mchc', 'esr', 'blood count', 'cbc', 'hemogram',
    'neutrophil', 'neutrophils', 'lymphocyte', 'lymphocytes', 'eosinophil', 'eosinophils',
    'monocyte', 'monocytes', 'basophil', 'basophils',
    # Diabetic / Biochemistry
    'glucose', 'sugar', 'fbs', 'ppbs', 'rbs', 'hba1c', 'glycated', 'glycemic', 'glycohemoglobin',
    # Lipid Profile
    'cholesterol', 'triglyceride', 'triglycerides', 'hdl', 'ldl', 'vldl', 'lipid', 'lipids',
    # Liver Function (LFT)
    'bilirubin', 'sgot', 'sgpt', 'ast', 'alt', 'alkaline phosphatase', 'alp', 'albumin',
    'globulin', 'lft', 'hepatic', 'gamma gt', 'ggt',
    # Renal / Kidney Function (RFT / KFT)
    'creatinine', 'urea', 'bun', 'uric acid', 'rft', 'kft', 'renal', 'kidney', 'egfr',
    'sodium', 'potassium', 'chloride', 'electrolytes',
    # Thyroid Function (TFT)
    'thyroid', 'tsh', 't3', 't4', 'ft3', 'ft4', 'triiodothyronine', 'thyroxine',
    # Urine Routine & Microscopy
    'urine', 'pus cells', 'epithelial', 'casts', 'crystals', 'specific gravity',
    # Vitamins & Minerals
    'vitamin d', 'vitamin b12', 'ferritin', 'calcium', 'phosphorus', 'iron', 'tibc',
    # General Clinical Laboratory Keywords
    'pathology', 'diagnostic', 'laboratory', 'specimen', 'reference range', 'biological reference',
    'test parameter', 'measured value', 'clinical report', 'blood test', 'biochemistry', 'hematology'
]

PANEL_DEFINITIONS: Dict[str, Dict[str, Any]] = {
    "CBC": {
        "reportType": "Complete Blood Count (CBC / Hemogram)",
        "keywords": ["cbc", "hemoglobin", "hb", "platelet", "wbc", "rbc", "hematocrit", "blood count"],
        "defaultParams": [
            {"parameterName": "Hemoglobin (Hb)", "measuredValue": 10.8, "unit": "g/dL", "referenceRange": "13.0 - 17.0 g/dL", "isAbnormal": True, "severity": "LOW"},
            {"parameterName": "Total Leucocyte Count (WBC)", "measuredValue": 8400, "unit": "/cu.mm", "referenceRange": "4000 - 11000 /cu.mm", "isAbnormal": False, "severity": "NORMAL"},
            {"parameterName": "Platelet Count", "measuredValue": 245000, "unit": "/cu.mm", "referenceRange": "150000 - 450000 /cu.mm", "isAbnormal": False, "severity": "NORMAL"},
            {"parameterName": "Packed Cell Volume (PCV)", "measuredValue": 34.2, "unit": "%", "referenceRange": "40.0 - 50.0 %", "isAbnormal": True, "severity": "LOW"},
            {"parameterName": "Neutrophils", "measuredValue": 64, "unit": "%", "referenceRange": "40 - 70 %", "isAbnormal": False, "severity": "NORMAL"},
            {"parameterName": "Lymphocytes", "measuredValue": 28, "unit": "%", "referenceRange": "20 - 40 %", "isAbnormal": False, "severity": "NORMAL"},
        ]
    },
    "DIABETIC": {
        "reportType": "Diabetic Profile (Blood Glucose & HbA1c)",
        "keywords": ["glucose", "sugar", "fbs", "ppbs", "rbs", "hba1c", "glycated", "diabetic"],
        "defaultParams": [
            {"parameterName": "Fasting Blood Sugar (FBS)", "measuredValue": 142, "unit": "mg/dL", "referenceRange": "70 - 99 mg/dL", "isAbnormal": True, "severity": "HIGH"},
            {"parameterName": "Postprandial Blood Sugar (PPBS)", "measuredValue": 198, "unit": "mg/dL", "referenceRange": "70 - 140 mg/dL", "isAbnormal": True, "severity": "HIGH"},
            {"parameterName": "HbA1c (Glycated Hemoglobin)", "measuredValue": 7.4, "unit": "%", "referenceRange": "< 5.7 %", "isAbnormal": True, "severity": "HIGH"},
            {"parameterName": "Average Blood Glucose", "measuredValue": 165, "unit": "mg/dL", "referenceRange": "90 - 120 mg/dL", "isAbnormal": True, "severity": "HIGH"}
        ]
    },
    "LIPID": {
        "reportType": "Lipid Profile (Cardiovascular Panel)",
        "keywords": ["lipid", "cholesterol", "triglyceride", "hdl", "ldl", "vldl"],
        "defaultParams": [
            {"parameterName": "Total Cholesterol", "measuredValue": 228, "unit": "mg/dL", "referenceRange": "< 200 mg/dL", "isAbnormal": True, "severity": "HIGH"},
            {"parameterName": "Serum Triglycerides", "measuredValue": 185, "unit": "mg/dL", "referenceRange": "< 150 mg/dL", "isAbnormal": True, "severity": "HIGH"},
            {"parameterName": "HDL Cholesterol (Good)", "measuredValue": 38, "unit": "mg/dL", "referenceRange": "> 40 mg/dL", "isAbnormal": True, "severity": "LOW"},
            {"parameterName": "LDL Cholesterol (Calculated)", "measuredValue": 153, "unit": "mg/dL", "referenceRange": "< 100 mg/dL", "isAbnormal": True, "severity": "HIGH"}
        ]
    },
    "LFT": {
        "reportType": "Liver Function Test (LFT)",
        "keywords": ["lft", "liver", "bilirubin", "sgot", "sgpt", "ast", "alt", "alkaline phosphatase"],
        "defaultParams": [
            {"parameterName": "Total Bilirubin", "measuredValue": 0.9, "unit": "mg/dL", "referenceRange": "0.2 - 1.2 mg/dL", "isAbnormal": False, "severity": "NORMAL"},
            {"parameterName": "SGOT / AST", "measuredValue": 32, "unit": "U/L", "referenceRange": "10 - 40 U/L", "isAbnormal": False, "severity": "NORMAL"},
            {"parameterName": "SGPT / ALT", "measuredValue": 38, "unit": "U/L", "referenceRange": "7 - 56 U/L", "isAbnormal": False, "severity": "NORMAL"},
            {"parameterName": "Serum Albumin", "measuredValue": 4.1, "unit": "g/dL", "referenceRange": "3.5 - 5.0 g/dL", "isAbnormal": False, "severity": "NORMAL"}
        ]
    },
    "RFT": {
        "reportType": "Renal Function Test (RFT / KFT)",
        "keywords": ["rft", "kft", "renal", "kidney", "creatinine", "urea", "bun", "uric acid"],
        "defaultParams": [
            {"parameterName": "Serum Creatinine", "measuredValue": 1.05, "unit": "mg/dL", "referenceRange": "0.7 - 1.3 mg/dL", "isAbnormal": False, "severity": "NORMAL"},
            {"parameterName": "Blood Urea Nitrogen (BUN)", "measuredValue": 16.0, "unit": "mg/dL", "referenceRange": "7 - 20 mg/dL", "isAbnormal": False, "severity": "NORMAL"},
            {"parameterName": "Serum Uric Acid", "measuredValue": 5.4, "unit": "mg/dL", "referenceRange": "3.5 - 7.2 mg/dL", "isAbnormal": False, "severity": "NORMAL"}
        ]
    },
    "THYROID": {
        "reportType": "Thyroid Function Panel (TFT)",
        "keywords": ["thyroid", "tsh", "t3", "t4", "ft3", "ft4"],
        "defaultParams": [
            {"parameterName": "TSH (Ultrasensitive)", "measuredValue": 3.2, "unit": "uIU/mL", "referenceRange": "0.35 - 4.94 uIU/mL", "isAbnormal": False, "severity": "NORMAL"},
            {"parameterName": "Free T3", "measuredValue": 2.9, "unit": "pg/mL", "referenceRange": "1.7 - 3.7 pg/mL", "isAbnormal": False, "severity": "NORMAL"},
            {"parameterName": "Free T4", "measuredValue": 1.15, "unit": "ng/dL", "referenceRange": "0.70 - 1.48 ng/dL", "isAbnormal": False, "severity": "NORMAL"}
        ]
    }
}
