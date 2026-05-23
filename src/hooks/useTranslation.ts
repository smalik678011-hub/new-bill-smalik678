import { useMemo, useEffect, useContext } from 'react';
import useAppStore from '../store';
import { LanguageContext } from '../context/LanguageContext';


const HINDI_RANGE_REGEX = /[\u0900-\u097F]/;
const ENGLISH_RANGE_REGEX = /[a-zA-Z]/;

// Dictionary of purely-English to Hindi/Hinglish and purely-Hindi to English/Hinglish
const TRANSLATION_DICTIONARY: Record<string, Record<'Hindi' | 'English' | 'Hinglish', string>> = {
  // Labour & Attendance Suite Translation Keys
  "कोई कारिगर नहीं मिला।": {
    Hindi: "कोई कारिगर नहीं मिला।",
    English: "No workers found.",
    Hinglish: "Koi worker nahi mila."
  },
  "सर्च कीवर्ड बदलें": {
    Hindi: "सर्च कीवर्ड बदलें",
    English: "Try another search keyword.",
    Hinglish: "Search keyword change karein."
  },
  "ऊपर \"नया कारीगर\" दबाकर चालू करें।": {
    Hindi: "ऊपर \"नया कारीगर\" दबाकर चालू करें।",
    English: "Click \"New Worker\" above to begin.",
    Hinglish: "Upar \"New Worker\" press karke register karein."
  },
  "लेबर और हाज़िरी रजिस्टर": {
    Hindi: "लेबर और हाज़िरी रजिस्टर",
    English: "Labour & Attendance Register",
    Hinglish: "लेबर और हाज़िरी रजिस्टर (Labour & Attendance)"
  },
  "Labour Roster Suite": {
    Hindi: "लेबर और हाज़िरी रजिस्टर",
    English: "Labour Roster Suite",
    Hinglish: "Labour Roster Suite"
  },
  "कारीगरों की दैनिक हाजिरी लगाएं, मासिक कैलेंडर देखें और वेतन (हिसाब-किताब) व्यवस्थित करें।": {
    Hindi: "कारीगरों की दैनिक हाजिरी लगाएं, मासिक कैलेंडर देखें और वेतन (हिसाब-किताब) व्यवस्थित करें।",
    English: "Track daily attendance, view monthly calendar, and manage worker payroll/salary logs easily.",
    Hinglish: "Workers की daily attendance लगाएं, monthly calendar देखें और salary (payroll) manage करें।"
  },
  "क्लाउड डेटाबेस सक्रिय (Sync Active)": {
    Hindi: "क्लाउड डेटाबेस सक्रिय (Sync Active)",
    English: "Cloud Database Active (Sync Active)",
    Hinglish: "Cloud Database Active (Sync Active)"
  },
  "Sync Active": {
    Hindi: "क्लाउड डेटाबेस सक्रिय",
    English: "Sync Active",
    Hinglish: "Sync Active"
  },
  "लोकल मोड सक्रिय (Local Offline Book)": {
    Hindi: "लोकल मोड सक्रिय (Local Offline Book)",
    English: "Offline Mode Active (Local Offline Book)",
    Hinglish: "Offline Mode Active (Local Offline Book)"
  },
  "Local Offline Book": {
    Hindi: "लोकल ऑफलाइन बही",
    English: "Local Offline Book",
    Hinglish: "Local Offline Book"
  },
  "📅 हाज़िरी कैलेंडर (Monthly & Bulk)": {
    Hindi: "📅 हाज़िरी कैलेंडर (Monthly & Bulk)",
    English: "📅 Attendance Calendar (Monthly & Bulk)",
    Hinglish: "📅 Attendance Calendar (Monthly & Bulk)"
  },
  "👷 कारीगर प्रबंधक (Manage Workers)": {
    Hindi: "👷 कारीगर प्रबंधक (Manage Workers)",
    English: "👷 Manage Workers",
    Hinglish: "👷 Workers Manager (Manage Workers)"
  },
  "💰 हिसाब और सैलरी (Payroll Book)": {
    Hindi: "💰 हिसाब और सैलरी (Payroll Book)",
    English: "💰 Salary & Payroll Ledger",
    Hinglish: "💰 Salary & Payroll (Payroll Book)"
  },
  "हाज़िरी एवं कैलेंडर (Attendance Suite)": {
    Hindi: "हाज़िरी एवं कैलेंडर (Attendance Suite)",
    English: "Attendance & Calendar Suite",
    Hinglish: "Attendance & Calendar (Attendance Suite)"
  },
  "तारीख के अनुसार": {
    Hindi: "तारीख के अनुसार",
    English: "By Selected Date",
    Hinglish: "Date-wise (तारीख के अनुसार)"
  },
  "मासिक कैलेंडर": {
    Hindi: "मासिक कैलेंडर",
    English: "Monthly Calendar",
    Hinglish: "Monthly Calendar (मासिक कैलेंडर)"
  },
  "हाज़िरी अपडेट सिंक हो रही है...": {
    Hindi: "हाज़िरी अपडेट सिंक हो रही है...",
    English: "Syncing attendance records...",
    Hinglish: "Attendance update sync ho rahi hai..."
  },
  "हाजिरी की तारीख चुनें:": {
    Hindi: "हाजिरी की तारीख चुनें:",
    English: "Select Attendance Date:",
    Hinglish: "Attendance Date चुनें:"
  },
  "सभी को उपस्थित करें (Bulk Present Only)": {
    Hindi: "सभी को उपस्थित करें (Bulk Present Only)",
    English: "Mark All Present (Bulk Present)",
    Hinglish: "सभी को Present करें (Bulk Present Only)"
  },
  "पूर्ण (P)": {
    Hindi: "पूर्ण (P)",
    English: "Present (P)",
    Hinglish: "Present (P)"
  },
  "आधा (½)": {
    Hindi: "आधा (½)",
    English: "Half (½)",
    Hinglish: "Half Day (½)"
  },
  "अनु० (A)": {
    Hindi: "अनु० (A)",
    English: "Absent (A)",
    Hinglish: "Absent (A)"
  },
  "पहले कारीगर लिस्ट में कारीगर जोड़ें!": {
    Hindi: "पहले कारीगर लिस्ट में कारीगर जोड़ें!",
    English: "Please add workers in the Workers List tab first!",
    Hinglish: "पहले Workers list में workers add करें!"
  },
  "पहले कारीगर लिस्ट में कारीगर जोड़ें": {
    Hindi: "पहले कारीगर लिस्ट में कारीगर जोड़ें",
    English: "Please add workers in the Workers List tab first",
    Hinglish: "पहले Workers list में workers add करें"
  },
  "पहले Workers लिस्ट में Workers Add!": {
    Hindi: "पहले कारीगर लिस्ट में कारीगर जोड़ें!",
    English: "Please add workers in the Workers List tab first!",
    Hinglish: "पहले Workers list में workers add करें!"
  },
  "कारीगर चुनें:": {
    Hindi: "कारीगर चुनें:",
    English: "Select Worker:",
    Hinglish: "Worker चुनें:"
  },
  "💡 तारीख पर टैप करें: स्टेटस बदलने के लिए।": {
    Hindi: "💡 तारीख पर टैप करें: स्टेटस बदलने के लिए।",
    English: "💡 Tap on any date to cycle attendance status.",
    Hinglish: "💡 Date par tap karein status change karne ke liye."
  },
  "कैलेंडर देखने के लिए कोई कारीगर चुनें!": {
    Hindi: "कैलेंडर देखने के लिए कोई कारीगर चुनें!",
    English: "Select a worker to display their calendar!",
    Hinglish: "Calendar dekhne ke liye koi worker select karein!"
  },
  "कैलेंडर देखने के लिए कोई कारीगर चुनें": {
    Hindi: "कैलेंडर देखने के लिए कोई कारीगर चुनें",
    English: "Select a worker to display their calendar",
    Hinglish: "Calendar dekhne ke liye koi worker select karein"
  },
  "मजदूर एवं कारीगर लिस्ट": {
    Hindi: "मजदूर एवं कारीगर लिस्ट",
    English: "Workers & Staff List",
    Hinglish: "Workers/Staff List"
  },
  "मजदूर एवं कारीगर लिस्ट ({workers.length})": {
    Hindi: "मजदूर एवं कारीगर लिस्ट ({workers.length})",
    English: "Workers & Staff Directory ({workers.length})",
    Hinglish: "Workers & Staff Directory ({workers.length})"
  },
  "नया कारीगर": {
    Hindi: "नया कारीगर",
    English: "New Worker",
    Hinglish: "नया कारीगर (New Worker)"
  },
  "नया कारीगर सहेजें": {
    Hindi: "नया कारीगर सहेजें",
    English: "Save New Worker",
    Hinglish: "नया Worker सहेजें (Save Worker)"
  },
  "नाम (Karigar Name) *": {
    Hindi: "नाम (Karigar Name) *",
    English: "Full Name (Worker Name) *",
    Hinglish: "Full Name (Worker Name) *"
  },
  "अपना शुभ नाम डालें": {
    Hindi: "अपना शुभ नाम डालें",
    English: "Enter name of worker",
    Hinglish: "Enter name of worker"
  },
  "दैनिक दहाड़ी दर (₹/Day) *": {
    Hindi: "दैनिक दहाड़ी दर (₹/Day) *",
    English: "Daily Wages Rate (₹/Day) *",
    Hinglish: "Daily Wage Rate (₹/Day) *"
  },
  "मोबाइल नंबर (Phone No.)": {
    Hindi: "मोबाइल नंबर (Phone No.)",
    English: "Mobile Number (Phone No.)",
    Hinglish: "Mobile Number (Phone No.)"
  },
  "करीगर को रजिस्टर में जोड़ें (Save Worker)": {
    Hindi: "करीगर को रजिस्टर में जोड़ें (Save Worker)",
    English: "Add Worker to Register",
    Hinglish: "Worker को Register में जोड़ें (Save Worker)"
  },
  "Manoj, Suresh, Rajesh, Phone No. से सर्च करें...": {
    Hindi: "Manoj, Suresh, Rajesh, Phone No. से सर्च करें...",
    English: "Search by name or mobile number...",
    Hinglish: "Name, phone se search karein..."
  },
  "रजिस्टर से निकालें": {
    Hindi: "रजिस्टर से निकालें",
    English: "Remove from Register",
    Hinglish: "Remove from Register"
  },
  "कारीगर लिस्ट लोड हो रही है...": {
    Hindi: "कारीगर लिस्ट लोड हो रही है...",
    English: "Loading worker directory...",
    Hinglish: "Worker list load ho rahi hai..."
  },
  "मजदूरी बही (Roster List)": {
    Hindi: "मजदूरी बही (Roster List)",
    English: "Wages & Roster Ledger",
    Hinglish: "Wages & Roster Ledger (Roster List)"
  },
  "भुगतान इतिहास (Payments History)": {
    Hindi: "भुगतान इतिहास (Payments History)",
    English: "Salary Payments History",
    Hinglish: "Salary Payments History"
  },
  "महीना:": {
    Hindi: "महीना:",
    English: "Select Month:",
    Hinglish: "Month (महीना):"
  },
  "डेटा सिंक किया जा रहा है...": {
    Hindi: "डेटा सिंक किया जा रहा है...",
    English: "Syncing payroll data...",
    Hinglish: "Data sync kiya ja raha hai..."
  },
  "मजदूरी बही खाली है। पहले कारीगर जोड़ें।": {
    Hindi: "मजदूरी बही खाली है। पहले कारीगर जोड़ें।",
    English: "Payroll roster is empty. Please add workers first.",
    Hinglish: "Payroll list empty hai. Pehle workers add karein."
  },
  "महीना-अन्त सारांश (Month-End Summary)": {
    Hindi: "महीना-अन्त सारांश (Month-End Summary)",
    English: "Month-End Payroll Summary",
    Hinglish: "Month-End Summary"
  },
  "सक्रिय मजदूर (Active Workers)": {
    Hindi: "सक्रिय मजदूर (Active Workers)",
    English: "Active Workers count",
    Hinglish: "Active Workers (सक्रिय मजदूर)"
  },
  "कुल वेतन बना (Gross Payroll)": {
    Hindi: "कुल वेतन बना (Gross Payroll)",
    English: "Gross Payroll Earned",
    Hinglish: "Gross Payroll (कुल वेतन)"
  },
  "कुल भुगतान हुआ (Gross Paid)": {
    Hindi: "कुल भुगतान हुआ (Gross Paid)",
    English: "Total Salary Paid",
    Hinglish: "Total Paid (कुल भुगतान)"
  },
  "शेष भुगतान लंबित (Outstanding Due)": {
    Hindi: "शेष भुगतान लंबित (Outstanding Due)",
    English: "Net Balanced Outstanding Dues",
    Hinglish: "Outstanding Due (बकाया वेतन)"
  },
  "इस महीने में कोई सैलरी भुगतान नहीं किया गया।": {
    Hindi: "इस महीने में कोई सैलरी भुगतान नहीं किया गया।",
    English: "No salary disbursements recorded in this month.",
    Hinglish: "Is month me koi salary payment nahi kiya gaya."
  },
  "दहाड़ी का रेट:": {
    Hindi: "दहाड़ी का रेट:",
    English: "Daily Rate:",
    Hinglish: "Wage Rate:"
  },
  "कुल कमाया:": {
    Hindi: "कुल कमाया:",
    English: "Total Earned:",
    Hinglish: "Total Earned"
  },
  "पहले चुकाया:": {
    Hindi: "पहले चुकाया:",
    English: "Previously Paid:",
    Hinglish: "Previously Paid (पहले चुकाया)"
  },
  "पेमेंट की राशि भरें (Payment Amount ₹) *": {
    Hindi: "पेमेंट की राशि भरें (Payment Amount ₹) *",
    English: "Enter Salary Amount (₹) *",
    Hinglish: "Enter Salary Amount (₹) *"
  },
  "भुगतान की तारीख (Payment Date) *": {
    Hindi: "भुगतान की तारीख (Payment Date) *",
    English: "Disbursement Date *",
    Hinglish: "Disbursement Date *"
  },
  "विवरण / नोट (Payment Notes)": {
    Hindi: "विवरण / नोट (Payment Notes)",
    English: "Remarks / Notes",
    Hinglish: "Remarks / Notes"
  },
  "कृपया सही पेमेंट राशि भरें!": {
    Hindi: "कृपया सही पेमेंट राशि भरें!",
    English: "Please enter a valid payment amount!",
    Hinglish: "Please correct payment amount enter karein!"
  },
  "भुगतान दर्ज करें (Confirm Settle)": {
    Hindi: "भुगतान दर्ज करें (Confirm Settle)",
    English: "Disburse Payment (Confirm Settle)",
    Hinglish: "Disburse Payment (Confirm Settle)"
  },

  "जनवरी (January)": { Hindi: "जनवरी", English: "January", Hinglish: "Jan (जनवरी)" },
  "फ़रवरी (February)": { Hindi: "फ़रवरी", English: "February", Hinglish: "Feb (फ़रवरी)" },
  "मार्च (March)": { Hindi: "मार्च", English: "March", Hinglish: "Mar (मार्च)" },
  "अप्रैल (April)": { Hindi: "अप्रैल", English: "April", Hinglish: "Apr (अप्रैल)" },
  "मई (May)": { Hindi: "मई", English: "May", Hinglish: "May (मई)" },
  "जून (June)": { Hindi: "जून", English: "June", Hinglish: "Jun (जून)" },
  "जुलाई (July)": { Hindi: "जुलाई", English: "July", Hinglish: "Jul (जुलाई)" },
  "अगस्त (August)": { Hindi: "अगस्त", English: "August", Hinglish: "Aug (अगस्त)" },
  "सितम्बर (September)": { Hindi: "सितम्बर", English: "September", Hinglish: "Sep (सितम्बर)" },
  "अक्टूबर (October)": { Hindi: "अक्टूबर", English: "October", Hinglish: "Oct (अक्टूबर)" },
  "नवम्बर (November)": { Hindi: "नवम्बर", English: "November", Hinglish: "Nov (नवम्बर)" },
  "दिसम्बर (December)": { Hindi: "दिसम्बर", English: "December", Hinglish: "Dec (दिसम्बर)" },

  "जनवरी (Jan)": { Hindi: "जनवरी", English: "January (Jan)", Hinglish: "Jan" },
  "फ़रवरी (Feb)": { Hindi: "फ़रवरी", English: "February (Feb)", Hinglish: "Feb" },
  "मार्च (Mar)": { Hindi: "मार्च", English: "March (Mar)", Hinglish: "Mar" },
  "अप्रैल (Apr)": { Hindi: "अप्रैल", English: "April (Apr)", Hinglish: "Apr" },
  "मई (May-Short)": { Hindi: "मई", English: "May (May)", Hinglish: "May" },
  "जून (Jun)": { Hindi: "जून", English: "June (Jun)", Hinglish: "Jun" },
  "जुलाई (Jul)": { Hindi: "जुलाई", English: "July (Jul)", Hinglish: "Jul" },
  "अगस्त (Aug)": { Hindi: "अगस्त", English: "August (Aug)", Hinglish: "Aug" },
  "सितम्बर (Sep)": { Hindi: "सितम्बर", English: "September (Sep)", Hinglish: "Sep" },
  "अक्टूबर (Oct)": { Hindi: "अक्टूबर", English: "October (Oct)", Hinglish: "Oct" },
  "नवम्बर (Nov)": { Hindi: "नवम्बर", English: "November (Nov)", Hinglish: "Nov" },
  "दिसम्बर (Dec)": { Hindi: "दिसम्बर", English: "December (Dec)", Hinglish: "Dec" },

  // Quick Actions Translations & Symmetries
  "नया ग्राहक": {
    Hindi: "नया ग्राहक",
    English: "New Client",
    Hinglish: "नया ग्राहक (New Client)"
  },
  "Add Client": {
    Hindi: "नया ग्राहक जोड़ें",
    English: "Add Client",
    Hinglish: "नया ग्राहक (Add Client)"
  },
  "नया पक्का बिल": {
    Hindi: "नया पक्का बिल",
    English: "New Invoice",
    Hinglish: "नया पक्का बिल (New Invoice)"
  },
  "Create Invoice": {
    Hindi: "नया इनवॉइस बनाएँ",
    English: "Create Invoice",
    Hinglish: "नया इनवॉइस (Create Invoice)"
  },
  "बाकी रिपोर्ट": {
    Hindi: "बाकी रिपोर्ट",
    English: "Pending Report",
    Hinglish: "बाकी रिपोर्ट (Lena Baqi Report)"
  },
  "Lena Baqi": {
    Hindi: "बाकी वसूल लिस्ट",
    English: "Outstanding Balances (Lena Baqi)",
    Hinglish: "Lena Baqi"
  },
  "UPI QR शेयर": {
    Hindi: "UPI QR शेयर",
    English: "Share UPI QR",
    Hinglish: "UPI QR शेयर"
  },
  "Share Payment QR": {
    Hindi: "पेमेंट क्यूआर कोड साझा करें",
    English: "Share Payment QR",
    Hinglish: "Share Payment QR"
  },
  "Mark Attendance": {
    Hindi: "हाज़िरी भरें",
    English: "Mark Attendance",
    Hinglish: "हाज़िरी (Attendance)"
  },
  "attendance": {
    Hindi: "मजदूर हाज़िरी",
    English: "Attendance",
    Hinglish: "Attendance"
  },
  // Authentication & Login/Signup general
  "नया खाता चाहिए?": {
    Hindi: "नया खाता चाहिए?",
    English: "Need a new account?",
    Hinglish: "नया खाता चाहिए? (Need account?)"
  },
  "पहले से ही खाता है?": {
    Hindi: "पहले से ही खाता है?",
    English: "Already have an account?",
    Hinglish: "पहले से ही खाता है? (Already have account?)"
  },
  "लॉगआउट सफल रहा!": {
    Hindi: "लॉगआउट सफल रहा!",
    English: "Logout successful!",
    Hinglish: "लॉगआउट सफल रहा (Logout successful)!"
  },
  "लॉगआउट में त्रुटि!": {
    Hindi: "लॉगआउट में त्रुटि!",
    English: "Logout error!",
    Hinglish: "लॉगआउट में त्रुटि (Logout error)!"
  },
  "लॉगआउट में त्रुटि हुई!": {
    Hindi: "लॉगआउट में त्रुटि हुई!",
    English: "Logout error occurred!",
    Hinglish: "लॉगआउट में त्रुटि हुई (Logout error)!"
  },
  
  // Dashboard Metrics & Messages
  "सारे बिल और भुगतान सुरक्षित क्लाउड डेटाबेस से सिंक हैं।": {
    Hindi: "सारे बिल और भुगतान सुरक्षित क्लाउड डेटाबेस से सिंक हैं।",
    English: "All bills and payments are synced with a secure cloud database.",
    Hinglish: "सारे बिल और भुगतान सुरक्षित क्लाउड (Cloud Database) से सिंक हैं।"
  },
  "लोकल बही खाता मोड सक्रिय है। इंटरनेट आने पर सुरक्षित हो जाएगा।": {
    Hindi: "लोकल बही खाता मोड सक्रिय है। इंटरनेट आने पर सुरक्षित हो जाएगा।",
    English: "Local offline ledger mode is active. It will sync once internet returns.",
    Hinglish: "लोकल बही खाता मोड (Local offline) सक्रिय है। इंटरनेट आने पर सुरक्षित हो जाएगा।"
  },
  "खता बुक प्रबंधन": {
    Hindi: "खता बुक प्रबंधन",
    English: "Ledger Book Management",
    Hinglish: "खता बुक प्रबंधन (Ledger Book)"
  },
  "कुल बकाया वसूली": {
    Hindi: "कुल बकाया वसूली",
    English: "Total Pending Receivable",
    Hinglish: "कुल बकाया वसूली (Total Receivables)"
  },
  "सभी एंट्रीज फोन के लोकल बही खाता स्टोरेज में सुरक्षित हैं।": {
    Hindi: "सभी एंट्रीज फोन के लोकल बही खाता स्टोरेज में सुरक्षित हैं।",
    English: "All entries are securely saved in your phone's offline storage.",
    Hinglish: "सभी एंट्रीज फोन के लोकल बही (Local Storage) में सुरक्षित हैं।"
  },
  "बही खाता लाइव क्लाउड डेटा से सिंक्रोनाइज्ड है।": {
    Hindi: "बही खाता लाइव क्लाउड डेटा से सिंक्रोनाइज्ड है।",
    English: "Your ledger is synchronized in real-time with the secure cloud database.",
    Hinglish: "बही खाता लाइव क्लाउड (Cloud Live) से सिंक्रोनाइज्ड है।"
  },

  // State text
  "सक्रिय सूची: ": {
    Hindi: "सक्रिय सूची: ",
    English: "Active List: ",
    Hinglish: "सक्रिय सूची (Active List): "
  },
  "ग्राहक खाते": {
    Hindi: "ग्राहक खाते",
    English: "Client Accounts",
    Hinglish: "ग्राहक खाते (Client Accounts)"
  },

  // Clients screen & Details
  "सभी": {
    Hindi: "सभी",
    English: "All",
    Hinglish: "सभी (All)"
  },
  "उधार": {
    Hindi: "उधार",
    English: "Due",
    Hinglish: "उधार (Due)"
  },
  "चुक्ता": {
    Hindi: "चुक्ता",
    English: "Clear",
    Hinglish: "चुक्ता (Clear)"
  },
  "लेट": {
    Hindi: "लेट",
    English: "Overdue",
    Hinglish: "लेट (Overdue)"
  },
  "बकायादार (Due)": {
    Hindi: "बकायादार",
    English: "Due Balance",
    Hinglish: "बकायादार (Due)"
  },
  "एडवांस सप्लायर (Supplier)": {
    Hindi: "एडवांस सप्लायर",
    English: "Supplier (Advance)",
    Hinglish: "एडवांस सप्लायर (Supplier)"
  },
  "चुक्ता हिसाब (Clear)": {
    Hindi: "चुक्ता हिसाब",
    English: "Settled Account (Clear)",
    Hinglish: "चुक्ता हिसाब (Clear)"
  },
  "डेडलाइन पार (Overdue)": {
    Hindi: "डेडलाइन पार",
    English: "Deadline Crossed (Overdue)",
    Hinglish: "डेडलाइन पार (Overdue)"
  },
  "बाकी भुगतान": {
    Hindi: "बाकी भुगतान",
    English: "Balance Due",
    Hinglish: "बाकी भुगतान (Balance Due)"
  },
  "सुरक्षित जमा": {
    Hindi: "सुरक्षित जमा",
    English: "Advance Paid",
    Hinglish: "सुरक्षित जमा (Advance)"
  },
  "लेनदेन ख़त्म": {
    Hindi: "लेनदेन ख़त्म",
    English: "No Dues",
    Hinglish: "लेनदेन ख़त्म (Clear)"
  },
  "फ़ोन (Contact):": {
    Hindi: "फ़ोन:",
    English: "Phone:",
    Hinglish: "फ़ोन (Phone):"
  },
  "डेडलाइन (Deadline):": {
    Hindi: "डेडलाइन:",
    English: "Deadline:",
    Hinglish: "डेडलाइन (Deadline):"
  },
  "लास्ट एक्टिविटी (Last Active):": {
    Hindi: "लास्ट एक्टिविटी:",
    English: "Last Active:",
    Hinglish: "लास्ट एक्टिविटी (Last Active):"
  },
  "विवरण देखें (Profile)": {
    Hindi: "विवरण देखें",
    English: "View Details (Profile)",
    Hinglish: "विवरण देखें (Profile)"
  },
  "खाता प्रविष्टि: Direct": {
    Hindi: "खाता प्रविष्टि: डायरेक्ट",
    English: "Ledger Entry: Direct",
    Hinglish: "खाता प्रविष्टि: Direct"
  },
  "स्रोत: ": {
    Hindi: "स्रोत: ",
    English: "Source: ",
    Hinglish: "स्रोत (Source): "
  },
  "ग्राहक का नाम, पता या मोबाइल नंबर खोजें...": {
    Hindi: "ग्राहक का नाम, पता या मोबाइल नंबर खोजें...",
    English: "Search client by name, address or mobile phone...",
    Hinglish: "ग्राहक का नाम, पता या Mobile Number खोजें..."
  },
  "नया ग्राहक जोड़ें": {
    Hindi: "नया ग्राहक जोड़ें",
    English: "Add New Client",
    Hinglish: "नया ग्राहक जोड़ें (Add Client)"
  },
  "नया ग्राहक खाता खोलें": {
    Hindi: "नया ग्राहक खाता खोलें",
    English: "Open New Client Account",
    Hinglish: "नया ग्राहक खाता खोलें (Open Client A/C)"
  },
  "Mera Grahak Account Registration Portal": {
    Hindi: "मेरा ग्राहक खाता रजिस्ट्रेशन पोर्टल",
    English: "My Client Account Registration Portal",
    Hinglish: "Mera Grahak Account Registration Portal"
  },
  "ग्राहक का नाम (Naam) *": {
    Hindi: "ग्राहक का नाम *",
    English: "Client Name *",
    Hinglish: "ग्राहक का नाम (Client Name) *"
  },
  "उदा. राम सिंह चौधरी (ठेकेदार)": {
    Hindi: "उदा. राम सिंह चौधरी (ठेकेदार)",
    English: "e.g. Ram Singh Choudhary (Contractor)",
    Hinglish: "उदा. Ram Singh Choudhary (Contractor)"
  },
  "मोबाइल नंबर (Mobile Phone)": {
    Hindi: "मोबाइल नंबर",
    English: "Mobile Number",
    Hinglish: "मोबाइल नंबर (Mobile)"
  },
  "उदा. 9876543210": {
    Hindi: "उदा. 9876543210",
    English: "e.g. 9876543210",
    Hinglish: "e.g. 9876543210"
  },
  "Regular (नियमित ग्राहक)": {
    Hindi: "नियमित ग्राहक (Regular)",
    English: "Regular Customer",
    Hinglish: "Regular (नियमित ग्राहक)"
  },
  "Contractor (ठेकेदार)": {
    Hindi: "ठेकेदार (Contractor)",
    English: "Contractor",
    Hinglish: "Contractor (ठेकेदार)"
  },
  "Supplier (कच्चा माल सप्लायर)": {
    Hindi: "कच्चा माल सप्लायर (Supplier)",
    English: "Material Supplier",
    Hinglish: "Supplier (सप्लायर)"
  },
  "Individual (फुटकर खरीदार)": {
    Hindi: "फुटकर खरीदार (Individual)",
    English: "Retail Buyer (Individual)",
    Hinglish: "Individual (खरीदार)"
  },
  "काम की डेडलाइन (Delivery Deadline)": {
    Hindi: "काम की डेडलाइन",
    English: "Project Delivery Deadline",
    Hinglish: "काम की डेडलाइन (Deadline)"
  },
  "रेफरेंस/ग्राहक का स्रोत (Client Source)": {
    Hindi: "रेफरेंस/ग्राहक का स्रोत",
    English: "Client Lead Reference Source",
    Hinglish: "रेफरेंस (Client Source)"
  },
  "उदा. JustDial, फेसबुक, सुधीर ठेकेदार": {
    Hindi: "उदा. JustDial, फेसबुक, सुधीर ठेकेदार",
    English: "e.g. JustDial, Facebook, Sudhir Contractor",
    Hinglish: "e.g. JustDial, Facebook, Sudhir Contractor"
  },
  "शुरुआती बकाया (Opening Balance)": {
    Hindi: "शुरुआती बकाया राशि",
    English: "Opening Balance Outstanding",
    Hinglish: "शुरुआती बकाया (Opening Balance)"
  },
  "उदा. 4500 (यदि पैसे लेने हों)": {
    Hindi: "उदा. 4500 (यदि पैसे लेने हों)",
    English: "e.g. 4500 (if payment is due)",
    Hinglish: "e.g. 4500"
  },
  "ग्राहक का मुख्य पता (Full Address)": {
    Hindi: "ग्राहक का मुख्य पता",
    English: "Client Address Profile",
    Hinglish: "ग्राहक का पता (Full Address)"
  },
  "उदा. जी टी रोड, अलीगढ़, उत्तर प्रदेश": {
    Hindi: "उदा. जी टी रोड, अलीगढ़, उत्तर प्रदेश",
    English: "e.g. GT Road, Aligarh, UP (India)",
    Hinglish: "e.g. GT Road, Aligarh, UP"
  },
  "ग्राहक टिप्पणी / विशेष निर्देश (Detailed Notes)": {
    Hindi: "ग्राहक टिप्पणी / विशेष निर्देश",
    English: "Instructions, Notes & Specifications",
    Hinglish: "ग्राहक टिप्पणी (Detailed Notes)"
  },
  "उदा. स्टील सेफ्टी गेट का काम है। 12mm सरिया इस्तेमाल होगा।": {
    Hindi: "उदा. स्टील सेफ्टी गेट का काम है। 12mm सरिया इस्तेमाल होगा।",
    English: "e.g. Steel safety gate work using 12mm rod.",
    Hinglish: "e.g. Steel safety gate work. 12mm rod."
  },
  "खाता खोलें और सहेजें (Save Register)": {
    Hindi: "खाता खोलें और सहेजें",
    English: "Create Client Account (Save)",
    Hinglish: "खाता खोलें और सहेजें (Save Register)"
  },
  "ग्राहक का प्रकार (Client Type)": {
    Hindi: "ग्राहक का प्रकार",
    English: "Client Segment Category",
    Hinglish: "ग्राहक का प्रकार (Client Type)"
  },
  "ग्राहक खाता बुक (My Clients)": {
    Hindi: "ग्राहक खाता बही",
    English: "Client Ledger (My Clients)",
    Hinglish: "ग्राहक खाता बुक (My Clients)"
  },
  "कोई ग्राहक नहीं मिला। कृपया ऊपर दिए गए सर्च या फ़िल्टर को बदलें।": {
    Hindi: "कोई ग्राहक नहीं मिला। कृपया ऊपर दिए गए सर्च या फ़िल्टर को बदलें।",
    English: "No clients found. Please adjust the search or filter above.",
    Hinglish: "कोई ग्राहक नहीं मिला (No clients found). कृपया सर्च या फ़िल्टर बदलें।"
  },
  "कोई बिलिंग नहीं (No Logs)": {
    Hindi: "कोई बिलिंग नहीं",
    English: "No Billing Logs",
    Hinglish: "कोई बिलिंग नहीं (No Logs)"
  },
  "सर्च की जाँच करें या एक नया ग्राहक खाता खोलने के लिए नीचे दिए गए प्लस (+) बटन पर टैप करें।": {
    Hindi: "सर्च की जाँच करें या एक नया ग्राहक खाता खोलने के लिए नीचे दिए गए प्लस (+) बटन पर टैप करें।",
    English: "Check your search or tap the plus (+) button below to create a new client account.",
    Hinglish: "सर्च बदलें या नया ग्राहक (New Client) खाता खोलने के लिए नीचे प्लस (+) बटन दबाएं।"
  },
  "उधार का हिसाब रखने और पक्का बिल प्रिंट करने के लिए \"नया जोड़ें\" बटन पर क्लिक करें।": {
    Hindi: "उधार का हिसाब रखने और पक्का बिल प्रिंट करने के लिए \"नया जोड़ें\" बटन पर क्लिक करें।",
    English: "Click \"Add New\" to keep track of outstanding dues and print invoices.",
    Hinglish: "उधार का हिसाब रखने और पक्का बिल (Invoice) प्रिंट करने के लिए \"नया जोड़ें\" बटन दबाएं।"
  },
  "उद्धरण या एस्टीमेट रसीद बनाने के लिए \"नया जोड़ें\" बटन पर क्लिक करें।": {
    Hindi: "उद्धरण या एस्टीमेट रसीद बनाने के लिए \"नया जोड़ें\" बटन पर क्लिक करें।",
    English: "Click \"Add New\" to create a quotation or project estimate receipt.",
    Hinglish: "Quotation या एस्टीमेट रसीद बनाने के लिए \"नया जोड़ें\" बटन पर क्लिक करें।"
  },

  // Invoices & Estimates
  "दिए गए मापदंडों के अनुसार कोई इनवॉइस नहीं मिला। कृपया फ़िल्टर बदलें या ऊपर बटन पर क्लिक करके नया पक्का बिल बनाएँ।": {
    Hindi: "दिए गए मापदंडों के अनुसार कोई इनवॉइस नहीं मिला। कृपया फ़िल्टर बदलें या ऊपर बटन पर क्लिक करके नया पक्का बिल बनाएँ।",
    English: "No invoices found matching your filters. Please change filters or click the button above to create a new invoice.",
    Hinglish: "कोई इनवॉइस नहीं मिला (No Invoices). कृपया फ़िल्टर बदलें या ऊपर बटन दबाकर नया पक्का बिल बनाएं।"
  },
  "ग्राहकों को नया कोटेशन जारी करें और सीधे पक्के बिल में बदलें।": {
    Hindi: "ग्राहकों को नया कोटेशन जारी करें और सीधे पक्के बिल में बदलें।",
    English: "Issue a new quotation to clients and easily convert it to a formal GST invoice with one tap.",
    Hinglish: "ग्राहकों को नया कोटेशन (Quotation) जारी करें और सीधे पक्के बिल (Invoice) में बदलें।"
  },
  "सर्च फ़िल्टर बदलें या नया एस्टीमेट जारी करने के लिए ऊपर \"+ नया एस्टीमेट बनाएँ\" पर क्लिक करें।": {
    Hindi: "सर्च फ़िल्टर बदलें या नया एस्टीमेट जारी करने के लिए ऊपर \"+ नया एस्टीमेट बनाएँ\" पर क्लिक करें।",
    English: "Adjust your search filters or click the \"+ Create New Estimate\" button above to issue a new quotation.",
    Hinglish: "सर्च फ़िल्टर बदलें या नया एस्टीमेट (New Estimate) जारी करने के लिए ऊपर बटन पर क्लिक करें।"
  },
  "साल (₹1499)": {
    Hindi: "साल (₹1499)",
    English: "Yearly (₹1499)",
    Hinglish: "साल (Yearly / ₹1499)"
  },
  "Free Trial active. Cards may have watermark. Limit: 5 Client maximum.": {
    Hindi: "फ्री ट्रायल सक्रिय है। विज़िटिंग कार्ड पर वॉटरमार्क रहेगा। सीमा: अधिकतम 5 ग्राहक।",
    English: "Free Trial active. Cards may have watermark. Limit: 5 Client maximum.",
    Hinglish: "Free Trial active. Cards may have watermark. Limit: 5 Client maximum."
  },
  "Upgrade Now": {
    Hindi: "अभी अपग्रेड करें",
    English: "Upgrade Now",
    Hinglish: "अभी अपग्रेड करें (Upgrade Now)"
  },

  // Labour Attendance Screen descriptions
  "सक्रिय कारीगरों का विवरण और उनकी दैनिक हाज़िरी डायरी।": {
    Hindi: "सक्रिय कारीगरों का विवरण और उनकी दैनिक हाज़िरी डायरी।",
    English: "Active worker directory and daily attendance diary planner.",
    Hinglish: "सक्रिय कारीगरों का विवरण (Workers Directory) और उनकी दैनिक हाज़िरी डायरी।"
  },
  "कारीगरों की सैलरी, चुकाई गई एडवांस रकम और पेंडिंग हिसाब।": {
    Hindi: "कारीगरों की सैलरी, चुकाई गई एडवांस रकम और पेंडिंग हिसाब।",
    English: "Track worker salaries, advance payouts, and outstanding pay balances.",
    Hinglish: "कारीगरों की सैलरी (Worker Salaries), चुकाई गई एडवांस रकम और पेंडिंग हिसाब।"
  },

  // Expenses & Recurring
  "नियमित मासिक/वार्षिक खर्चों का खाता": {
    Hindi: "नियमित मासिक/वार्षिक खर्चों का खाता",
    English: "Ledger for recurring monthly or yearly subscription expenses.",
    Hinglish: "नियमित मासिक/वार्षिक (Recurring) खर्चों का सुरक्षा खाता"
  },
  "नया दैनिक खर्च्चा बही में जोड़ लिया गया है!": {
    Hindi: "नया दैनिक खर्च्चा बही में जोड़ लिया गया है!",
    English: "New operational expense added to the ledger successfully!",
    Hinglish: "नया दैनिक खर्च्चा (Expense) बही में सफलतापूर्वक जोड़ लिया गया है!"
  },

  // Newly requested translations / Common UI labels
  "प्रीमियम विज़िटिंग कार्ड स्टूडियो (Premium Visiting Card Maker)": {
    Hindi: "प्रीमियम विज़िटिंग कार्ड स्टूडियो",
    English: "Premium Visiting Card Maker",
    Hinglish: "प्रीमियम विज़िटिंग कार्ड स्टूडियो (Card Maker)"
  },
  "अपने व्यापार के लिए आधुनिक डिजिटल विज़िटिंग कार्ड डिज़ाइन करें। अलग-अलग सोशल मीडिया साइज में उच्च गुणवत्ता (PNG) डाउनलोड करें।": {
    Hindi: "अपने व्यापार के लिए आधुनिक डिजिटल विज़िटिंग कार्ड डिज़ाइन करें और उच्च गुणवत्ता में डाउनलोड करें।",
    English: "Design a modern digital visiting card for your business. Download in high quality PNG format.",
    Hinglish: "अपने व्यापार के लिए आधुनिक डिजिटल विज़िटिंग कार्ड (Digital Card) डिज़ाइन करें। उच्च गुणवत्ता (PNG) डाउनलोड करें।"
  },
  "लाइव कार्ड मॉकअप (Mockup Preview)": {
    Hindi: "लाइव कार्ड मॉकअप",
    English: "Live Card Mockup",
    Hinglish: "लाइव कार्ड मॉकअप (Mockup Preview)"
  },
  "डिज़ाइन थीम चुनें (Select Template Preset)": {
    Hindi: "डिज़ाइन थीम चुनें",
    English: "Select Design Template",
    Hinglish: "डिज़ाइन थीम चुनें (Select Template Preset)"
  },
  "कर एवं पक्के बिल (Tax Invoices Ledger)": {
    Hindi: "कर एवं पक्के बिल",
    English: "Tax Invoices Ledger",
    Hinglish: "कर एवं पक्के बिल (Tax Invoices Ledger)"
  },
  "नया इनवॉइस बनाएँ (Create Invoice)": {
    Hindi: "नया इनवॉइस बनाएँ",
    English: "Create New Invoice",
    Hinglish: "नया इनवॉइस बनाएँ (Create Invoice)"
  },
  "इनवॉइस फ़िल्टर एवं खोज उपकरण (Filter & Sort Desk)": {
    Hindi: "इनवॉइस फ़िल्टर एवं खोज उपकरण",
    English: "Invoice Filter & Sort Settings",
    Hinglish: "इनवॉइस फ़िल्टर एवं खोज उपकरण (Filter & Sort Desk)"
  },
  "सभी भुगतान श्रेणियाँ (All Statuses)": {
    Hindi: "सभी भुगतान श्रेणियाँ",
    English: "All Payment Statuses",
    Hinglish: "सभी भुगतान श्रेणियाँ (All Statuses)"
  },
  "सभी टैक्स प्रकार (All Bil types)": {
    Hindi: "सभी टैक्स प्रकार",
    English: "All Invoice/Tax Types",
    Hinglish: "सभी टैक्स प्रकार (All Bill types)"
  },
  "जीएसटी इनवॉइस / पक्का बिल सुरक्षित सहेज लिया गया!": {
    Hindi: "जीएसटी इनवॉइस / पक्का बिल सुरक्षित सहेज लिया गया!",
    English: "GST Invoice saved successfully!",
    Hinglish: "GST इनवॉइस / पक्का बिल सुरक्षित सहेज लिया गया!"
  },
  "इनवॉइस सफलतापूर्वक अपडेट हो चूका है!": {
    Hindi: "इनवॉइस सफलतापूर्वक अपडेट हो चुका है!",
    English: "Invoice updated successfully!",
    Hinglish: "इनवॉइस सफलतापूर्वक अपडेट हो चुका है!"
  },
  "प्रोफाइल डेटा सफलता पूर्वक अपडेट हो गया!": {
    Hindi: "प्रोफाइल डेटा सफलता पूर्वक अपडेट हो गया!",
    English: "Profile details updated successfully!",
    Hinglish: "प्रोफाइल डेटा सफलता पूर्वक अपडेट हो गया!"
  },
  "हाज़िरी सिंक हो गयी!": {
    Hindi: "हाज़िरी सिंक हो गयी!",
    English: "Attendance synced successfully!",
    Hinglish: "हाज़िरी सिंक हो गयी!"
  },
  "हाज़िरी लगाने के लिए कोई कारीगर नहीं है!": {
    Hindi: "हाज़िरी लगाने के लिए कोई कारीगर नहीं है!",
    English: "No workers available to mark attendance!",
    Hinglish: "हाज़िरी लगाने के लिए कोई कारीगर नहीं है!"
  },
  "हाजिरी भरें": {
    Hindi: "हाजिरी भरें",
    English: "Mark Attendance",
    Hinglish: "हाजिरी भरें (Mark Attendance)"
  },
  "व्यापार का हिसाब-किताब": {
    Hindi: "व्यापार का हिसाब-किताब",
    English: "Business Ledger Book",
    Hinglish: "व्यापार का हिसाब-किताब (Business Ledger)"
  },
  "⚠️ वसूली बाकी है!": {
    Hindi: "⚠️ वसूली बाकी है!",
    English: "⚠️ Outstanding Dues!",
    Hinglish: "⚠️ वसूली बाकी है! (Dues Pending)"
  },
  "वसूली बाकी है!": {
    Hindi: "वसूली बाकी है!",
    English: "Outstanding Dues!",
    Hinglish: "वसूली बाकी है! (Dues Pending)"
  },
  "कोई बकाया भुगतान नहीं है।": {
    Hindi: "कोई बकाया भुगतान नहीं है।",
    English: "No outstanding payments.",
    Hinglish: "कोई बकाया भुगतान नहीं है (No outstandings)."
  },
  "इस महीने आई कुल नगदी": {
    Hindi: "इस महीने आई कुल नगदी",
    English: "Total Cash Received This Month",
    Hinglish: "इस महीने आई कुल नगदी (Total Cash)"
  },
  "सारे ग्राहक खता सूची": {
    Hindi: "सारे ग्राहक खता सूची",
    English: "All Client Ledger Accounts",
    Hinglish: "सारे ग्राहक खता सूची (All Clients)"
  },
  "अधूरी/बाकी पेमेंट की संख्या": {
    Hindi: "अधूरी/बाकी पेमेंट की संख्या",
    English: "Total Outstanding Invoice Count",
    Hinglish: "अधूरी/बाकी पेमेंट की संख्या (Pending Bills)"
  },
  "क्लाउड डेटा एक्टिव (Supabase Live)": {
    Hindi: "क्लाउड डेटा एक्टिव (Supabase Live)",
    English: "Cloud Sync Active (Supabase Live)",
    Hinglish: "क्लाउड डेटा एक्टिव (Supabase Live)"
  },
  "ऑफ़लाइन डेटा (Local Khata Only)": {
    Hindi: "ऑफ़लाइन डेटा (Local Khata Only)",
    English: "Offline Data (Local Khata Only)",
    Hinglish: "ऑफ़लाइन डेटा (Local Khata Only)"
  }
};

