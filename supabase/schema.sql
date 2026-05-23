-- Supabase Complete Database Schema for BillKaro

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    plan TEXT NOT NULL DEFAULT 'FREE', -- FREE, PRO, YEARLY
    business_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PROFILES Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    owner TEXT,
    address TEXT,
    phone TEXT,
    gstin TEXT,
    logo_url TEXT,
    upi_id TEXT,
    bank_details JSONB, -- { "bank_name": "...", "account_number": "...", "ifsc_code": "..." }
    language TEXT DEFAULT 'Hindi',
    type TEXT DEFAULT 'Fabrication',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update users table self-reference foreign key after profiles table creation
ALTER TABLE users ADD CONSTRAINT fk_user_business FOREIGN KEY (business_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. CLIENTS Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    source TEXT DEFAULT 'Direct',
    status TEXT DEFAULT 'Active',
    deadline DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. QUOTATIONS Table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    number TEXT NOT NULL, -- e.g., 'EST-26-001'
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of items with name, rate, quantity, unit, gstPercent
    advance NUMERIC DEFAULT 0,
    conditions TEXT,
    validity INTEGER DEFAULT 15, -- Validity in days
    status TEXT DEFAULT 'Draft', -- Draft, Sent, Converted, Expired
    total NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. INVOICES Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    number TEXT NOT NULL, -- e.g., 'INV-2026-001'
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of billing items
    subtotal NUMERIC NOT NULL DEFAULT 0,
    gst_percent NUMERIC DEFAULT 0,
    gst_amount NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    grand_total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Unpaid', -- Paid, Unpaid, Partial
    payments JSONB DEFAULT '[]'::jsonb, -- History of payment records [ { "amount": 1000, "date": "..." } ]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PROFIT_ENTRIES Table
CREATE TABLE IF NOT EXISTS profit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    material_cost NUMERIC DEFAULT 0,
    labour_cost NUMERIC DEFAULT 0,
    transport NUMERIC DEFAULT 0,
    other NUMERIC DEFAULT 0,
    total_expense NUMERIC DEFAULT 0,
    net_profit NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. WORKERS Table
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    daily_rate NUMERIC NOT NULL DEFAULT 0,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. ATTENDANCE Table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL, -- Present, HalfDay, Absent
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_worker_date UNIQUE (worker_id, date)
);

-- 9. EXPENSES Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    note TEXT,
    type TEXT NOT NULL DEFAULT 'Expense', -- Income, Expense
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. FIXED_EXPENSES Table
CREATE TABLE IF NOT EXISTS fixed_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    frequency TEXT DEFAULT 'Monthly', -- Monthly, Yearly, Weekly
    due_date TEXT, -- due day indicator, e.g., "5th of every month"
    status TEXT DEFAULT 'Unpaid', -- Paid, Unpaid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. SUBSCRIPTIONS Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'FREE', -- FREE, PRO, YEARLY
    start_date DATE NOT NULL,
    end_date DATE,
    razorpay_id TEXT,
    status TEXT DEFAULT 'Active', -- Active, Expired, Cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
