import React, { useState } from 'react';
import { Calendar as CalendarIcon, CheckCheck, RefreshCw, ChevronLeft, ChevronRight, User, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';


interface AttendanceCalendarProps {
  workers: any[];
  attendance: any[];
  onMarkAttendance: (workerId: string, date: string, status: 'Present' | 'HalfDay' | 'Absent') => Promise<void>;
  onBulkMarkPresent: (date: string) => Promise<void>;
  loading: boolean;
}

export default function AttendanceCalendar({
  workers,
  attendance,
  onMarkAttendance,
  onBulkMarkPresent,
  loading
}: AttendanceCalendarProps) {

  const { t } = useTranslation();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'date' | 'calendar'>('date');

  // Auto-initialize selected worker if none selected
  if (!selectedWorkerId && workers.length > 0) {
    setSelectedWorkerId(workers[0].id);
  }

  // Month names list
  const monthsHindi = [
    'जनवरी (January)', 'फ़रवरी (February)', 'मार्च (March)', 'अप्रैल (April)',
    'मई (May)', 'जून (June)', 'जुलाई (July)', 'अगस्त (August)',
    'सितम्बर (September)', 'अक्टूबर (October)', 'नवम्बर (November)', 'दिसम्बर (December)'
  ];

  // Get total days in currently selected year/month
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Build dates list for current month
  const totalDays = daysInMonth(currentMonth, currentYear);
  const calendarDays = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Helper stats for a worker in the current selected month
  const calculateMonthStats = (workerId: string) => {
    const workerRecords = attendance.filter(rec => {
      if (rec.worker_id !== workerId && rec.workerId !== workerId) return false;
      const recDate = new Date(rec.date);
      return recDate.getMonth() === currentMonth && recDate.getFullYear() === currentYear;
    });

    const present = workerRecords.filter(r => r.status === 'Present').length;
    const half = workerRecords.filter(r => r.status === 'HalfDay').length;
    const absent = workerRecords.filter(r => r.status === 'Absent').length;
    const calculatedWorked = present + (half * 0.5);

    return { present, half, absent, calculatedWorked };
  };

  const activeStats = selectedWorkerId ? calculateMonthStats(selectedWorkerId) : { present: 0, half: 0, absent: 0, calculatedWorked: 0 };

  // Generate formatted date string like "2026-05-18"
  const formatDateString = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  const handleCellClick = async (day: number) => {
    if (!selectedWorkerId) return;
    const dateStr = formatDateString(day);
    
    // Find current record
    const existing = attendance.find(r => 
      (r.worker_id === selectedWorkerId || r.workerId === selectedWorkerId) && 
      r.date === dateStr
    );

    // Loop through: Present -> HalfDay -> Absent -> deleted/Unmarked (we cycles them!)
    let nextStatus: 'Present' | 'HalfDay' | 'Absent' = 'Present';
    if (!existing) {
      nextStatus = 'Present';
    } else if (existing.status === 'Present') {
      nextStatus = 'HalfDay';
    } else if (existing.status === 'HalfDay') {
      nextStatus = 'Absent';
    } else {
      nextStatus = 'Present';
    }

    await onMarkAttendance(selectedWorkerId, dateStr, nextStatus);
  };

  return (
    <div className="bg-[#0e1321] border border-gray-800 p-5 rounded-3xl space-y-5 shadow-xl select-none">
      
      {/* Visual Tab Toggles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-800 pb-3">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-amber-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">
            {t('हाज़िरी एवं कैलेंडर (Attendance Suite)')}
          </h3>
        </div>

        <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 w-full sm:w-auto self-stretch sm:self-auto">
          <button
            onClick={() => setViewMode('date')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
              viewMode === 'date' ? 'bg-amber-500 text-white font-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('तारीख के अनुसार')}
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
              viewMode === 'calendar' ? 'bg-amber-500 text-white font-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t('मासिक कैलेंडर')}
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-6 text-xs text-gray-550 italic font-mono animate-pulse">
          {t('हाज़िरी अपडेट सिंक हो रही है...')}
        </div>
      )}

      {/* VIEW A: DATE-WISE SHEET FORM (BULK & QUICK TAP) */}
      {viewMode === 'date' && !loading && (
        <div className="space-y-4">
          <div className="bg-gray-950 p-4 rounded-2xl border border-gray-850 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div className="flex items-center space-x-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-gray-300">{t('हाजिरी की तारीख चुनें:')}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-[#0B0F1A] border border-gray-800 text-xs text-white p-2 rounded-xl focus:outline-none focus:border-amber-500 cursor-pointer font-bold font-mono text-center md:max-w-[160px]"
              />
            </div>

            {workers.length > 0 && (
              <button
                onClick={() => onBulkMarkPresent(selectedDate)}
                className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white text-emerald-400 font-extrabold text-[10.5px] uppercase tracking-wider py-2 px-4 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <CheckCheck className="h-4 w-4 shrink-0" />
                <span>{t('सभी को उपस्थित करें (Bulk Present Only)')}</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {workers.map(worker => {
              // Find matching record
              const match = attendance.find(rec => 
                (rec.worker_id === worker.id || rec.workerId === worker.id) && 
                rec.date === selectedDate
              );
              const status = match ? match.status : null;

              return (
                <div
                  key={worker.id}
                  className="bg-[#121625] border border-gray-850 p-3 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div>
                    <span className="text-xs font-black text-white">{worker.name}</span>
                    <span className="text-[10px] text-gray-400 block font-mono mt-0.5">
                      Rate: ₹{worker.daily_rate || worker.dailyRate}/Day • ID: #{worker.id.substring(0,4)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto">
                    <button
                      onClick={() => onMarkAttendance(worker.id, selectedDate, 'Present')}
                      className={`py-1.5 px-3 rounded-lg text-[9.5px] font-black uppercase text-center border transition cursor-pointer select-none ${
                        status === 'Present'
                          ? 'bg-emerald-500 border-emerald-400 text-white font-extrabold shadow-sm'
                          : 'bg-[#0B0F1A] border-gray-850 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {t('पूर्ण (P)')}
                    </button>
                    <button
                      onClick={() => onMarkAttendance(worker.id, selectedDate, 'HalfDay')}
                      className={`py-1.5 px-3 rounded-lg text-[9.5px] font-black uppercase text-center border transition cursor-pointer select-none ${
                        status === 'HalfDay'
                          ? 'bg-amber-500 border-amber-400 text-white font-extrabold shadow-sm'
                          : 'bg-[#0B0F1A] border-gray-850 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {t('आधा (½)')}
                    </button>
                    <button
                      onClick={() => onMarkAttendance(worker.id, selectedDate, 'Absent')}
                      className={`py-1.5 px-3 rounded-lg text-[9.5px] font-black uppercase text-center border transition cursor-pointer select-none ${
                        status === 'Absent'
                          ? 'bg-red-500 border-red-400 text-white font-extrabold'
                          : 'bg-[#0B0F1A] border-gray-850 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {t('अनु० (A)')}
                    </button>
                  </div>
                </div>
              );
            })}

            {workers.length === 0 && (
              <div className="text-center py-8 text-xs text-gray-500 bg-gray-950 rounded-2xl border border-dashed border-gray-850 font-bold">
                {t('पहले कारीगर लिस्ट में कारीगर जोड़ें!')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW B: MONTHLY GRID CALENDAR SPECIFIC TO SELECTED KARIGAR */}
      {viewMode === 'calendar' && !loading && (
        <div className="space-y-4">
          
          {/* Worker Select dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center bg-gray-950 p-4 rounded-xl border border-gray-850">
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">{t('कारीगर चुनें:')}</label>
              <select
                value={selectedWorkerId}
                onChange={e => setSelectedWorkerId(e.target.value)}
                className="w-full bg-[#0B0F1A] border border-gray-850 p-2.5 rounded-xl text-xs text-white font-black cursor-pointer"
              >
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Micro display info of month counts */}
            {selectedWorkerId && (
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                <div className="bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                  <span className="text-emerald-400 block font-mono text-sm">{activeStats.present}</span>
                  <span className="text-gray-400">P Days</span>
                </div>
                <div className="bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                  <span className="text-amber-400 block font-mono text-sm">{activeStats.half}</span>
                  <span className="text-gray-400">½ Days</span>
                </div>
                <div className="bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                  <span className="text-red-400 block font-mono text-sm">{activeStats.absent}</span>
                  <span className="text-gray-400">A Days</span>
                </div>
              </div>
            )}
          </div>

          {selectedWorkerId ? (
            <div className="space-y-4 animate-scaleUp">
              
              {/* Header Navigator months controls */}
              <div className="flex justify-between items-center bg-gray-950 px-4 py-2 rounded-2xl border border-gray-850">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 px-2.5 text-xs text-amber-500 hover:text-amber-400 font-black cursor-pointer"
                >
                  ◄ Prev
                </button>
                <div className="text-center">
                  <span className="text-xs font-bold text-white block">
                    {t(monthsHindi[currentMonth])} {currentYear}
                  </span>
                  <span className="text-[9.5px] text-emerald-400 font-mono font-bold block mt-0.5 uppercase tracking-wider">
                    Net Served: {activeStats.calculatedWorked} Present Units
                  </span>
                </div>
                <button
                  onClick={handleNextMonth}
                  className="p-1 px-2.5 text-xs text-amber-500 hover:text-amber-400 font-black cursor-pointer"
                >
                  Next ►
                </button>
              </div>

              {/* Grid block days */}
              <div className="grid grid-cols-7 gap-2.5">
                {/* Week headers */}
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((wd, dayIdx) => (
                  <div key={dayIdx} className="text-center font-mono text-[9px] text-gray-500 font-extrabold p-1.5 bg-gray-950/40 rounded">
                    {wd}
                  </div>
                ))}

                {/* Days cells */}
                {calendarDays.map(day => {
                  const dateStr = formatDateString(day);
                  const cellRec = attendance.find(r => 
                    (r.worker_id === selectedWorkerId || r.workerId === selectedWorkerId) && 
                    r.date === dateStr
                  );
                  const cellStatus = cellRec ? cellRec.status : null;

                  let bgClass = 'bg-[#0B0F1A] border-gray-900 text-gray-450 hover:bg-slate-900 hover:border-gray-800';
                  if (cellStatus === 'Present') bgClass = 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-extrabold';
                  if (cellStatus === 'HalfDay') bgClass = 'bg-amber-500/15 border-amber-500 text-amber-400 font-extrabold';
                  if (cellStatus === 'Absent') bgClass = 'bg-red-500/15 border-red-500 text-red-400 font-extrabold';

                  return (
                    <button
                      key={day}
                      onClick={() => handleCellClick(day)}
                      className={`aspect-square text-[11px] font-mono border rounded-xl flex flex-col justify-center items-center transition cursor-pointer ${bgClass}`}
                    >
                      <span>{day}</span>
                      {cellStatus && (
                        <span className="text-[7.5px] uppercase tracking-tighter opacity-70 block mt-0.5">
                          {cellStatus === 'Present' ? 'Full' : cellStatus === 'HalfDay' ? 'Half' : 'Abs'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Indicator color block label guidance */}
              <div className="bg-gray-950 border border-gray-850 text-[10px] text-gray-400 px-4 py-2 rounded-xl flex flex-wrap gap-4 justify-between leading-tight items-center">
                <span>{t('💡 तारीख पर टैप करें: स्टेटस बदलने के लिए।')}</span>
                <div className="flex items-center space-x-3 text-[9px] font-bold">
                  <span className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> <span>Present</span></span>
                  <span className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> <span>Half Day</span></span>
                  <span className="flex items-center space-x-1"><span className="h-2 w-2 rounded-full bg-red-500" /> <span>Absent</span></span>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-10 text-xs text-gray-550 italic font-medium font-bold">
              {t('कैलेंडर देखने के लिए कोई कारीगर चुनें!')}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
