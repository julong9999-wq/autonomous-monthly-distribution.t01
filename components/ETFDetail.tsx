import React from 'react';
import { ETFData, Category } from '../types';
import { ArrowLeft, Calendar, PlusCircle } from 'lucide-react';

interface Props {
  etf: ETFData;
  onBack: () => void;
  onAddToPortfolio: (etf: ETFData) => void;
}

const ETFDetail: React.FC<Props> = ({ etf, onBack, onAddToPortfolio }) => {
  const isMonthly = etf.category === Category.Monthly || etf.category === Category.Bond;
  const historyTitle = isMonthly ? "近 12 次配息紀錄" : "近 4 次配息紀錄";
  const sortedHistory = [...etf.dividendHistory].sort((a, b) => b.date.localeCompare(a.date));
  
  // Get current date for comparison
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');

  return (
    <div className="h-full flex flex-col bg-white animate-fade-in">
      {/* Sticky Header - Compact */}
      <div className="flex-none px-3 py-3 border-b border-slate-100 flex items-center justify-between bg-white z-20 shadow-sm">
        <button 
          onClick={onBack}
          className="p-2 -ml-1 text-slate-600 hover:text-primary rounded-full hover:bg-slate-50 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-black text-xl text-primary leading-tight tracking-tight">{etf.code}</span>
        </div>
        <button 
          onClick={() => onAddToPortfolio(etf)}
          className="p-2 -mr-1 text-primary hover:bg-blue-50 rounded-full transition-all active:scale-90"
        >
          <PlusCircle size={26} strokeWidth={2.5} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="text-center">
           <h1 className="text-base font-bold text-slate-700 tracking-tight mb-2.5">{etf.name}</h1>
           <div className="flex justify-center gap-2">
             <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider">{etf.category}</span>
             <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider">{etf.type}</span>
           </div>
        </div>

        {/* Highlight Stats Cards - Performance query matched sizes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100 shadow-sm">
            <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">目前股價</div>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-lg font-black text-slate-900 tracking-tighter">{etf.priceRecent}</span>
              <span className="text-[10px] font-bold text-slate-400">元</span>
            </div>
            <div className={`text-[10px] font-black mt-2 inline-flex items-center px-2 py-0.5 rounded-full ${etf.returnRate >= 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {etf.returnRate > 0 ? "▲" : "▼"} {Math.abs(etf.returnRate)}%
            </div>
          </div>
          <div className="bg-primary p-4 rounded-2xl text-center border border-primary shadow-lg shadow-primary/10">
             <div className="text-[10px] font-bold text-blue-200 mb-1 uppercase tracking-widest">年化殖利率</div>
             <div className="text-lg font-black text-white tracking-tighter">{etf.yield}%</div>
             <div className="text-[10px] text-blue-100 mt-2 font-black opacity-80">預估 {etf.estYield}%</div>
          </div>
        </div>

        {/* History Table - Synced with performance view style */}
        <div>
          <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
            <Calendar className="text-primary" size={18} /> {historyTitle}
          </h3>
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="text-slate-400 text-[9px] font-black bg-slate-50/80 border-b border-slate-100 uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3">除息日</th>
                  <th className="px-4 py-3 text-right">現金股息</th>
                  <th className="px-4 py-3 text-right">發放日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {sortedHistory.map((record, idx) => {
                  const isFuture = record.date > today;
                  return (
                    <tr 
                      key={idx} 
                      className={`transition-colors ${isFuture ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-blue-50/10 active:bg-blue-50/20'}`}
                    >
                      <td className={`px-4 py-3.5 font-bold text-sm leading-none ${isFuture ? 'text-red-700' : 'text-slate-700'}`}>
                        {record.date}
                        {isFuture && <span className="ml-1 text-[9px] bg-red-100 text-red-600 px-1 rounded">未除息</span>}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className={`font-black text-base leading-none ${isFuture ? 'text-red-700' : 'text-blue-700'}`}>
                          {record.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-400 text-[10px] leading-none">
                        {record.payDate.substring(5)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="py-8 border-t border-slate-50 text-[10px] text-slate-400 text-center font-black tracking-widest">
           * 數據僅供參考，實際配息以投信公告為準。
        </div>
      </div>
    </div>
  );
};

export default ETFDetail;