import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Landmark } from 'lucide-react';

interface MonthlyPLProps {
  invoices: any[];
  expenses: any[];
  fixedExpenses: any[];
  filterMonth: number;
  filterYear: number;
}

export default function MonthlyPL({
  invoices,
  expenses,
  fixedExpenses,
  filterMonth,
  filterYear
}: MonthlyPLProps) {

  const monthlyInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date || inv.created_at);
    return invDate.getMonth() === filterMonth && invDate.getFullYear() === filterYear;
  });
  
  const totalIncome = monthlyInvoices.reduce((sum, inv) => sum + (parseFloat(inv.grand_total || inv.totalAmount || 0)), 0);

  const monthlyExpenses = expenses.filter(exp => {
    if (exp.type && exp.type !== 'Expense') return false;
    const expDate = new Date(exp.date);
    return expDate.getMonth() === filterMonth && expDate.getFullYear() === filterYear;
  });

  const categoryMap: { [key: string]: number } = {
    'Material': 0,
    'Labour': 0,
    'Transport': 0,
    'Tool': 0,
    'Other': 0
  };

  monthlyExpenses.forEach(exp => {
    const cat = exp.category || '';
    let mapped = 'Other';
    
    if (cat.toLowerCase().includes('material') || cat.toLowerCase().includes('cement') || cat.toLowerCase().includes('iron') || cat.toLowerCase().includes('steel')) {
      mapped = 'Material';
    } else if (cat.toLowerCase().includes('labour') || cat.toLowerCase().includes('wage') || cat.toLowerCase().includes('dihaadi')) {
      mapped = 'Labour';
    } else if (cat.toLowerCase().includes('transport') || cat.toLowerCase().includes('diesel') || cat.toLowerCase().includes('petrol') || cat.toLowerCase().includes('vehicle')) {
      mapped = 'Transport';
    } else if (cat.toLowerCase().includes('tool') || cat.toLowerCase().includes('machine') || cat.toLowerCase().includes('repair')) {
      mapped = 'Tool';
    } else {
      mapped = 'Other';
    }
    
    categoryMap[mapped] += parseFloat(exp.amount || 0);
  });

  const paidFixedExpenses = fixedExpenses.filter(fe => {
    if (fe.status !== 'Paid') return false;
    return true;
  });

  paidFixedExpenses.forEach(fe => {
    const nameLower = fe.name.toLowerCase();
    let mapped = 'Other';
    if (nameLower.includes('rent')) {
      mapped = 'Other'; 
    } else if (nameLower.includes('salary') || nameLower.includes('wages')) {
      mapped = 'Labour';
    } else if (nameLower.includes('tool') || nameLower.includes('machine')) {
      mapped = 'Tool';
    }
    categoryMap[mapped] += parseFloat(fe.amount || 0);
  });

  const totalExpense = Object.values(categoryMap).reduce((sum, val) => sum + val, 0);
  const netProfit = totalIncome - totalExpense;

  const maxVal = Math.max(totalIncome, totalExpense, 1);
  const incomeHeightPercent = Math.round((totalIncome / maxVal) * 100);
  const expenseHeightPercent = Math.round((totalExpense / maxVal) * 100);

  return (
    <div className="bg-[#0e1322] border border-gray-800 p-5 rounded-3xl space-y-5 shadow-xl select-none">
      
      {/* Title section */}
      <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
        <TrendingUp className="h-5 w-5 text-amber-500 animate-pulse" />
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">
          Monthly Profit & Loss Statement
        </h3>
      </div>

      {/* Grid summarizing core finance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Income block */}
        <div className="bg-gray-950 p-4 rounded-2xl border border-gray-850 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide block">
              Total Income
            </span>
            <span className="text-lg font-black font-mono text-emerald-400">
              ₹{(totalIncome ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[9.5px] text-gray-500 block">
              Synced with {monthlyInvoices.length} Invoices
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>

        {/* Total Expense block */}
        <div className="bg-gray-950 p-4 rounded-2xl border border-gray-850 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide block">
              Total Expense
            </span>
            <span className="text-lg font-black font-mono text-rose-400">
              ₹{(totalExpense ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[9.5px] text-gray-500 block">
              Direct {monthlyExpenses.length} + Fixed {paidFixedExpenses.length} Paid
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center text-rose-400">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
        </div>

        {/* Net Profit block */}
        <div className="bg-gray-950 p-4 rounded-2xl border border-gray-850 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide block">
              Net Profit
            </span>
            <span className={`text-xl font-black font-mono ${netProfit >= 0 ? 'text-amber-400' : 'text-rose-500'}`}>
              {(netProfit ?? 0) < 0 ? '-' : ''}₹{Math.abs(netProfit ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[9.5px] text-gray-500 block">
              {netProfit >= 0 ? '🟢 In Profit' : '🔴 Over Budget'}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center text-amber-500">
            <Landmark className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Chart and Category split block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
        
        {/* Simple visual bar chart */}
        <div className="bg-gray-950 p-4 rounded-2xl border border-gray-850 flex flex-col justify-between">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            Income vs Expense Chart
          </h4>

          <div className="flex h-44 items-end justify-center space-x-12 px-6 border-b border-gray-850 pb-2">
            
            {/* Income Bar */}
            <div className="flex flex-col items-center flex-1 max-w-[70px]">
              <span className="text-[10.5px] font-bold font-mono text-emerald-400 mb-1">
                ₹{totalIncome >= 1000 ? `${(totalIncome/1000).toFixed(1)}k` : totalIncome}
              </span>
              <div 
                style={{ height: `${incomeHeightPercent || 4}%` }}
                className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl min-h-[10px] transition-all duration-700 ease-out shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              />
              <span className="text-[10px] font-bold text-gray-300 mt-2 uppercase tracking-tight">
                Income
              </span>
            </div>

            {/* Expense Bar */}
            <div className="flex flex-col items-center flex-1 max-w-[70px]">
              <span className="text-[10.5px] font-bold font-mono text-rose-400 mb-1">
                ₹{totalExpense >= 1000 ? `${(totalExpense/1000).toFixed(1)}k` : totalExpense}
              </span>
              <div 
                style={{ height: `${expenseHeightPercent || 4}%` }}
                className="w-full bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-xl min-h-[10px] transition-all duration-700 ease-out shadow-[0_0_15px_rgba(244,63,94,0.15)]"
              />
              <span className="text-[10px] font-bold text-gray-300 mt-2 uppercase tracking-tight">
                Expense
              </span>
            </div>

          </div>

          <div className="text-[10px] text-gray-450 leading-relaxed mt-3.5 text-center">
            {totalIncome > totalExpense ? (
              <span>📈 Your income is higher than expenses by <b className="text-emerald-400">₹{((totalIncome ?? 0) - (totalExpense ?? 0)).toLocaleString('en-IN')}</b>!</span>
            ) : totalExpense > totalIncome ? (
              <span>⚠️ Warning: Expenses exceed income by <b className="text-rose-400">₹{((totalExpense ?? 0) - (totalIncome ?? 0)).toLocaleString('en-IN')}</b> this month!</span>
            ) : (
              <span>🤝 Income and expenses are perfectly balanced this month.</span>
            )}
          </div>
        </div>

        {/* Expenses category breakdown */}
        <div className="bg-gray-950 p-4 rounded-2xl border border-gray-850 space-y-4">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-900 pb-2">
            Expense Category Analysis
          </h4>

          <div className="space-y-3.5 pt-1">
            {Object.entries(categoryMap).map(([title, val]) => {
              const sharePercent = totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
              let barColor = 'bg-amber-500';
              if (title === 'Material') barColor = 'bg-sky-500';
              if (title === 'Labour') barColor = 'bg-emerald-500';
              if (title === 'Transport') barColor = 'bg-indigo-500';
              if (title === 'Tool') barColor = 'bg-purple-500';

              return (
                <div key={title} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-gray-300 uppercase tracking-tight">
                      {title === 'Material' ? '🧱 Materials' : 
                       title === 'Labour' ? '👷 Labour & Wages' :
                       title === 'Transport' ? '⛽ Transport & Fuel' :
                       title === 'Tool' ? '⚙️ Tools & Machinery' : 
                       '📦 Others'}
                    </span>
                    <span className="font-mono font-black text-white">
                      ₹{(val ?? 0).toLocaleString('en-IN')} <span className="text-gray-500 text-[9px]">({sharePercent}%)</span>
                    </span>
                  </div>

                  <div className="h-2 w-full bg-[#121625] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${barColor} rounded-full transition-all duration-500`} 
                      style={{ width: `${sharePercent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {totalExpense === 0 && (
              <div className="text-center py-10 text-xs text-gray-650 italic">
                No expenses recorded in this selected period.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