// Precomputed reverse translation maps for absolute language symmetry
const REVERSE_ENGLISH_MAP: Record<string, Record<'Hindi' | 'English' | 'Hinglish', string>> = {};
const REVERSE_HINDI_MAP: Record<string, Record<'Hindi' | 'English' | 'Hinglish', string>> = {};
const REVERSE_HINGLISH_MAP: Record<string, Record<'Hindi' | 'English' | 'Hinglish', string>> = {};

Object.entries(TRANSLATION_DICTIONARY).forEach(([key, langs]) => {
  if (langs?.English) {
    REVERSE_ENGLISH_MAP[langs.English.trim().toLowerCase()] = langs;
  }
  if (langs?.Hindi) {
    REVERSE_HINDI_MAP[langs.Hindi.trim().toLowerCase()] = langs;
  }
  if (langs?.Hinglish) {
    REVERSE_HINGLISH_MAP[langs.Hinglish.trim().toLowerCase()] = langs;
  }
});

const HINDI_TO_ENGLISH_VOCAB: Record<string, string> = {
  "नया": "New",
  "बाकी": "Outstanding",
  "रिपोर्ट": "Report",
  "शेयर": "Share",
  "डैशबोर्ड": "Dashboard",
  "ग्राहक": "Client",
  "ग्राहक खाता": "Client Accounts",
  "एस्टीमेट": "Quotation",
  "पक्का बिल": "Invoice",
  "प्राइवेट बचत": "Estimate Margin",
  "हाज़िरी": "Attendance",
  "हाज़िरी रजिस्टर": "Labour Attendance",
  "कमार्इ-खर्चा": "Expense Book",
  "डिजिटल कार्ड": "Visiting Card",
  "स्टॉक माल": "Inventory",
  "सेटिंग्स": "Settings",
  "प्रोफाइल": "Profile",
  "सेटिंग्स और प्रोफाइल": "Settings",
  "लॉगआउट": "Log Out",
  "अधिक": "More",
  "जोड़ें": "Add",
  "हस्ताक्षर": "Signature",
  "बकाया": "Outstanding Due",
  "बकाया बैलेंस": "Outstanding Balance Dues",
  "खर्च": "Expense",
  "खर्चे": "Expenses",
  "सैलरी": "Salary",
  "वेतन": "Salaries",
  "मजदूरी": "Labour charges",
  "दाम": "Rate",
  "मात्रा": "Quantity",
  "विवरण": "Description",
  "कर": "GST",
  "कुल": "Total",
  "योग": "Sum",
  "बचत": "Margin/Profit",
  "डिजिटल विज़िटिंग कार्ड": "Digital Visiting Card",
  "दैनिक हाजिरी": "Daily Attendance",
  "मासिक कैलेंडर": "Monthly Calendar",
  "वेतन भुगतान": "Salary Payment",
  "सक्रिय कारीगर": "Active Workers",
  "प्रबंधक": "Manager",
  "नया कारीगर": "New Worker",
  "सर्च": "Search",
  "विवरण एवं दाम": "Details & Rates",
  "दुकान": "Shop",
  "बही खाता": "Ledger Book",
  "पक्का बिल / इनवॉइस": "Tax Invoice",
  "इनवॉइस": "Invoice",
  "कोटेशन प्रपत्र": "Quotation / Estimate Form",
  "हस्ताक्षर और मुहर": "Authorized Signatory",
  "प्रोफाइल डेटा से लाइव ऑटो-फिल हो गया है!": "Live auto-filled from profile!",
  "डिजिटल विज़िटिंग कार्ड डिज़ाइन थीम चुनें (Select Template Preset)": "Select digital visiting card design template",
  "नया दैनिक खर्च्चा बही में जोड़ लिया गया है": "New direct expense recorded successfully!",
  "खर्चा और मुनाफ़ा रजिस्टर": "Expense & Profit Register",
  "सभी प्रत्यक्ष खर्चे, किराया/मशीनें/बिजली के बँधे मासिक खर्चे लिखें, और नेट मुनाफ़े (P&L) का विश्लेषण करें।": "Write all direct expenses, rent/machinery/electricity monthly expenses, and analyze net profit & loss.",
  "क्लाउड डेटाबेस सक्रिय (Sync Active)": "Cloud database sync active",
  "लोकल मोड सक्रिय (Local Offline Book)": "Local offline ledger book active",
  "📅 हाज़िरी कैलेंडर": "📅 Attendance Calendar",
  "👷 कारीगर प्रबंधक": "👷 Manage Workers",
  "💰 हिसाब और सैलरी": "💰 Payroll & Salary",
  "लेबर और हाज़िरी रजिस्टर (Labour Roster Suite)": "Labour & Attendance Register",
  "लेबर और हाज़िरी रजिस्टर": "Labour & Attendance Register",
  "प्रणाली एवं भाषा प्राथमिकता (System & Language Settings)": "System & Language Settings",
  "एप्लीकेशन की डिफ़ॉल्ट भाषा (In-app Preferred language)": "In-app Preferred Language",
  "यह सेटिंग आपके इनवॉइस जनरेटर, खतौनी और रसीद स्क्रीन के हिंदी/इंग्लिश अनुवाद को प्रभावित करेगी।": "This setting globally updates translations across invoices, ledgers, and setting screens."
};

