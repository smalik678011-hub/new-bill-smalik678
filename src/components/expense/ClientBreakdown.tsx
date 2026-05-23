import React from 'react';
import { Users, FileSpreadsheet, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';


interface ClientBreakdownProps {
  clients: any[];
  invoices: any[];
  filterMonth: number;
  filterYear: number;
}

export default function ClientBreakdown({
  clients,
  invoices,
  filterMonth,
  filterYear
}: ClientBreakdownProps) {

  
  // Group invoices by client for selected month
  const monthlyInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date || inv.created_at);
    return invDate.getMonth() === filterMonth && invDate.getFullYear() === filterYear;
  });

  const clientIncomeList = clients.map(client => {
    // Collect client's invoices for this month
    const clientMonthlyInvoices = monthlyInvoices.filter(inv => inv.client_id === client.id || inv.clientId === client.id);
    
    const salesVolume = clientMonthlyInvoices.reduce((sum, inv) => sum + (parseFloat(inv.grand_total || inv.totalAmount || 0)), 0);
    const amountPaid = clientMonthlyInvoices.reduce((sum, inv) => sum + (parseFloat(inv.paidAmount || 0)), 0);
    const pendingDue = Math.max(0, salesVolume - amountPaid);

    return {
      ...client,
      salesVolume,
      amountPaid,
      pendingDue,
      invoiceCount: clientMonthlyInvoices.length
    };
  }).filter(c => c.salesVolume > 0) // Only display active clients for this month
    .sort((a, b) => b.salesVolume - a.salesVolume);

  const grandTotalMonthSales = clientIncomeList.reduce((sum, c) => sum + c.salesVolume, 0);

  return (
    <div className="bg-[#0e1322] border border-gray-800 p-5 rounded-3xl space-y-4 shadow-xl select-none animate-fadeIn">
      
      {/* Title section */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">
            Client Earnings Analysis
          </h3>
        </div>
        <span className="text-[10px] text-gray-400 font-bold border border-gray-800 px-2.5 py-1 rounded-xl bg-gray-950 font-mono">
          Total Month Sales: ₹{(grandTotalMonthSales ?? 0).toLocaleString('en-IN')}
        </span>
      </div>

      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {clientIncomeList.map(c => {
          const sharePercentage = grandTotalMonthSales > 0 ? Math.round((c.salesVolume / grandTotalMonthSales) * 100) : 0;
          const paidPercentage = c.salesVolume > 0 ? Math.round((c.amountPaid / c.salesVolume) * 100) : 0;

          return (
            <div
              key={c.id}
              className="bg-[#121622] hover:bg-[#161c2c] border border-gray-850 p-4 rounded-3xl space-y-3.5 transition group"
            >
              
              {/* Client Title and quick metrics */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition">
                      {c.name}
                    </h4>
                    <span className="bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[8.5px] px-1.5 py-0.5 rounded font-black font-mono">
                      {sharePercentage}% of Sales
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-450 block mt-0.5">
                    {c.invoiceCount} Invoices raised this month • Type: {c.clientType || 'Regular'}
                  </span>
                </div>

                <div className="text-left sm:text-right font-mono">
                  <span className="text-[8.5px] text-gray-400 uppercase font-black block tracking-tight">Income Volume</span>
                  <span className="text-xs font-black text-emerald-400">
                    ₹{(c.salesVolume ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Progress and ledger division sheet */}
              <div className="grid grid-cols-2 gap-3.5 bg-gray-950/45 p-2.5 rounded-xl border border-gray-900 text-[10px] font-mono leading-none">
                <div className="flex justify-between items-center pr-3 border-r border-[#161B29]">
                  <span className="text-gray-450 flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" /> Received
                  </span>
                  <span className="text-emerald-400 font-bold">₹{(c.amountPaid ?? 0).toLocaleString('en-IN')} ({paidPercentage}%)</span>
                </div>

                <div className="flex justify-between items-center pl-1">
                  <span className="text-gray-450 flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mr-1.5" /> Pending
                  </span>
                  <span className="text-rose-400 font-bold">₹{(c.pendingDue ?? 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Graphical mini progress scale */}
              <div className="space-y-1">
                <div className="h-1.5 w-full bg-[#151a2e] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${paidPercentage}%` }}
                  />
                </div>
              </div>

            </div>
          );
        })}

        {clientIncomeList.length === 0 && (
          <div className="text-center py-12 text-xs text-gray-500 bg-gray-950 rounded-2xl border border-dashed border-gray-850 p-4">
            No invoices have been billed to any customer this month.
          </div>
        )}
      </div>

    </div>
  );
}
