import { useMemo, useEffect, useContext } from 'react';
import useAppStore from '../store';
import { LanguageContext } from '../context/LanguageContext';


const HINDI_RANGE_REGEX = /[\u0900-\u097F]/;
const ENGLISH_RANGE_REGEX = /[a-zA-Z]/;

// Dictionary of purely-English to Hindi/Hinglish and purely-Hindi to English/Hinglish
const TRANSLATION_DICTIONARY: Record<string, Record<'Hindi' | 'English' | 'Hinglish', string>> = {
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
  "लेबर और हाज़िरी रजिस्टर": {
    Hindi: "लेबर और हाज़िरी रजिस्टर",
    English: "Labour & Attendance Register",
    Hinglish: "लेबर और हाज़िरी रजिस्टर (Labour Roster)"
  },
  "कारीगरों की दैनिक हाजिरी लगाएं, मासिक कैलेंडर देखें और वेतन (हिसाब-किताब) व्यवस्थित करें।": {
    Hindi: "कारीगरों की दैनिक हाजिरी लगाएं, मासिक कैलेंडर देखें और वेतन व्यवस्थित करें।",
    English: "Mark daily worker attendance, view monthly calendar, and manage salaries.",
    Hinglish: "कारीगरों की दैनिक हाजिरी लगाएं, मासिक कैलेंडर देखें और वेतन (Payroll) व्यवस्थित करें।"
  },
  "क्लाउड डेटाबेस सक्रिय (Sync Active)": {
    Hindi: "क्लाउड डेटाबेस सक्रिय",
    English: "Cloud Database Active",
    Hinglish: "क्लाउड डेटाबेस सक्रिय (Sync Active)"
  },
  "लोकल मोड सक्रिय (Local Offline Book)": {
    Hindi: "लोकल मोड सक्रिय",
    English: "Local Offline Mode Active",
    Hinglish: "लोकल मोड सक्रिय (Local Offline Book)"
  },
  "📅 हाज़िरी कैलेंडर (Monthly & Bulk)": {
    Hindi: "📅 हाज़िरी कैलेंडर",
    English: "📅 Attendance Calendar",
    Hinglish: "📅 हाज़िरी कैलेंडर (Monthly & Bulk)"
  },
  "👷 कारीगर प्रबंधक (Manage Workers)": {
    Hindi: "👷 कारीगर प्रबंधक",
    English: "👷 Manage Workers",
    Hinglish: "👷 कारीगर प्रबंधक (Manage Workers)"
  },
  "💰 हिसाब और सैलरी (Payroll Book)": {
    Hindi: "💰 हिसाब और सैलरी",
    English: "💰 Salary & Payroll",
    Hinglish: "💰 हिसाब और सैलरी (Payroll Book)"
  },
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
  }
};

const HINDI_TO_ENGLISH_VOCAB: Record<string, string> = {
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
export const translateText = (text: string, lang: 'Hindi' | 'English' | 'Hinglish'): string => {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);

  const cleanInput = text.trim();

  // 1. Direct dictionary check (first preference)
  if (TRANSLATION_DICTIONARY[cleanInput]) {
    return TRANSLATION_DICTIONARY[cleanInput][lang];
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

  // 6. Vocabulary fallback mappings for pure words
  if (HINDI_RANGE_REGEX.test(mainPart)) {
    if (lang === 'English') {
      return emojiPart + (HINDI_TO_ENGLISH_VOCAB[mainPart] || mainPart);
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