const ENGLISH_TO_HINDI_VOCAB: Record<string, string> = {
  "New": "नया",
  "Outstanding": "बाकी",
  "Report": "रिपोर्ट",
  "Share": "शेयर",
  "Dashboard": "डैशबोर्ड",
  "Clients": "ग्राहक",
  "Client Accounts": "ग्राहक खाता",
  "Quotations": "एस्टीमेट",
  "Invoice": "पक्का बिल",
  "Invoices": "पक्के बिल",
  "Estimate Margin": "प्राइवेट बचत",
  "Attendance": "हाज़िरी",
  "Labour Attendance": "हाज़िरी रजिस्टर",
  "Expense Book": "कमार्इ-खर्चा",
  "Visiting Card": "डिजिटल कार्ड",
  "Inventory": "स्टॉक माल",
  "Settings": "सेटिंग्स",
  "Profile": "प्रोफाइल",
  "Log Out": "लॉगआउट",
  "More": "अधिक",
  "Add": "जोड़ें",
  "Signature": "हस्ताक्षर",
  "Outstanding Due": "बकाया",
  "Salaries": "वेतन",
  "Labour charges": "मजदूरी",
  "Description": "विवरण",
  "GST": "कर",
  "Total": "कुल",
  "Search": "सर्च",
  "Tax Invoice": "पक्का बिल / इनवॉइस"
};

/**
 * Universal translation function
 */
/**
 * Greedy sub-phrase translator for fallback translation of mixed Hindi/English text nodes
 */
export const translateHindiToEnglishGreedy = (text: string): string => {
  let result = text;
  
  // 1. Compile all possible Hindi -> English translation pairs
  const pairs: { hindi: string; english: string }[] = [];
  
  // Add entries from HINDI_TO_ENGLISH_VOCAB
  for (const [hindi, english] of Object.entries(HINDI_TO_ENGLISH_VOCAB)) {
    pairs.push({ hindi, english });
  }
  
  // Add entries from TRANSLATION_DICTIONARY
  for (const [key, langs] of Object.entries(TRANSLATION_DICTIONARY)) {
    if (HINDI_RANGE_REGEX.test(key) && langs.English) {
      pairs.push({ hindi: key, english: langs.English });
    }
    if (HINDI_RANGE_REGEX.test(langs.Hindi) && langs.English) {
      pairs.push({ hindi: langs.Hindi, english: langs.English });
    }
  }

  // Add explicit common UI phrases identified in Settings, Labour, Expenses, etc.
  const customPairs = [
    { hindi: "व्यापार का हिसाब-किताब", english: "Business Ledger Book" },
    { hindi: "⚠️ वसूली बाकी है!", english: "⚠️ Outstanding Dues!" },
    { hindi: "वसूली बाकी है!", english: "Outstanding Dues!" },
    { hindi: "कोई बकाया भुगतान नहीं है।", english: "No outstanding payments." },
    { hindi: "इस महीने आई कुल नगदी", english: "Total Cash Received This Month" },
    { hindi: "सारे ग्राहक खता सूची", english: "All Client Ledger Accounts" },
    { hindi: "अधूरी/बाकी पेमेंट की संख्या", english: "Total Outstanding Invoice Count" },
    { hindi: "क्लाउड डेटा एक्टिव (Supabase Live)", english: "Cloud Sync Active (Supabase Live)" },
    { hindi: "ऑफ़लाइन डेटा (Local Khata Only)", english: "Offline Data (Local Khata Only)" },
    { hindi: "व्यापारिक प्रोफाइल", english: "Business Profile" },
    { hindi: "प्लान एवं लिमिट", english: "Plans & Limits" },
    { hindi: "सेफ्टी लॉक पिन", english: "Security Lock PIN" },
    { hindi: "नियम और सेटिंग्स", english: "Settings & Options" },
    { hindi: "अपनी दुकान के विज्ञापनों, बैंक खाता, लोगो, भाषा चयन, पिन सिक्योरिटी और प्लान को नियंत्रित करें।", english: "Manage your storefront, business profiles, bank accounts, languages, security PINs, and active subscriptions." },
    { hindi: "प्राइवेट खतौनी सेफ्टी पिन", english: "Private Margin Ledger PIN" },
    { hindi: "अपना \"प्राइवेट बचत (Estimate Margin)\" सुरक्षा लॉक बदलने के लिए नीचे फॉर्म भरें।", english: "Fill out the form below to change your private margin ledger security PIN." },
    { hindi: "पुराना पिन", english: "Current PIN" },
    { hindi: "नया सुरक्षा पिन", english: "New 4-digit PIN" },
    { hindi: "नया पिन दुबारा लिखे", english: "Confirm PIN" },
    { hindi: "सेफ्टी पिन अपडेट करें", english: "Update Security PIN" },
    { hindi: "यह पिन कहाँ उपयोग होता है?", english: "Where is this PIN used?" },
    { hindi: "जब आप \"प्राइवेट बचत (Estimate Margin)\" की प्राइवेट बही खोलते हैं, तब यह सेफ्टी पिन मागा जाता है ताकि आपकी अनुपस्थिति में कोई भी कर्मचारी आपकी वास्तविक बचत या मुनाफा न देख सके।", english: "This PIN is required when opening the Private Margin Ledger so that employees cannot access your actual business profits and margins in your absence." },
    { hindi: "डिफ़ॉल्ट आरंभिक पिन:", english: "Default PIN:" },
    { hindi: "मजदूरों और खर्चों का पक्का हिसाब।", english: "Seamless management of labor, expenses, and invoices." },
    { hindi: "रजिस्ट्रेशन एंड प्रोफाइल सेटअप", english: "Registration & Profile Setup" },
    { hindi: "मालिक का नाम", english: "Owner Name" },
    { hindi: "अपना शुभ नाम डालें", english: "Enter your full name" },
    { hindi: "पासवर्ड", english: "Password" },
    { hindi: "अंक या अक्षर", english: "Alpha-numeric" },
    { hindi: "ईमेल", english: "Email" },
    { hindi: "मोबाइल नंबर", english: "Mobile No." },
    { hindi: "फर्म/दुकान का नाम", english: "Business/Firm Name" },
    { hindi: "वैकल्पिक GST संख्या", english: "Optional GSTIN" },
    { hindi: "व्यापार का प्रकार", english: "Business Type" },
    { hindi: "भाषा का माध्यम", english: "In-app Language" },
    { hindi: "रजिस्ट्रेशन प्रगति पर है...", english: "Registering account..." },
    { hindi: "अकाउंट बनाएं", english: "Create Free Account" },
    { hindi: "पहले से ही खाता है?", english: "Already have an account?" },
    { hindi: "यहाँ लॉगइन करें", english: "Sign In here" },
    { hindi: "डेमो शुरू करें", english: "Explore Demo (Instant)" },
    { hindi: "अथवा", english: "OR" },
    { hindi: "अपना ईमेल डालें", english: "Enter your email" },
    { hindi: "लॉगइन करें", english: "Sign In" },
    { hindi: "GOOGLE के साथ लॉगइन करें", english: "SIGN IN WITH GOOGLE" },
    { hindi: "नया खाता चाहिए?", english: "Need a new account?" },
    { hindi: "यहाँ नया अकाउंट बनाएं", english: "Register a new account here" },
    { hindi: "लेबर और हाज़िरी रजिस्टर", english: "Labour Attendance Register" },
    { hindi: "दैनिक हाजिरी लगाएं, मासिक कैलेंडर देखें और वेतन (हिसाब-किताब) व्यवस्थित करें।", english: "Mark daily attendance, view monthly calendar journals, and manage payroll wages." },
    { hindi: "हाज़िरी कैलेंडर", english: "Attendance Calendar" },
    { hindi: "कारीगर प्रबंधक", english: "Manage Workers" },
    { hindi: "हिसाब और सैलरी", english: "Payroll Wage Ledger" },
    { hindi: "कारीगर जोड़ने में समस्या आयी!", english: "Error occurred while adding worker!" },
    { hindi: "को register में जोड़ लिया गया है!", english: "has been added to the register!" },
    { hindi: "कारीगर register से सफलतापूर्वक हटा दिया गया!", english: "Worker successfully deleted from register!" },
    { hindi: "हाज़िरी सिंक हो गयी!", english: "Attendance ledger synced successfully!" },
    { hindi: "हाज़िरी सिंक करने में गड़बड़ हुई!", english: "Attendance sync failed!" },
    { hindi: "लोकल हाज़िरी अपडेट हो गयी है!", english: "Local attendance updated successfully!" },
    { hindi: "सबकी हाज़िरी लगाने में कोई त्रुटि हुई!", english: "Failed to mark attendance for all!" },
    { hindi: "वेतन भुगतान क्लाउड बहीखाते में सहेजा गया!", english: "Payment successfully saved to cloud!" },
    { hindi: "वेतन भुगतान दर्ज करने में गड़बड़ हुई!", english: "Failed to register salary payout!" },
    { hindi: "भुगतान लोकल ट्रांजेक्शन बुक में लिख दिया गया है!", english: "Salary checkout logged to local transactional book!" },
    { hindi: "पेंडिंग हाज़िरी सहेजें", english: "Save Pending Attendance" },
    { hindi: "सबकी हाज़िरी लगाएं", english: "Mark All Present" },
    { hindi: "नया कारीगर जोड़ें", english: "Register New Worker" },
    { hindi: "कारीगर का नाम", english: "Worker Name" },
    { hindi: "दैनिक मजदूरी दर", english: "Daily Wage Rate" },
    { hindi: "कारीगर का काम / श्रेणी", english: "Worker Category / Designation" },
    { hindi: "कारीगर का फोन", english: "Worker Phone" },
    { hindi: "कारीगर का पता", english: "Worker Address" },
    { hindi: "रद्द करें", english: "Cancel" },
    { hindi: "सेव करें", english: "Save" },
    { hindi: "कोई कारीगर पंजीकृत नहीं है", english: "No workers registered yet" },
    { hindi: "कारीगर और वेतन का विवरण", english: "Worker payroll breakdown" },
    { hindi: "एडवांस भुगतान करें / सैलरी चुकाएं", english: "Pay Salary Checkout Detail" },
    { hindi: "भुगतान प्रकार", english: "Payment Type" },
    { hindi: "सैलरी भुगतान", english: "Salary Wage Checkout" },
    { hindi: "अग्रिम पेशगी भुगतान", english: "Advance Issued" },
    { hindi: "भुगतान राशि", english: "Checkout Amount" },
    { hindi: "भुगतान करने का माध्यम", english: "Transaction Channel" },
    { hindi: "विवरण / नोट", english: "Transaction Description" },
    { hindi: "सामग्री / माल ख़रीद", english: "Raw Inventory / Material Purchases" },
    { hindi: "मशीन किराया & डीजल", english: "Rentals & Fuel Expenses" },
    { hindi: "चाय-पानी & भोजन", english: "Staff Meals & Hospitality" },
    { hindi: "किराया / बिजली बिल", english: "Office Rent & Utilitarian Bills" },
    { hindi: "लोकल ट्रांसपोर्ट / भाड़ा", english: "Local Logistic & Freight Rates" },
    { hindi: "विवरण / बिल रसीद सं.", english: "Transaction Details / Bill Slips" },
    { hindi: "नया बँधा मासिक खर्चा", english: "Register Monthly Fixed Bills" },
    { hindi: "खर्चे / मद का नाम", english: "Monthly Fixed Item Label" },
    { hindi: "मासिक देय रकम", english: "Monthly Bill Amount" },
    { hindi: "देय तारीख", english: "Billing Due Day" },
    { hindi: "खर्चे की श्रेणी", english: "Fixed Expenditure Category" },
    { hindi: "दुकान किराया", english: "Shop / Yard Lease" },
    { hindi: "बिजली/पानी", english: "Water / Electric Grid Bill" },
    { hindi: "मशीनें ईएमआई", english: "Equipment EMI payments" },
    { hindi: "कर्मचारी वेतन", english: "Staff Fixed Salary Roll" },
    { hindi: "सॉफ्टवेयर / अन्य", english: "Digital Softwares / Miscellaneous" },
    { hindi: "प्रीमियम विज़िटिंग कार्ड स्टूडियो", english: "Premium Visiting Card Design Studio" },
    { hindi: "अपने व्यापार के लिए आधुनिक डिजिटल विज़िटिंग कार्ड डिज़ाइन करें। अलग-अलग सोशल मीडिया साइज में उच्च गुणवत्ता (PNG) डाउनलोड करें।", english: "Design beautiful and professional digital business cards. Save and download high-resolution PNG images for social media platforms." },
    { hindi: "डिज़ाइन थीम चुनें", english: "Select Premium Design Presets" },
    { hindi: "लाइव कार्ड मॉकअप", english: "Real-Time Card Previews" },
    { hindi: "थीम चुनी गयी!", english: "design theme chosen!" },
    { hindi: "कार्ड पर आपका शुभ नाम", english: "Owner Name Label" },
    { hindi: "व्यवसाय / दुकान का नाम", english: "Registered Shop / Firm Name" },
    { hindi: "व्यापार का नारा / टैगलाइन", english: "Corporate Slogan / Tagline" },
    { hindi: "व्हाट्सएप नंबर", english: "WhatsApp Channel Number" },
    { hindi: "व्यावसायिक ईमेल", english: "Professional Business Email" },
    { hindi: "दुकान / स्टोर का पता", english: "Physical Store Address" },
    { hindi: "पसंदीदा सर्विसेज़", english: "Core Professional Services" },
    { hindi: "सेवा 1", english: "Service 1" },
    { hindi: "सेवा 2", english: "Service 2" },
    { hindi: "सेवा 3", english: "Service 3" },
    { hindi: "सेवा 4", english: "Service 4" },
    { hindi: "उच्च गुणवत्ता (PNG) तस्वीर डाउनलोड करें", english: "Download High-Res PNG Visual" },
    { hindi: "व्हाट्सएप पर शेयर करें", english: "Instant Share via WhatsApp" },
    { hindi: "कच्चे बिल का बही खाता", english: "Offline Quotations Register" },
    { hindi: "कोटेशन एवं एस्टीमेट मेकर", english: "Corporate Quotations & Estimates Maker" },
    { hindi: "अनुमानित सक्रिय एस्टीमेट", english: "Active Project Estimates" },
    { hindi: "अनुमानित कुल शेष मूल्य", english: "Active Quote Portfolio Value" },
    { hindi: "पक्के बिल में कन्वर्टेड मूल्य", english: "Total Value Converted to Invoices" },
    { hindi: "ग्राहक का नाम या एस्टीमेट सं. (#) यहाँ खोजें...", english: "Search by client name or quotation number (#)..." },
    { hindi: "सभी श्रेणियां", english: "All Project Categories" },
    { hindi: "विद्युत विद्युत कार्य", english: "Electrical Scope of Works" },
    { hindi: "नलसाजी कार्य", english: "Plumbing & Sanitation Works" },
    { hindi: "भवन निर्माण", english: "Civil Construction works" },
    { hindi: "पुताई / पेंटिंग", english: "Painting & Wood Finishing" },
    { hindi: "सजावट", english: "Interior and Architecture work" },
    { hindi: "सामान्य कार्य", english: "Custom Contractor Work" },
    { hindi: "कोई एस्टीमेट नहीं मिला", english: "No quotations or project estimates found" },
    { hindi: "सर्च फ़िल्टर बदलें या नया एस्टीमेट जारी करने के लिए ऊपर \"+ नया एस्टीमेट बनाएँ\" पर क्लिक करें।", english: "Reset filters or click \"+ Create New\" above to draft a project estimate." },
    { hindi: "डेटा सिंक प्रगति पर है...", english: "Connecting and syncing cloud registers..." },
    { hindi: "एस्टीमेट बही", english: "Project Estimate" },
    { hindi: "कच्चे बिल", english: "Pro-forma Estimates" },
    { hindi: "पक्के बिल", english: "Invoices" },
    { hindi: "पक्का बिल", english: "Tax Invoice" },
    { hindi: "ग्राहक बही", english: "Client Ledger" },
    { hindi: "बही खाता", english: "Ledger Book" },
    { hindi: "ग्राहक विवरण टिप्पणी", english: "General Client Notes" },
    { hindi: "ग्राहक रेफरेंस", english: "Lead Generation Source" },
    { hindi: "अपडेट सेव करें", english: "Save Changes" },
    { hindi: "पूरी तरह हटाएँ", english: "Delete Account Permanent" },
    { hindi: "एडिट करें", english: "Edit Details" },
    { hindi: "प्रस्तावित सामग्री / कार्य", english: "Proposed Project Items" },
    { hindi: "हम आपके साथ काम करने के लिए उत्सुक हैं!", english: "Looking forward to building this project together!" },
    { hindi: "कार्य श्रेणी", english: "Project Scope Category" },
    { hindi: "कुल सामग्रियां", english: "Materials & Operations Count" },
    { hindi: "श्रेणी सामान", english: "Item Types Included" },
    { hindi: "प्राप्त एडवांस राशि", english: "Advance Deposits Received" },
    { hindi: "बकाया बैलेंस", english: "Outstanding Project Balance" },
    { hindi: "शीट प्रीव्यू", english: "Review Project Quote Sheet" },
    { hindi: "कुल बिकवाली योग", english: "Total Business Registered (Turnover)" },
    { hindi: "कुल इनवॉइस गिनती", english: "Total Invoices Filed (Count)" },
    { hindi: "तैयार ड्राफ्ट बिल", english: "Draft invoices" },
    { hindi: "इनवॉइस फ़िल्टर एवं खोज उपकरण", english: "Invoice Filtering & Organizing Hub" },
    { hindi: "सभी भुगतान श्रेणियाँ", english: "All Payment Classes" },
    { hindi: "सभी टैक्स प्रकार", english: "All Invoice Classifications" },
    { hindi: "कोई बिल नहीं मिला!", english: "No billing journals found!" },
    { hindi: "दिए गए मापदंडों के अनुसार कोई इनवॉइस नहीं मिला। कृपया फ़िल्टर बदलें या ऊपर बटन पर क्लिक करके नया पक्का बिल बनाएँ।", english: "No records found for current parameters. Tap the above button to generate/file a new invoice." },
    { hindi: "या ऊपर बटन पर क्लिक करके नया पक्का बिल बनाएँ।", english: "or click button above to create a new invoice." },
    { hindi: "बिल दिनांक", english: "Date Issued" },
    { hindi: "भुगतान तिथि", english: "Payment Deadline" },
    { hindi: "बिल कुल योग", english: "Grand Total Amount" },
    { hindi: "शेष ड्यू", english: "Outstanding Balance" },
    { hindi: "पक्का बिल देखें", english: "View & Print Invoice" },
    { hindi: "जमा करें", english: "Receive Payment" },
    { hindi: "क्रेता / ग्राहक", english: "Purchasing Client" },
    { hindi: "क्रेता / ग्राहक (Client)", english: "Purchasing Client (Client)" },
    { hindi: "बिल तिथि", english: "Billing Dates" },
    { hindi: "वित्तीय पत्रक", english: "Financial Highlights" },
    { hindi: "स्थिति", english: "Settlement Status" },
    { hindi: "कार्य", english: "Operations/Action" },
    { hindi: "स्टॉक माल", english: "Inventory Stock" },
    { hindi: "स्टॉक सूची", english: "Inventory List" },
    { hindi: "नया आइटम जोड़ें", english: "Add New Product" },
    { hindi: "स्टॉक इतिहास", english: "Stock Log Book" },
    { hindi: "न्यूनतम स्टॉक चेतावनी", english: "Low Stock Alert thresholds" },
    { hindi: "सामग्री का नाम", english: "Product Name" },
    { hindi: "कुल मात्रा", english: "Available Stock Quantity" },
    { hindi: "खरीद दर", english: "Buying Price Per Unit" },
    { hindi: "बिक्री दर", english: "Selling Price Per Unit" },
    { hindi: "सतर्कता सीमा", english: "Min Stock Alert level" },
    { hindi: "कारीगर", english: "Workers" },
    { hindi: "कुल बकाया वसूली", english: "Total Pending Receivable" },
    { hindi: "बकाया वसूली", english: "Pending Receivable" },
    { hindi: "सभी एंट्रीज फोन के लोकल बही खाता स्टोरेज में सुरक्षित हैं।", english: "All entries are securely saved in your phone's offline storage." },
    { hindi: "बही खाता लाइव क्लाउड डेटा से सिंक्रोनाइज्ड है।", english: "Your ledger is synchronized in real-time with the secure cloud database." },
    { hindi: "सक्रिय सूची", english: "Active List" },
    { hindi: "मजबूत व्यापार का मजबूत डिजिटल बही खाता।", english: "The highly secure and robust digital ledger for smart businesses." },
    { hindi: "नियम और सेटिंग्स", english: "Settings & Setup Hub" },
    { hindi: "अपनी दुकान के विज्ञापनों, बैंक खाता, लोगो, भाषा चयन, पिन सिक्योरिटी और प्लान को नियंत्रित करें।", english: "Manage shop details, advertisements, bank info, language preferences, PIN code safety, and membership plans." }
  ];

  for (const item of customPairs) {
    if (!pairs.some(p => p.hindi === item.hindi)) {
      pairs.push(item);
    }
  }

  // Remove exact duplicates to keep performance fast
  const seen = new Set<string>();
  const uniquePairs = pairs.filter(pair => {
    const key = pair.hindi;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort pairs by length descending so longest phrases match first
  uniquePairs.sort((a, b) => b.hindi.length - a.hindi.length);

  // Replace each Hindi phrase with its English counterpart
  for (const pair of uniquePairs) {
    if (!pair.hindi) continue;
    // Escape special regex characters in pair.hindi
    const escaped = pair.hindi.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    result = result.replace(regex, pair.english);
  }
  
  return result;
};

/**
 * Universal translation function
 */
export const translateText = (text: string, lang: 'Hindi' | 'English' | 'Hinglish'): string => {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);

  const cleanInput = text.trim();
  const cleanInputLower = cleanInput.toLowerCase();

  // 1. Direct dictionary check (first preference) and symmetric reverse checks
  if (TRANSLATION_DICTIONARY[cleanInput]) {
    return TRANSLATION_DICTIONARY[cleanInput][lang];
  }
  if (REVERSE_ENGLISH_MAP[cleanInputLower]) {
    return REVERSE_ENGLISH_MAP[cleanInputLower][lang];
  }
  if (REVERSE_HINDI_MAP[cleanInputLower]) {
    return REVERSE_HINDI_MAP[cleanInputLower][lang];
  }
  if (REVERSE_HINGLISH_MAP[cleanInputLower]) {
    return REVERSE_HINGLISH_MAP[cleanInputLower][lang];
  }

  // 2. Hinglish mode - returns original string containing both languages (ceiling limit)
  if (lang === 'Hinglish') {
    return text;
  }

  // 3. Extract emojis or icons at the start to ensure they are preserved cleanly
  const firstChar = cleanInput.charAt(0);
  const isEmoji = firstChar && (
    (firstChar >= '\u2100' && firstChar <= '\u27BF') ||
    (firstChar >= '\uD800' && firstChar <= '\uDBFF')
  );
  let emojiPart = '';
  let mainPart = cleanInput;
  if (isEmoji) {
    const spaceMatch = cleanInput.match(/^([^\s]+\s*)/);
    if (spaceMatch) {
      emojiPart = spaceMatch[1];
      mainPart = cleanInput.substring(emojiPart.length);
    }
  }

  // 4. Bilingual parenthesis pattern like "डैशबोर्ड (Overview)" or "ग्राहक खाता (Clients)"
  const parenRegex = /^([^\(]+)\(([^)]+)\)(.*)$/;
  const pMatch = mainPart.match(parenRegex);
  if (pMatch) {
    const left = pMatch[1].trim();
    const inside = pMatch[2].trim();
    const right = pMatch[3].trim();
    const leftHasHindi = HINDI_RANGE_REGEX.test(left);
    const insideHasHindi = HINDI_RANGE_REGEX.test(inside);

    if (leftHasHindi && !insideHasHindi) {
      if (lang === 'Hindi') {
        return emojiPart + left + (right ? ' ' + translateText(right, lang) : '');
      } else {
        return emojiPart + inside + (right ? ' ' + translateText(right, lang) : '');
      }
    }
    if (!leftHasHindi && insideHasHindi) {
      if (lang === 'Hindi') {
        return emojiPart + inside + (right ? ' ' + translateText(right, lang) : '');
      } else {
        return emojiPart + left + (right ? ' ' + translateText(right, lang) : '');
      }
    }
  }

  // 5. Bilingual slashes like "नाम / Name" or "नाम (Name) / पता (Address)"
  if (mainPart.includes('/')) {
    const parts = mainPart.split('/');
    if (parts.length === 2) {
      const p1 = parts[0].trim();
      const p2 = parts[1].trim();
      const p1Hindi = HINDI_RANGE_REGEX.test(p1);
      const p2Hindi = HINDI_RANGE_REGEX.test(p2);

      if (p1Hindi && !p2Hindi) {
        return lang === 'Hindi' ? emojiPart + p1 : emojiPart + p2;
      }
      if (!p1Hindi && p2Hindi) {
        return lang === 'Hindi' ? emojiPart + p2 : emojiPart + p1;
      }
    }
  }

  // 6. Vocabulary fallback mappings for pure words or greedy sub-phrase translations
  if (HINDI_RANGE_REGEX.test(mainPart)) {
    if (lang === 'English') {
      const exactVocab = HINDI_TO_ENGLISH_VOCAB[mainPart];
      if (exactVocab) {
        return emojiPart + exactVocab;
      }
      return emojiPart + translateHindiToEnglishGreedy(mainPart);
    }
  } else if (ENGLISH_RANGE_REGEX.test(mainPart)) {
    if (lang === 'Hindi') {
      return emojiPart + (ENGLISH_TO_HINDI_VOCAB[mainPart] || mainPart);
    }
  }

  // 7. Default return (fallback)
  return text;
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context) {
    return {
      language: context.language,
      t: context.t
    };
  }

  const profile = useAppStore((state) => state.profile);
  const storedLang = localStorage.getItem('billkaro_language');
  const language = (storedLang || profile.language || 'English') as 'Hinglish' | 'Hindi' | 'English';

  const t = (text: string): string => translateText(text, language);

  return {
    language,
    t
  };
};

