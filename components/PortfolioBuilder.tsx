import React, { useState, useMemo, useEffect } from 'react';
import { PortfolioItem, Transaction, Category, ETFData } from '../types';
import { calculateFee } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Edit2, X, Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  portfolio: PortfolioItem[];
  etfList: ETFData[];
  onUpdatePortfolio: (updatedPortfolio: PortfolioItem[]) => void;
  onNavigateToPerformance: () => void;
}

const PortfolioBuilder: React.FC<Props> = ({ portfolio, etfList, onUpdatePortfolio, onNavigateToPerformance }) => {
  const [activeEtfCode, setActiveEtfCode] = useState<string | null>(null);
  const [confirmDeleteCode, setConfirmDeleteCode] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formShares, setFormShares] = useState<number>(1000); 
  const [formPrice, setFormPrice] = useState<number>(0);

  // Auto-reset delete confirmation after 3 seconds
  useEffect(() => {
    if (confirmDeleteCode) {
      const timer = setTimeout(() => setConfirmDeleteCode(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDeleteCode]);

  const handleEditOpen = (e: React.MouseEvent, item: PortfolioItem) => {
    e.stopPropagation();
    setActiveEtfCode(item.code);
    const totalShares = item.transactions.reduce((sum, t) => sum + t.shares, 0);
    const totalCost = item.transactions.reduce((sum, t) => sum + t.totalCost, 0);
    const avgPrice = totalShares > 0 ? totalCost / totalShares : 0;

    setFormShares(totalShares > 0 ? totalShares : 1000);
    const etfInfo = etfList.find(e => e.code === item.code);
    setFormPrice(avgPrice > 0 ? parseFloat(avgPrice.toFixed(2)) : (etfInfo?.priceRecent || 0));
  };

  const handleDeleteClick = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirmDeleteCode === code) {
      // Second click: Perform actual delete
      const updated = portfolio.filter(item => item.code !== code);
      onUpdatePortfolio([...updated]); // Push fresh array reference
      setConfirmDeleteCode(null);
    } else {
      // First click: Enter confirmation mode
      setConfirmDeleteCode(code);
    }
  };

  const handleAddTransaction = () => {
    if (!activeEtfCode) return;
    const fee = calculateFee(formPrice, formShares);
    const totalCost = (formPrice * formShares) + fee;
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date: formDate,
      shares: formShares,
      price: formPrice,
      fee: fee,
      totalCost: totalCost
    };
    const updated = portfolio.map(item => {
      if (item.code === activeEtfCode) {
        return { ...item, transactions: [...item.transactions, newTransaction] };
      }
      return item;
    });
    onUpdatePortfolio(updated);
    setActiveEtfCode(null);
  };

  const handleOverwritePortfolio = () => {
    if (!activeEtfCode) return;
    const fee = calculateFee(formPrice, formShares);
    const totalCost = (formPrice * formShares) + fee;
    const correctiveTransaction: Transaction = {
      id: Date.now().toString(),
      date: formDate,
      shares: formShares,
      price: formPrice,
      fee: fee,
      totalCost: totalCost
    };

    const updated = portfolio.map(item => {
      if (item.code === activeEtfCode) {
        return { ...item, transactions: [correctiveTransaction] };
      }
      return item;
    });
    onUpdatePortfolio(updated);
    setActiveEtfCode(null);
  };

  const masterData = useMemo(() => {
    return portfolio.map(item => {
      const totalShares = item.transactions.reduce((sum, t) => sum + t.shares, 0);
      const totalCost = item.transactions.reduce((sum, t) => sum + t.totalCost, 0);
      const avgCost = totalShares > 0 ? (totalCost / totalShares).toFixed(2) : "0";
      // Use etfList prop instead of importing ETF_DATABASE directly
      const etfInfo = etfList.find(e => e.code === item.code);
      const annualYield = etfInfo ? etfInfo.yield : 5;
      const currentMarketValue = totalShares * (etfInfo?.priceRecent || 0);
      const estAnnualDividend = currentMarketValue * (annualYield / 100);

      return { ...item, totalShares, totalCost, avgCost, annualYield, etfInfo, currentMarketValue, estAnnualDividend };
    });
  }, [portfolio, etfList]);

  const totalInvestment = masterData.reduce((sum, item) => sum + item.totalCost, 0);
  const totalEstDividend = masterData.reduce((sum, item) => sum + item.estAnnualDividend, 0);

  const getRowColorClass = (category?: Category, code?: string) => {
    const colors = {
      blue: 'bg-blue-50/40 border-blue-100',
      green: 'bg-emerald-50/40 border-emerald-100',
      orange: 'bg-orange-50/40 border-orange-100',
      amber: 'bg-amber-50/40 border-amber-100'
    };
    if (category === Category.Q1) return colors.blue;
    if (category === Category.Q2) return colors.green;
    if (category === Category.Q3) return colors.orange;
    if (category === Category.Monthly) return colors.amber;
    if (category === Category.Bond) {
      if (['00937B', '00772B', '00933B', '00773B'].includes(code || '')) return colors.amber;
      if (['00720B', '00725B', '00724B'].includes(code || '')) return colors.blue;
      if (['00679B', '00761B', '00795B'].includes(code || '')) return colors.green;
      if (['00687B', '00751B', '00792B'].includes(code || '')) return colors.orange;
    }
    return 'bg-white border-slate-100';
  };

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    let estimatedDividend = 0;
    masterData.forEach(item => {
      if (!item.etfInfo) return;
      const cat = item.etfInfo.category;
      const code = item.code;
      let isPayMonth = false;
      let frequency = 1;
      if (cat === Category.Monthly) { isPayMonth = true; frequency = 12; }
      else if (cat === Category.Bond) {
        if (['00937B', '00772B', '00933B', '00773B'].includes(code)) { isPayMonth = true; frequency = 12; }
        else if (['00679B', '00761B', '00795B'].includes(code)) { if ([2, 5, 8, 11].includes(month)) isPayMonth = true; frequency = 4; }
        else if (['00687B', '00751B', '00792B'].includes(code)) { if ([3, 6, 9, 12].includes(month)) isPayMonth = true; frequency = 4; }
        else { if ([1, 4, 7, 10].includes(month)) isPayMonth = true; frequency = 4; }
      } else if (cat === Category.Q1) { if ([1, 4, 7, 10].includes(month)) isPayMonth = true; frequency = 4; }
      else if (cat === Category.Q2) { if ([2, 5, 8, 11].includes(month)) isPayMonth = true; frequency = 4; }
      else if (cat === Category.Q3) { if ([3, 6, 9, 12].includes(month)) isPayMonth = true; frequency = 4; }
      if (isPayMonth) estimatedDividend += (item.currentMarketValue * (item.annualYield / 100)) / frequency;
    });
    return { name: `${month}月`, 股息: Math.floor(estimatedDividend) };
  });

  return (
    <div className="animate-fade-in bg-white min-h-full pb-20" onClick={() => setConfirmDeleteCode(null)}>
      <div className="px-3 py-3 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
        <h2 className="text-xl font-black text-primary">投資組合</h2>
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onNavigateToPerformance(); }} 
          className="flex items-center gap-1 text-[11px] bg-primary text-white px-3 py-1.5 rounded-full font-black active:scale-95 transition-all"
        >
          <Plus size={14} strokeWidth={4} /> 新增標的
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Compact Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-center">
            <div className="text-[10px] font-bold text-blue-500 mb-0.5 uppercase tracking-wider">總投資</div>
            <div className="text-lg font-black text-blue-900">{(totalInvestment/10000).toFixed(1)}<span className="text-[10px] ml-0.5">萬</span></div>
          </div>
          <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-center">
             <div className="text-[10px] font-bold text-emerald-600 mb-0.5 uppercase tracking-wider">年息</div>
             <div className="text-lg font-black text-emerald-900">{Math.floor(totalEstDividend).toLocaleString()}<span className="text-[10px] ml-0.5">元</span></div>
          </div>
          <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-200 text-center">
             <div className="text-[10px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">標的</div>
             <div className="text-lg font-black text-slate-900">{portfolio.length}</div>
          </div>
        </div>

        {/* List View */}
        <div className="space-y-3">
           {masterData.map(item => (
             <div key={item.code} className={`rounded-xl border shadow-sm p-3 transition-transform ${getRowColorClass(item.etfInfo?.category, item.code)}`}>
                <div className="flex items-baseline gap-2 mb-2 pb-2 border-b border-black/5">
                  <span className="text-xl font-black text-primary leading-none">{item.code}</span>
                  <span className="text-base font-bold text-slate-700 leading-none truncate flex-1">{item.name}</span>
                  <span className="text-[9px] font-black text-white bg-primary/80 px-1.5 py-0.5 rounded uppercase">{item.etfInfo?.category}</span>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-bold text-slate-400">持有</span>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-lg font-black text-slate-900 leading-none">
                            {item.totalShares % 1000 === 0 ? (item.totalShares / 1000) : (item.totalShares / 1000).toFixed(1)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">張</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400">市值</span>
                        <div className="flex items-baseline justify-center gap-0.5">
                          <span className="text-lg font-black text-blue-700 leading-none">{(item.currentMarketValue / 10000).toFixed(1)}</span>
                          <span className="text-[10px] font-bold text-blue-500">萬</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-bold text-slate-400">股息</span>
                        <div className="flex items-baseline justify-end gap-0.5">
                          <span className="text-lg font-black text-emerald-600 leading-none">{Math.floor(item.estAnnualDividend).toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-emerald-500">元</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-black/5 text-[10px] font-bold text-slate-500">
                      <span className="truncate text-left tracking-tighter">成本 {item.avgCost}</span>
                      <span className="text-center">殖利率 {item.annualYield}%</span>
                      <span className="text-right truncate tracking-tighter">投入 {(item.totalCost / 10000).toFixed(1)}萬</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pl-2 border-l border-black/10">
                    <button 
                      type="button"
                      onClick={(e) => handleDeleteClick(e, item.code)} 
                      className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 shadow-sm border ${
                        confirmDeleteCode === item.code 
                          ? 'bg-red-600 border-red-700 text-white scale-105' 
                          : 'bg-white border-red-100 text-red-500 active:bg-red-50'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        {confirmDeleteCode === item.code ? <AlertCircle size={18} /> : <Trash2 size={18} />}
                        <span className={`text-[8px] font-black mt-0.5 ${confirmDeleteCode === item.code ? 'text-white' : 'text-red-500'}`}>
                          {confirmDeleteCode === item.code ? '確定？' : '刪除'}
                        </span>
                      </div>
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => handleEditOpen(e, item)} 
                      className="w-11 h-11 flex items-center justify-center rounded-xl bg-primary text-white shadow-md active:scale-90 transition-transform"
                    >
                       <div className="flex flex-col items-center">
                        <Edit2 size={18} />
                        <span className="text-[8px] font-black mt-0.5">編輯</span>
                      </div>
                    </button>
                  </div>
                </div>
             </div>
           ))}
           {masterData.length === 0 && (
             <div className="text-center py-12 text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-sm font-black">點擊右上角新增標的到您的組合吧！</p>
             </div>
           )}
        </div>

        {/* Chart */}
        {masterData.length > 0 && (
           <div className="h-52 w-full pt-4 border-t border-slate-100">
             <h3 className="text-xs font-black text-slate-500 mb-3 flex items-center gap-1.5 uppercase tracking-widest">
                <RefreshCw size={12} className="text-primary animate-spin-slow" /> 預估每月股息分佈 (元)
             </h3>
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData} margin={{top:5, right:5, left:-25, bottom:0}}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                 <YAxis tick={{fontSize: 10, fontWeight: 700, fill: '#cbd5e1'}} axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                 <Bar dataKey="股息" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        )}
      </div>

      {activeEtfCode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-5 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[300px] p-5 animate-fade-in-up">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">編輯交易 <span className="text-primary">{activeEtfCode}</span></h3>
              <button onClick={() => setActiveEtfCode(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">交易日期</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">股數</label>
                  <input type="number" value={formShares} onChange={(e) => setFormShares(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl p-3 text-lg font-black text-primary bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">成交單價</label>
                  <input type="number" value={formPrice} onChange={(e) => setFormPrice(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl p-3 text-lg font-black text-primary bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={handleOverwritePortfolio} 
                className="flex items-center justify-center gap-1.5 bg-white border-2 border-red-200 text-red-500 py-3 rounded-xl font-black text-xs active:scale-95 transition-transform"
              >
                <RefreshCw size={14} strokeWidth={3} /> 重設部位
              </button>
              <button 
                type="button"
                onClick={handleAddTransaction} 
                className="flex items-center justify-center gap-1.5 bg-primary text-white py-3 rounded-xl font-black text-xs active:scale-95 transition-transform shadow-lg"
              >
                <Plus size={16} strokeWidth={4} /> 新增交易
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioBuilder;