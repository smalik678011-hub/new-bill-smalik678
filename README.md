# BillKaro GST Bill & Ledger (जीएसटी बिल एवं बहीखाता) 👑

**BillKaro** is a high-performance, bilingual visual ledger built to handle high-fidelity estimates, GST-compliant digital billing, wages/attendance books, and inventory management. Designed from the ground up for micro-enterprises, small manufacturers, and contractors across India.

---

## 🎨 Design Philosophy & Polish

- **Bilingual Core Support (Hindi/English)**: Every single visual tag, description, input element, and CTA handles native Hinglish / Hindi translations seamlessly to keep local operators comfortable.
- **Enterprise Slate Aesthetics**: Implemented premium amber-accented layouts over a deep dark UI canvas, fully responsive from ultra-wide screens to mobile bottom drawers.
- **Offline Cache Architecture**: Built on progressive caching and a solid local storage fallback with quick syncing prompts when network returns.

---

## 🛠 Features

1. **GST Invoice & Quotation Engine**: Custom addition of CGST, SGST, IGST tax structures, discount metrics, and WhatsApp sharing templates.
2. **Workers Attendance Book (हाज़िरी रजिस्टर)**: Track daily work sessions, present/absent logs, and auto-calculate daily wages based on dihaadi rates.
3. **Expense Tracking (खर्चा खाता)**: Dynamic categorizations (EMI, rent, tea, salaries) with interactive month-by-month profit calculations with high-resolution D3/Recharts curves.
4. **Subscription Gate**: Built-in premium upgrade gate mimicking authentic Razorpay payment integrations.
5. **App Install (PWA)**: Desktop/mobile home screen installation support with an intelligent installation reminder widget.

---

## 🚀 Quick Setup Instructions

Make sure you have Node.js 18+ installed on your hardware.

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables (`.env.example`)
Create a `.env` file in the root directory:
```env
# Supabase Configuration (Optional Cloud Sync)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Razorpay Configuration (Sandbox)
VITE_RAZORPAY_KEY_ID=rzp_test_yourkey
```

### 3. Running Dev Mode
```bash
npm run dev
```

### 4. Compiling the Production Build
```bash
npm run build
```

---

## 📂 Project Architecture

- **`src/components/ui/`**: Polish UI widgets including `Button`, `Input`, `Modal` (mobile bottom sheets), `Card`, `Badge` (colored status indicators), `FAB` (floating action buttons), `LoadingSpinner`, and `EmptyState`.
- **`src/hooks/`**: Includes custom React hooks `useSubscription` and `useBusiness` for dynamic state checks in deep UI branches.
- **`src/store.ts`**: Unified global ledger bahi-khata state utilizing Zustand with automatic synchronized caching.

---

*Made with 💛 for small business owners.*
