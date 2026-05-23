import React from 'react';
import useAppStore from '../../store';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, Award, CheckCircle2, AlertTriangle, ArrowRight, HelpCircle } from 'lucide-react';


interface SubscriptionStatusProps {
  onUpgradeClick?: () => void;
}

export default function SubscriptionStatus({ onUpgradeClick }: SubscriptionStatusProps) {

  const { subscription, invoices, setSubscription } = useAppStore();
  const navigate = useNavigate();

  const invoiceCount = invoices ? invoices.length : 0;
  const invoiceLimitKey = subscription === 'FREE' ? 5 : 9999;
  
  // Calculate usage percentages
  const limitPercent = Math.min(100, Math.round((invoiceCount / invoiceLimitKey) * 100));

  const handleRedirectUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      navigate('/pricing');
    }
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      
      {/* Current active plan badge layout */}
      <div className="bg-gray-950 p-5 rounded-3xl border border-gray-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="flex items-center space-x-3.5">
          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border ${
            subscription === 'FREE' 
              ? 'bg-gray-800 border-gray-700 text-gray-400' 
              : subscription === 'PRO'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          }`}>
            {subscription === 'FREE' ? (
              <Award className="h-6 w-6" />
            ) : subscription === 'PRO' ? (
              <Zap className="h-6 w-6 fill-current animate-bounce" />
            ) : (
              <ShieldCheck className="h-6 w-6" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-gray-450 uppercase font-black block tracking-tight">वर्तमान प्लान (Active Level)</span>
              {subscription !== 'FREE' && (
                <span className="bg-emerald-500/10 text-emerald-400 text-[8.5px] px-2 py-0.5 rounded font-black border border-emerald-500/15 uppercase animate-pulse">
                  सक्रिय (Active Book)
                </span>
              )}
            </div>
            
            <h3 className="text-sm font-black text-white uppercase tracking-wider mt-0.5">
              {subscription === 'FREE' 
                ? 'मुफ़्त परीक्षण खाता (BillKaro Free Account)' 
                : subscription === 'PRO'
                  ? '⭐ बिलकरो प्रो मेम्बर (BillKaro PRO Member)'
                  : '🤝 वार्षिक प्रो सुरक्षा प्लान (BillKaro Annual Gold)'}
            </h3>

            <p className="text-xs text-gray-450 mt-1 leading-normal">
              {subscription === 'FREE' 
                ? 'आप सीमित फीचर्स के साथ शुरूआती परीक्षण स्तर पर हैं। पूर्ण अनलिमिटेड बही के लिए प्रो बनें।'
                : 'बधाई हो! प्रो मोड में आपका व्यापार बिल्कुल रॉकेट की गति से चलेगा। सभी सीमाएं हटी हुई हैं!'}
            </p>
          </div>
        </div>

        {subscription === 'FREE' && (
          <button
            onClick={handleRedirectUpgrade}
            className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-1 transition cursor-pointer shrink-0"
          >
            <span>PRO में अपग्रेड करें</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Usage Analytics & Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Meter left */}
        <div className="bg-[#0e1322] border border-gray-850 p-5 rounded-3xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-900">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              बनाई गए इनवॉइस बिल (Invoice Outflow Usage)
            </span>
            <span className="text-xs font-mono font-black text-white">
              {invoiceCount} / {subscription === 'FREE' ? '5 Bills' : 'अनलिमिटेड'}
            </span>
          </div>

          {subscription === 'FREE' ? (
            <div className="space-y-3.5 pt-1">
              <div className="space-y-1">
                <div className="h-3 w-full bg-gray-950 rounded-full overflow-hidden border border-gray-850 p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      limitPercent >= 80 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${limitPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                  <span>प्रयुक्त (Used): {limitPercent}%</span>
                  <span>बचे (Remaining): {Math.max(0, 5 - invoiceCount)} Bills</span>
                </div>
              </div>

              {invoiceCount >= 5 && (
                <div className="bg-rose-500/10 border border-rose-500/15 p-3 rounded-2xl flex items-start space-x-2 animate-fadeIn text-[10.5px] text-rose-450 leading-relaxed">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>
                    <b>सीमा समाप्त!</b> आपने मुफ़्त प्लान में दिए गए सभी 5 बिल बना लिए हैं। ग्राहकों को और पक्के बिल भेजने के लिए आज ही <b>PRO</b> में स्विच करें।
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl font-black text-emerald-400 font-mono block">∞</span>
                  <span className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mt-0.5 block">
                    असीमित बिल जनरेटर (Unlimited Bills Allowed)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Benefits right column */}
        <div className="bg-[#0e1322] border border-gray-850 p-5 rounded-3xl space-y-4">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block border-b border-gray-900 pb-2">
            प्रो प्लान के बेहतरीन फ़ायदे (PRO Membership Advantages)
          </span>

          <div className="space-y-2.5">
            {[
              'असीमित ग्राहक एवं पार्टी खाता (Unlimited Clients Ledger)',
              'बिना किसी जलचिह्न के सुंदर इनवॉइस बिल (No Watermark on Bill PDFs)',
              'सभी इनवॉइस पर कार्यस्थल का पेमेंट क्यूआर कोड (UPI Payment QR Embedded)',
              'दुकान / गोदाम का लोगो एवं मालिक के डिजिटल दस्तख़त (Company Logo & Digital Signs)',
              'असीमित हाज़िरी रजिस्टर एवं दैनिक खर्च्चा बही (Unlimited Attendance & Expenses Sync)',
              '24/7 कस्टमर सपोर्ट हेल्पलाइन (Dedicated Support Helpdesk)'
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-[11px] text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
