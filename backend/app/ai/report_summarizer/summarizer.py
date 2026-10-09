from typing import List, Dict, Any, Tuple

class ReportSummarizer:
    def summarize_report(
        self,
        report_type: str,
        parameters: List[Dict[str, Any]],
        patient_id: str
    ) -> Tuple[Dict[str, str], List[str], List[str]]:
        abnormal = [p for p in parameters if p.get("isAbnormal")]
        critical_findings: List[str] = []
        observations: List[str] = []

        for p in parameters:
            sev = p.get("severity")
            name = p.get("parameterName")
            val = p.get("measuredValue")
            unit = p.get("unit")
            ref = p.get("referenceRange")

            if sev in ["HIGH", "CRITICAL_HIGH"]:
                critical_findings.append(f"Elevated {name}: {val} {unit} (Ref: {ref})")
                observations.append(f"Important observation: {name} is above the stated reference range ({val} {unit}).")
            elif sev in ["LOW", "CRITICAL_LOW"]:
                critical_findings.append(f"Low {name}: {val} {unit} (Ref: {ref})")
                observations.append(f"Important observation: {name} is below the stated reference range ({val} {unit}).")

        if not observations:
            observations.append("Important observation: All measured parameters are within stated clinical biological reference ranges.")

        if abnormal:
            names = ", ".join(p.get("parameterName") for p in abnormal)
            en_summary = (
                f"The uploaded {report_type} report has been analyzed against clinical laboratory reference ranges. "
                f"Key parameters requiring clinical attention include: {names}. "
                f"Other evaluated diagnostic indices remain within baseline physiological limits."
            )
            ta_summary = (
                f"பதிவேற்றப்பட்ட {report_type} பரிசோதனை அறிக்கை ஆய்வு செய்யப்பட்டது. "
                f"மருத்துவர் கவனிக்க வேண்டிய முக்கிய அளவுருக்கள்: {names}. "
                f"பிற அளவீடுகள் மருத்துவ வரம்புகளுக்குள் உள்ளன."
            )
            hi_summary = (
                f"अपलोड की गई {report_type} जांच रिपोर्ट का विश्लेषण किया गया है। "
                f"डॉक्टर के ध्यान देने योग्य मुख्य पैरामीटर: {names}। "
                f"अन्य सभी जांच परिणाम सामान्य संदर्भ सीमाओं के भीतर हैं।"
            )
        else:
            en_summary = (
                f"The uploaded {report_type} report was evaluated. All measured clinical diagnostic parameters "
                f"fall within biological standard reference intervals."
            )
            ta_summary = (
                f"பதிவேற்றப்பட்ட {report_type} ஆய்வக அறிக்கை பகுப்பாய்வு செய்யப்பட்டது. "
                f"அனைத்து மருத்துவ அளவுருக்களும் இயல்பான நிலையான வரம்பிற்குள் உள்ளன."
            )
            hi_summary = (
                f"अपलोड की गई {report_type} रिपोर्ट की समीक्षा की गई है। "
                f"सभी प्रयोगशाला पैरामीटर सामान्य जैविक संदर्भ सीमा के भीतर हैं।"
            )

        ai_summary = {
            "en": en_summary,
            "ta": ta_summary,
            "hi": hi_summary
        }

        return ai_summary, critical_findings, observations

report_summarizer = ReportSummarizer()