/**
 * Global Real-Time DOM Translation engine for zero-gaps coverage
 */
export const useGlobalDOMTranslator = () => {
  const context = useContext(LanguageContext);
  const profile = useAppStore((state) => state.profile);
  const storedLang = localStorage.getItem('billkaro_language');
  const language = context ? context.language : ((storedLang || profile.language || 'English') as 'Hinglish' | 'Hindi' | 'English');

  useEffect(() => {
    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (text && text.trim()) {
          if (!(node as any).__originalValue) {
            (node as any).__originalValue = text;
          }
          const original = (node as any).__originalValue;
          
          if (language === 'Hinglish') {
            if (node.nodeValue !== original) {
              (node as any).__lastTranslated = original;
              node.nodeValue = original;
            }
          } else {
            const translated = translateText(original, language);
            if (node.nodeValue !== translated) {
              (node as any).__lastTranslated = translated;
              node.nodeValue = translated;
            }
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        
        // Exclude specific translation-sensitive elements if necessary
        if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') return;

        // Translate placeholders
        const placeholder = element.getAttribute('placeholder');
        if (placeholder && placeholder.trim()) {
          if (!element.dataset.originalPlaceholder) {
            element.dataset.originalPlaceholder = placeholder;
          }
          const original = element.dataset.originalPlaceholder;
          if (language === 'Hinglish') {
            if (element.getAttribute('placeholder') !== original) {
              element.setAttribute('placeholder', original);
            }
          } else {
            const translated = translateText(original, language);
            if (element.getAttribute('placeholder') !== translated) {
              element.setAttribute('placeholder', translated);
            }
          }
        }

        // Translate titles
        const title = element.getAttribute('title');
        if (title && title.trim()) {
          if (!element.dataset.originalTitle) {
            element.dataset.originalTitle = title;
          }
          const original = element.dataset.originalTitle;
          if (language === 'Hinglish') {
            if (element.getAttribute('title') !== original) {
              element.setAttribute('title', original);
            }
          } else {
            const translated = translateText(original, language);
            if (element.getAttribute('title') !== translated) {
              element.setAttribute('title', translated);
            }
          }
        }

        // Traverse child nodes
        for (let i = 0; i < node.childNodes.length; i++) {
          translateNode(node.childNodes[i]);
        }
      }
    };

    const restoreAllNodes = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        if ((root as any).__originalValue !== undefined) {
          if (root.nodeValue !== (root as any).__originalValue) {
            (root as any).__lastTranslated = (root as any).__originalValue;
            root.nodeValue = (root as any).__originalValue;
          }
        }
      } else if (root.nodeType === Node.ELEMENT_NODE) {
        const element = root as HTMLElement;
        if (element.dataset.originalPlaceholder) {
          element.setAttribute('placeholder', element.dataset.originalPlaceholder);
        }
        if (element.dataset.originalTitle) {
          element.setAttribute('title', element.dataset.originalTitle);
        }
        for (let i = 0; i < root.childNodes.length; i++) {
          restoreAllNodes(root.childNodes[i]);
        }
      }
    };

    // Perform translation / restoration
    if (language === 'Hinglish') {
      restoreAllNodes(document.body);
    } else {
      translateNode(document.body);
    }

    // Set up MutationObserver
    const observer = new MutationObserver((mutations) => {
      observer.disconnect();

      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (language === 'Hinglish') {
              restoreAllNodes(node);
            } else {
              translateNode(node);
            }
          });
        } else if (mutation.type === 'characterData') {
          const node = mutation.target;
          const val = node.nodeValue;
          if (val && val.trim()) {
            const isOurTranslation = (node as any).__lastTranslated === val;
            if (!isOurTranslation) {
              (node as any).__originalValue = val;
              if (language !== 'Hinglish') {
                const translated = translateText(val, language);
                (node as any).__lastTranslated = translated;
                if (node.nodeValue !== translated) {
                  node.nodeValue = translated;
                }
              } else {
                (node as any).__lastTranslated = val;
              }
            }
          }
        }
      }

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);
};

export default useTranslation;
