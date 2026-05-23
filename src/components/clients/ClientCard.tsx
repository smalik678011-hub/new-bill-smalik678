import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Calendar, ArrowRight, User } from 'lucide-react';
import { motion } from 'motion/react';
import { Client } from '../../types';

interface ClientCardProps {
  client: Client & {
    address?: string;
    source?: string;
    status?: string;
    deadline?: string;
    notes?: string;
    lastActivityDate?: string;
  };
  dueDateSum?: number; // pass real-time due amount calculated dynamically
}

const ClientCard: React.FC<ClientCardProps> = ({ client, dueDateSum }) => {
  const navigate = useNavigate();
  
  // Choose total due from props or store fallback
  const finalDue = dueDateSum !== undefined ? dueDateSum : client.totalDue;
  
  // Decide Traffic Light status based on deadlines of work and due payments
  let statusText = client.status || 'Active';
  let statusColorClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  let statusDotClass = 'bg-emerald-500';

  if (finalDue > 0) {
    statusText = 'Pending';
    statusColorClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    statusDotClass = 'bg-rose-500';
  } else if (finalDue < 0) {
    statusText = 'Advance';
    statusColorClass = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    statusDotClass = 'bg-purple-500';
  } else {
    statusText = 'Cleared';
    statusColorClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    statusDotClass = 'bg-emerald-500';
  }

  // If there is a deadline and the deadline is crossed and there is positive due, mark as overdrive!
  const todayStr = new Date().toISOString().split('T')[0];
  if (client.deadline && client.deadline < todayStr && finalDue > 0) {
    statusText = 'Overdue';
    statusColorClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    statusDotClass = 'bg-rose-500 animate-ping';
  }

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!client.phone || client.phone === 'NA') return;
    window.location.href = `tel:${client.phone}`;
  };

  return (
    <motion.div 
      onClick={() => navigate(`/clients/${client.id}`)}
      className="bg-gray-900/90 border border-gray-800/80 hover:border-amber-500/40 rounded-2xl p-4.5 cursor-pointer shadow hover:shadow-md flex flex-col justify-between space-y-3"
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-gray-850 to-gray-900 border border-gray-800 flex items-center justify-center text-amber-500 flex-shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black text-white hover:text-amber-500 transition-colors truncate">
              {client.name}
            </h4>
            
            {/* Status light badge */}
            <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[9px] font-black tracking-wide ${statusColorClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full mr-1 ${statusDotClass}`} />
              {statusText}
            </span>
          </div>
        </div>

        {/* Due Balance Display */}
        <div className="text-right">
          <span className="text-[9.5px] text-gray-500 uppercase tracking-widest font-mono font-bold block">
            {finalDue > 0 ? 'Dues Outstanding' : finalDue < 0 ? 'Advance Deposited' : 'All Balanced'}
          </span>
          <span className={`text-sm font-black ${finalDue > 0 ? 'text-rose-400' : finalDue < 0 ? 'text-purple-400' : 'text-gray-400'}`}>
            {(finalDue ?? 0) === 0 ? '₹0' : '₹' + Math.abs(finalDue ?? 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Middle row: Address & phone */}
      <div className="flex flex-col space-y-1 bg-[#0B0F1A]/30 p-2.5 rounded-xl border border-gray-850">
        {client.phone && client.phone !== 'NA' && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-bold">Contact Phone:</span>
            <button 
              onClick={handleCall}
              className="text-amber-500 hover:text-amber-400 font-extrabold flex items-center space-x-1 hover:underline cursor-pointer"
            >
              <Phone className="h-3 w-3 mr-0.5" />
              <span>{client.phone}</span>
            </button>
          </div>
        )}

        {client.deadline && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-bold">Work Deadline:</span>
            <span className="text-gray-350 font-bold flex items-center">
              <Calendar className="h-3 w-3 mr-1 text-amber-500" />
              {client.deadline}
            </span>
          </div>
        )}

        {client.lastActivityDate && (
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">Last Activity:</span>
            <span className="text-gray-400 font-mono text-right">{client.lastActivityDate}</span>
          </div>
        )}
      </div>

      {/* Action Footer banner */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-850/60 text-[10.5px]">
        <span className="text-gray-500 text-[10px]">
          {client.source ? `Source: ${client.source}` : 'Registry: Direct'}
        </span>
        <span className="text-amber-500 font-black flex items-center space-x-1 group">
          <span>View Ledger</span>
          <ArrowRight className="h-3 w-3 transform group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </motion.div>
  );
};

export default ClientCard;
