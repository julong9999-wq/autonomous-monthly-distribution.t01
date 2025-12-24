import React, { useState } from 'react';
import { Category, ETFData } from '../types';
import { Plus, Info, Loader2, WifiOff, CalendarRange } from 'lucide-react';

interface Props {
  data: ETFData[];
  onAddToPortfolio: (etf: ETFData) => void;
  onViewDetail: (etf: ETFData) => void;
  isLoading?: boolean;
}

const PerformanceQuery: React.FC<Props> = ({ data, onAddToPortfolio, onViewDetail, isLoading = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.Q1);
  
  const filteredData = data.filter(etf => etf.category === selectedCategory);
  const categories = [Category.Q1, Category.Q2, Category.Q3, Category.Monthly, Category.Bond];

  const getRowColorClass = (etf: ETFData) => {
    const colors = {
      blue: 'bg-blue-50/50 border-blue-100',
      green: 'bg-emerald-50/50 border-emerald-100',
      orange: 'bg-orange-50/40 border-orange-100',
      amber: 'bg-amber-50/50 border-amber-100'
    };

    if (etf.category === Category.Q1) return colors.blue;
    if (etf.category === Category.Q2) return colors.green;
    if (etf.category === Category.Q3) return colors.orange;
    if (etf.category === Category.Monthly) return colors.amber;
    
    // Bond category special handling
    if (etf.category === Category.Bond) {
      if (['00937B', '00772B', '00933B', '00773B'].includes(etf.code)) return colors.amber;
      if (['00720B', '00725B', '00724B'].includes(etf.code)) return colors.blue;
      if (['00679B', '00761B', '00795B'].includes(etf.code)) return colors.green;
      if (['00687B', '00751B', '00792B'].includes(etf.code)) return colors.orange;
      return colors.amber;
    }

    return 'bg-white border-slate-200';
  };

  return (
    <div className="h-full flex flex-col animate-fade-in bg-white">
      {/* Header Section */}
      <div className="flex-none px-3 py-3 border-b border-blue-100 bg-blue-50/50 z-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-black text-primary flex items-center gap-2 whitespace-nowrap">
            績效查詢
          </h2>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mask-linear-fade">
             <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-blue-100 shadow-sm whitespace-nowrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">起始</span>
                <span className="text-xs font-black text-slate-700 font-mono">2025/01/02</span>
             </div>
             <div className="w-2 h-[1px] bg-slate-300 shrink-0"></div>
             <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-blue-100 shadow-sm whitespace-nowrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">近日</span>
                <span className="text-xs font-black text-primary font-mono">2025/12/23</span>
             </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 border ${
                selectedCategory === cat
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-blue-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/20">
        
        {/* Loading State */}
        {isLoading && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-3 text-primary" size={32} />
            <p className="text-sm font-bold">正在載入 2025 預估報告數據...</p>
          </div>
        )}

        {/* Empty State / Error */}
        {!isLoading && filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <WifiOff className="mb-3 text-slate-300" size={48} />
             <p className="text-sm font-bold mb-1">查無資料</p>
             <p className="text-xs opacity-70">請確認資料來源</p>
          </div>
        )}

        {filteredData.map(etf => (
          <div key={etf.code} className={`rounded-xl border shadow-sm p-3 transition-transform active:scale-[0.98] ${getRowColorClass(etf)}`}>
            {/* Row 1: Code and Name */}
            <div className="flex items-baseline gap-2 mb-2 pb-1.5 border-b border-black/5">
              <span className="text-xl font-black text-primary leading-none">{etf.code}</span>
              <span className="text-base font-bold text-slate-700 leading-none truncate">{etf.name}</span>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                {/* Row 2: Recent Price, Yield, Return Rate */}
                <div className="grid grid-cols-3 gap-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 mb-0.5">近日股價</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg font-black text-slate-900 leading-none">{etf.priceRecent}</span>
                      <span className="text-[10px] font-bold text-slate-500">元</span>
                    </div>
                  </div>
                  <div className="flex flex-col text-center">
                    <span className="text-[10px] font-bold text-slate-400 mb-0.5">殖利率</span>
                    <span className="text-lg font-black text-blue-700 leading-none">{etf.yield}%</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-slate-400 mb-0.5">報酬率</span>
                    <span className={`text-lg font-black leading-none ${etf.returnRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {etf.returnRate > 0 ? '+' : ''}{etf.returnRate}%
                    </span>
                  </div>
                </div>

                {/* Row 3: Start Price, Est Yield, Return Rate with Div - Updated to match Row 2 size */}
                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-black/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 mb-0.5">起始股價</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg font-black text-slate-700 leading-none">{etf.priceStart}</span>
                      <span className="text-[10px] font-bold text-slate-500">元</span>
                    </div>
                  </div>
                  <div className="flex flex-col text-center">
                    <span className="text-[10px] font-bold text-slate-400 mb-0.5">預估殖利率</span>
                    <span className="text-lg font-black text-blue-700 leading-none">{etf.estYield}%</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-slate-400 mb-0.5">含息報酬</span>
                    <span className={`text-lg font-black leading-none ${etf.returnRateWithDiv >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                       {etf.returnRateWithDiv > 0 ? '+' : ''}{etf.returnRateWithDiv}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col justify-center gap-2 pl-2 border-l border-black/10">
                <button 
                  onClick={() => onViewDetail(etf)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary transition-colors"
                >
                  <div className="flex flex-col items-center">
                    <Info size={18} />
                    <span className="text-[8px] font-bold mt-0.5 text-slate-400">詳情</span>
                  </div>
                </button>
                <button 
                  onClick={() => onAddToPortfolio(etf)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary text-white shadow-md active:scale-90 transition-transform"
                >
                   <Plus size={24} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceQuery;