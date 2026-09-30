import { LanguageCode } from './types';

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    app_title: 'Healorithm',
    offline_banner: 'Offline Mode Active • Stored Encrypted On-Device',
    online_banner: 'Connected • Background Sync Active',
    sync_now: 'Sync Data',
    syncing: 'Syncing Changes...',
    all_synced: 'All Records Synced',
    worker_portal: 'ASHA / Health Worker',
    patient_portal: 'Patient Health Card',
    admin_portal: 'Doctor / District Admin',
    emergency_sos: 'Emergency SOS',
    scan_qr: 'Scan Patient QR',
    new_patient: 'Register Patient',
    daily_queue: 'Daily Visit Queue',
    risk_high: 'High Risk',
    risk_med: 'Moderate Risk',
    risk_low: 'Low Risk',
    record_vitals: 'Record Vitals & Symptoms',
    my_qr_card: 'My Digital QR Health Card',
    today_medicine: "Today's Medicine Tracker",
    jan_aushadhi_savings: 'Jan Aushadhi Generic Savings',
    consent_requests: 'Data Sharing Consent',
    zero_signal_transfer: 'Zero-Signal Diary Transfer',
    voice_guide_active: 'Audio Guidance Playing...',
    listen_audio: 'Listen in Local Voice',
    take_morning: 'Morning Dose (Subah)',
    take_afternoon: 'Afternoon Dose (Dopahar)',
    take_night: 'Night Dose (Raat)',
    streak_days: 'Days Streak',
    call_asha: 'Call Assigned ASHA Worker',
    emergency_call: 'Call 108 Ambulance',
    approved_generics: 'Doctor Approved Generics',
    total_savings_msg: 'You save up to 85% with Jan Aushadhi generic medicines'
  },
  hi: {
    app_title: 'हीलोरिम (Healorithm)',
    offline_banner: 'ऑफ़लाइन मोड सक्रिय • डेटा डिवाइस पर सुरक्षित है',
    online_banner: 'इंटरनेट जुड़ा हुआ है • ऑटो-सिंक सक्रिय',
    sync_now: 'डेटा सिंक करें',
    syncing: 'सिंक हो रहा है...',
    all_synced: 'सभी रिकॉर्ड सिंक हो गए हैं',
    worker_portal: 'आशा / स्वास्थ्य कार्यकर्ता',
    patient_portal: 'मरीज़ स्वास्थ्य कार्ड',
    admin_portal: 'डॉक्टर / ज़िला डैशबोर्ड',
    emergency_sos: 'आपातकालीन SOS',
    scan_qr: 'मरीज़ का QR स्कैन करें',
    new_patient: 'नया मरीज़ जोड़ें',
    daily_queue: 'आज की मरीज़ सूची',
    risk_high: 'उच्च जोखिम (High Risk)',
    risk_med: 'मध्यम जोखिम (Medium Risk)',
    risk_low: 'कम जोखिम (Low Risk)',
    record_vitals: 'जाँच और लक्षण दर्ज करें',
    my_qr_card: 'मेरा QR स्वास्थ्य कार्ड',
    today_medicine: 'आज की दवाइयाँ',
    jan_aushadhi_savings: 'जन औषधि बचत रिपोर्ट',
    consent_requests: 'डेटा शेयरिंग सहमति',
    zero_signal_transfer: 'बिना इंटरनेट डायरी शेयर करें',
    voice_guide_active: 'आवाज़ में निर्देश चल रहे हैं...',
    listen_audio: 'आवाज़ में सुनें',
    take_morning: 'सुबह की दवा',
    take_afternoon: 'दोपहर की दवा',
    take_night: 'रात की दवा',
    streak_days: 'दिनों से लगातार',
    call_asha: 'आशा दीदी को कॉल करें',
    emergency_call: '108 एम्बुलेंस बुलाएं',
    approved_generics: 'डॉक्टर द्वारा स्वीकृत जेनेरिक दवा',
    total_savings_msg: 'जन औषधि जेनेरिक दवाओं से आप 85% तक पैसे बचा रहे हैं'
  },
  mr: {
    app_title: 'हिलोरिथम (Healorithm)',
    offline_banner: 'ऑफलाइन मोड सुरू • फोनवर डेटा सुरक्षित',
    online_banner: 'इंटरनेट जोडले आहे • ऑटो सिंक सुरू',
    sync_now: 'डेटा सिंक करा',
    syncing: 'डेटा पाठवत आहे...',
    all_synced: 'सर्व डेटा सुरक्षित सिंक झाला',
    worker_portal: 'आशा / आरोग्य सेविका',
    patient_portal: 'रुग्ण आरोग्य पत्रक (QR Card)',
    admin_portal: 'डॉक्टर / जिल्हा प्रशासन',
    emergency_sos: 'तातडीची मदत (SOS)',
    scan_qr: 'रुग्णाचा QR स्कॅन करा',
    new_patient: 'नवीन रुग्ण नोंदणी',
    daily_queue: 'आजच्या भेटींची यादी',
    risk_high: 'जास्त धोका (High Risk)',
    risk_med: 'मध्यम धोका (Medium Risk)',
    risk_low: 'कमी धोका (Low Risk)',
    record_vitals: 'तपासणी व लक्षणे नोंदवा',
    my_qr_card: 'माझे QR आरोग्य कार्ड',
    today_medicine: 'आजची औषधे',
    jan_aushadhi_savings: 'जन औषधी बचत अहवाल',
    consent_requests: 'माहिती देण्याची संमती',
    zero_signal_transfer: 'इंटरनेट शिवाय डायरी पाठवा',
    voice_guide_active: 'आवाजात सूचना सुरू आहे...',
    listen_audio: 'आवाजात ऐका',
    take_morning: 'सकाळचे औषध',
    take_afternoon: 'दुपारचे औषध',
    take_night: 'रात्रीचे औषध',
    streak_days: 'दिवस सलग औषध घेतले',
    call_asha: 'आशा ताईंना कॉल करा',
    emergency_call: '108 रुग्णवाहिका बोलवा',
    approved_generics: 'डॉक्टरांनी मंजूर केलेले जेनेरिक औषध',
    total_savings_msg: 'जन औषधी जेनेरिक औषधांमुळे आपले 85% पर्यंत पैसे वाचतात'
  }
};

/**
 * Text-to-speech audio reader in local language
 */
export function playVoicePrompt(text: string, lang: LanguageCode = 'en') {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (lang === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (lang === 'mr') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-IN';
    }
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}
