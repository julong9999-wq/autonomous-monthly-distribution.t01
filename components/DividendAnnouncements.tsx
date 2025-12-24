import React from 'react';
import { ETFData } from '../types';
import { Bell, CalendarClock } from 'lucide-react';

interface Props {
  etfList: ETFData[];
}

const DividendAnnouncements: React.FC<Props> = ({ etfList }) => {
  // Get current date in YYYY/MM/DD format to match data source
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');

  // Flatten dividend history, filter for future dates, and sort ascending (nearest first)
  const announcements = etfList.flatMap(etf => 
    etf.dividendHistory
      .filter(record => record.date >= today) // Only show future/upcoming ex-div dates
      .map(record => ({
        ...etf,
        exDivDate: record.date,
        payDate: record.payDate,
        amount: record.amount.toFixed(2)
      }))
  ).sort((a, b) => a.exDivDate.localeCompare(b.exDivDate));

  return (
    <div className="animate-fade-in bg-white min-h-full">
      <div className="px-3 py-3 border-b border-slate-100 sticky top-0 bg-white z-10 flex justify-between items-center shadow-sm">
        <h2 className="text-xl font-black text-primary flex items-center gap-2">
          <Bell size={20} className="text-accent" /> 近期配息公告
        </h2>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full flex items-center gap-1">
           <CalendarClock size={12} />
           僅顯示未除息標的
        </span>
      </div>

      <div className="overflow-x-auto pb-20">
        <table className="w-full text-left border-collapse">
          <thead className="text-[10px] font-black text-slate-400 bg-white uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-3 py-2.5">標的代號</th>
              <th className="px-1 py-2.5 text-right">金額</th>
              <th className="px-3 py-2.5 text-center">除息日</th>
              <th className="px-3 py-2.5 text-center">發放日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {announcements.map((item, idx) => (
              <tr key={idx} className="hover:bg-blue-50/20 active:bg-blue-50/50 transition-colors">
                <td className="px-3 py-3">
                  <div className="text-xl font-black text-primary leading-none mb-0.5">{item.code}</div>
                  <div className="text-sm font-bold text-slate-600 truncate max-w-[120px]">{item.name}</div>
                </td>
                <td className="px-1 py-3 text-right">
                  <div className="text-lg font-black text-blue-700 leading-none">{item.amount}</div>
                  <div className="text-[9px] font-bold text-slate-400 mt-0.5">元/股</div>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-base font-black text-slate-700 bg-slate-100/80 px-1.5 py-0.5 rounded-md">{item.exDivDate.substring(5)}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-sm font-bold text-slate-400">{item.payDate.substring(5)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {announcements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <Bell size={48} className="mb-2 opacity-20" />
            <p className="font-bold">目前無即將除息的公告</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DividendAnnouncements;