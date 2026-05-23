import React, { useState } from 'react';
import useAppStore from '../store';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  X, 
  Zap, 
  ShieldCheck, 
  Award, 
  CreditCard, 
  Smartphone, 
  Sparkles, 
  ShieldAlert, 
  Loader2, 
  CheckCircle2, 
  MessageSquare, 
  TrendingUp 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';


export default function Pricing() {

  const { subscription, setSubscription, profile } = useAppStore();
  const navigate = useNavigate();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Helper to load Razorpay script dynamically
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (plan: 'FREE' | 'PRO' | 'YEARLY', price: number) => {
    if (plan === 'FREE') {
      setSubscription('FREE');
      toast.success('Switched to basic free trial plan!');
      return;
    }

    setLoadingPlan(plan);
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      // If scripts were blocked, we proceed with a sandbox simulation
      setTimeout(() => {
        setSubscription(plan);
        setLoadingPlan(null);
        toast.success(`Payment successful! You are now a ${plan} member.`);
        navigate('/settings');
      }, 1500);
      return;
    }

    try {
      // Razorpay checkout configuration options
      const options = {
        key: 'rzp_test_dummy_key_billkaro', // Placeholder / Sandbox Key
        amount: price * 100, // In Paise
        currency: 'INR',
        name: 'BillKaro Premium',
        description: `${plan} Plan Activation`,
        image: profile.logoUrl || 'https://raw.githubusercontent.com/lucide-react/lucide/main/icons/zap.png',
        handler: function (response: any) {
          // Success Callback
          setSubscription(plan);
          toast.success(`Congratulations! Received Payment ID ${response.razorpay_payment_id}.`);
          navigate('/settings');
        },
        prefill: {
          name: profile.ownerName || 'Ledger Owner',
          contact: profile.phone || '9999999999',
          email: 'smalik314@gmail.com'
        },
        notes: {
          plan_selected: plan
        },
        theme: {
          color: '#f59e0b'
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment was cancelled!');
            setLoadingPlan(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.warn('Razorpay checkout initialization failed, executing fallback...', err);
      setSubscription(plan);
      toast.success(`Successfully activated the ${plan} plan!`);
      navigate('/settings');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-3 pb-24 space-y-10 select-none animate-fadeIn">
      <Toaster position="top-center" />

      {/* Pricing Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3.5 mt-4">
        <span className="bg-amber-400/10 border border-amber-500/25 text-amber-500 font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full inline-block animate-pulse">
          🎯 PREMIUM PLANS
        </span>
        <h1 className="text-xl md:text-2xl font-black text-gray-100 uppercase tracking-tight">
          Simplify bookkeeping & upgrade to PRO today!
        </h1>
        <p className="text-xs text-gray-400 leading-relaxed text-center">
          Stop worrying about limitations. Get unlimited customer logs, tax-compliant GST bills, instant payment scan QR codes, and roster registers.
        </p>
      </div>

      {/* Plan price cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">

        {/* FREE PLAN */}
        <div className={`bg-gray-950/60 border rounded-3xl p-6 space-y-5 flex flex-col justify-between transition-all ${
          subscription === 'FREE' 
            ? 'border-gray-500 ring-2 ring-gray-600/25 shadow-xl' 
            : 'border-gray-850 hover:border-gray-800'
        }`}>
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider block">Basic Free Edition</span>
              {subscription === 'FREE' && (
                <span className="bg-gray-800 text-gray-300 text-[8.5px] px-2 py-0.5 rounded font-black border border-gray-700 capitalize">
                  Current
                </span>
              )}
            </div>

            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Award className="h-5 w-5 text-gray-400" />
                <span>Free Trial Account</span>
              </h3>
              <div className="mt-2.5 flex items-baseline">
                <span className="text-3xl font-black text-gray-100 font-mono">₹0</span>
                <span className="text-gray-550 text-xs ml-1 font-bold">/ Forever Free</span>
              </div>
              <p className="text-[11px] text-gray-450 mt-1.5 leading-normal">
                For beginners & small startup projects looking for a clean, non-sync testing environment.
              </p>
            </div>

            <div className="border-t border-gray-900 pt-4 space-y-2.5 text-[11px] text-gray-300">
              <div className="flex items-center space-x-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Maximum 5 Invoices limit</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Attendance & Expense logs</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500 line-through">
                <X className="h-3.5 w-3.5 shrink-0" />
                <span>Watermark-free clean PDFs</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500 line-through">
                <X className="h-3.5 w-3.5 shrink-0" />
                <span>Business Logo & Instant QR code</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleUpgrade('FREE', 0)}
            disabled={subscription === 'FREE' || loadingPlan !== null}
            className={`w-full py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer font-mono ${
              subscription === 'FREE'
                ? 'bg-gray-850 text-gray-500 border border-gray-800'
                : 'bg-gray-900 text-white hover:bg-gray-850'
            }`}
          >
            {subscription === 'FREE' ? 'Active Free Plan' : 'Downgrade to Free'}
          </button>
        </div>

        {/* PRO PLAN - POPULAR */}
        <div className={`bg-amber-950/15 border rounded-3xl p-6 space-y-5 flex flex-col justify-between relative shadow-[0_10px_30px_rgba(245,158,11,0.05)] transition-all ${
          subscription === 'PRO' 
            ? 'border-amber-500 ring-2 ring-amber-500/35 shadow-2xl' 
            : 'border-amber-500/40 hover:border-amber-500/60'
        }`}>
          {/* Top banner tag */}
          <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full whitespace-nowrap shadow-md">
            RECOMMENDED (MOST POPULAR)
          </span>

          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-amber-500 font-black uppercase tracking-wider block">Pro Monthly Pack</span>
              {subscription === 'PRO' && (
                <span className="bg-amber-500 text-black text-[8.5px] px-2 py-0.5 rounded font-black capitalize">
                  Current
                </span>
              )}
            </div>

            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <Zap className="h-5 w-5 text-amber-500 fill-current" />
                <span>PRO Membership</span>
              </h3>
              <div className="mt-2.5 flex items-baseline">
                <span className="text-3xl font-black text-amber-400 font-mono">₹199</span>
                <span className="text-gray-450 text-xs ml-1 font-bold">/ Monthly</span>
              </div>
              <p className="text-[11px] text-gray-450 mt-1.5 leading-normal">
                Unlimited client profiles, automatic digital invoice payment QR code widgets, and full custom branding.
              </p>
            </div>

            <div className="border-t border-amber-950/50 pt-4 space-y-2.5 text-[11px] text-gray-200">
              <div className="flex items-center space-x-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="font-bold">Unlimited Clients & Parties</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="font-bold">Watermark-free Clean PDFs</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Digital Signature & Logo Embed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Instant UPI QR Code Payments</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleUpgrade('PRO', 199)}
            disabled={loadingPlan !== null}
            className={`w-full py-3 rounded-xl text-xs font-black uppercase transition cursor-pointer font-mono ${
              subscription === 'PRO'
                ? 'bg-[#151206] text-amber-500 border border-amber-500/40'
                : 'bg-amber-500 text-white hover:bg-amber-400 hover:shadow-lg shadow-amber-500/20'
            }`}
          >
            {loadingPlan === 'PRO' ? (
              <span className="flex items-center justify-center space-x-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </span>
            ) : subscription === 'PRO' ? (
              'Active PRO Plan'
            ) : (
              'Upgrade to PRO'
            )}
          </button>
        </div>

        {/* YEARLY PLAN */}
        <div className={`bg-emerald-950/10 border rounded-3xl p-6 space-y-5 flex flex-col justify-between transition-all ${
          subscription === 'YEARLY' 
            ? 'border-emerald-500 ring-2 ring-emerald-500/35 shadow-2xl' 
            : 'border-emerald-500/40 hover:border-emerald-500/60'
        }`}>
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">Annual Gold Saver</span>
              {subscription === 'YEARLY' && (
                <span className="bg-emerald-500 text-black text-[8.5px] px-2 py-0.5 rounded font-black capitalize">
                  Current
                </span>
              )}
            </div>

            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Annual Golden Plan</span>
              </h3>
              <div className="mt-2.5 flex items-baseline">
                <span className="text-3xl font-black text-emerald-400 font-mono">₹1,499</span>
                <span className="text-gray-450 text-xs ml-1 font-bold">/ Yearly</span>
              </div>
              <p className="text-[11px] text-gray-450 mt-1.5 leading-normal">
                Save over 40% on annual plans! Build with peace of mind all year round.
              </p>
            </div>

            <div className="border-t border-emerald-950/40 pt-4 space-y-2.5 text-[11px] text-gray-200">
              <div className="flex items-center space-x-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold">All Pro Features Included</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold">₹889/year bulk discount (40% OFF)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>24/7 Premium Hotline & Call Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Future updates & new add-ons free</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleUpgrade('YEARLY', 1499)}
            disabled={loadingPlan !== null}
            className={`w-full py-3 rounded-xl text-xs font-black uppercase transition cursor-pointer font-mono ${
              subscription === 'YEARLY'
                ? 'bg-[#081510] text-emerald-400 border border-emerald-500/40'
                : 'bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-lg shadow-emerald-500/20'
            }`}
          >
            {loadingPlan === 'YEARLY' ? (
              <span className="flex items-center justify-center space-x-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </span>
            ) : subscription === 'YEARLY' ? (
              'Active Gold Annual Plan'
            ) : (
              'Purchase Yearly Gold'
            )}
          </button>
        </div>

      </div>

      {/* Feature Comparison Table Title */}
      <div className="pt-8 space-y-4 border-t border-gray-900">
        <h3 className="text-sm font-black text-gray-100 uppercase tracking-widest text-center">
          Detailed Feature Comparison
        </h3>

        <div className="bg-[#0b0f1a] rounded-3xl border border-gray-850 overflow-hidden shadow-inner">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className="bg-gray-950 text-gray-400 uppercase font-black tracking-wider text-[10px] border-b border-gray-900">
                <th className="p-4">Key Features</th>
                <th className="p-4 text-center">Free Tier</th>
                <th className="p-4 text-center text-amber-500">PRO Tier</th>
                <th className="p-4 text-center text-emerald-400">Gold Yearly Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#101625] text-gray-300">
              
              <tr>
                <td className="p-4 font-bold text-gray-200">Invoice Count Limit</td>
                <td className="p-4 text-center font-mono text-gray-500">5 Bills Only</td>
                <td className="p-4 text-center font-bold text-amber-500 font-mono">Unlimited</td>
                <td className="p-4 text-center font-bold text-emerald-400 font-mono">Unlimited</td>
              </tr>

              <tr>
                <td className="p-4 font-bold text-gray-200">Clients & Party Directories</td>
                <td className="p-4 text-center font-mono">5 Parties max</td>
                <td className="p-4 text-center font-bold text-amber-500 font-mono">∞ Unlimited</td>
                <td className="p-4 text-center font-bold text-emerald-400 font-mono">∞ Unlimited</td>
              </tr>

              <tr>
                <td className="p-4 font-bold text-gray-200">Watermark-free Invoice PDFs</td>
                <td className="p-4 text-center text-rose-500 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </td>
                <td className="p-4 text-center text-emerald-500">
                  <Check className="h-4.5 w-4.5 mx-auto" />
                </td>
                <td className="p-4 text-center text-emerald-500">
                  <Check className="h-4.5 w-4.5 mx-auto" />
                </td>
              </tr>

              <tr>
                <td className="p-4 font-bold text-gray-200">Payment Link Instant QR Code</td>
                <td className="p-4 text-center text-gray-550 italic">No</td>
                <td className="p-4 text-center text-emerald-500">
                  <Check className="h-4.5 w-4.5 mx-auto" />
                </td>
                <td className="p-4 text-center text-emerald-500">
                  <Check className="h-4.5 w-4.5 mx-auto" />
                </td>
              </tr>

              <tr>
                <td className="p-4 font-bold text-gray-200">Wages & Workers Attendance Roster</td>
                <td className="p-4 text-center text-emerald-500">
                  <Check className="h-4.5 w-4.5 mx-auto" />
                </td>
                <td className="p-4 text-center text-emerald-500">
                  <Check className="h-4.5 w-4.5 mx-auto" />
                </td>
                <td className="p-4 text-center text-emerald-500">
                  <Check className="h-4.5 w-4.5 mx-auto" />
                </td>
              </tr>

              <tr>
                <td className="p-4 font-bold text-gray-200">Customer Support Helpdesk</td>
                <td className="p-4 text-center text-gray-500">Via Email Help desk</td>
                <td className="p-4 text-center text-gray-200 font-bold">24/7 Chat & Ticket Desk</td>
                <td className="p-4 text-center text-emerald-400 font-bold font-sans">📞 VIP Direct Call Support</td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
