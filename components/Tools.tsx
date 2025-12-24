import React, { useState } from 'react';
import { Calculator, ExternalLink, Search, FileSpreadsheet } from 'lucide-react';

const Tools: React.FC = () => {
  const [price, setPrice] = useState<number | ''>('');
  const [dividend, setDividend] = useState<number | ''>('');
  
  const calculateYield = () => {
    if (price && dividend) {
      return ((Number(dividend) / Number(price)) * 100).toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="animate-fade-in bg-white min-h-full">
      <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h2 className="text-2xl font-black text-primary flex items-center gap-3">
          <Calculator size={28} /> 工具與資源
        </h2>
      </div>

      <div className="p-6 space-y-12 pb-24">
        {/* Section 1: Yield Calculator */}
        <section>
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
            <div className="w-2 h-7 bg-accent rounded-full"></div>
            殖利率快速試算
          </h3>
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-black text-slate-500 mb-2 uppercase tracking-wide">股價 (元)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="如: 25.5"
                  className="w-full p-4 border-2 border-slate-200 rounded-2xl text-2xl bg-white font-black text-slate-800 outline-none focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-500 mb-2 uppercase tracking-wide">總股利 (元)</label>
                <input
                  type="number"
                  value={dividend}
                  onChange={(e) => setDividend(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="如: 1.8"
                  className="w-full p-4 border-2 border-slate-200 rounded-2xl text-2xl bg-white font-black text-slate-800 outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-6 border-t-2 border-slate-100">
               <span className="text-lg font-black text-slate-600">預估年化殖利率</span>
               <span className="text-5xl font-black text-blue-600 tracking-tighter">{calculateYield()}%</span>
            </div>
          </div>
        </section>

        {/* Section 2: Historical Price Guide */}
        <section>
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
             <div className="w-2 h-7 bg-blue-500 rounded-full"></div>
             歷史股價查詢 (2025/1/2)
          </h3>
          <div className="space-y-5">
             <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
               <div className="flex items-center gap-3 text-lg font-black text-blue-400 mb-4">
                 <FileSpreadsheet size={24}/> Google Sheets 公式
               </div>
               <div className="bg-slate-800 text-blue-100 p-4 rounded-xl text-base font-mono overflow-x-auto whitespace-nowrap mb-4 border border-slate-700">
                 =INDEX(GOOGLEFINANCE("TPE:0050", "price", "2025/01/02"), 2, 2)
               </div>
               <div className="text-sm text-slate-400 font-bold">
                 * 將 0050 替換為您的標的代號即可
               </div>
             </div>
             
             <div className="flex items-center gap-5 p-5 border-2 border-slate-100 rounded-3xl bg-white shadow-sm hover:border-primary transition-colors">
                <Search size={32} className="text-slate-300" />
                <div className="text-lg text-slate-700 font-bold">
                  前往 <span className="text-primary">Yahoo Finance</span> 查詢歷史資料
                </div>
             </div>
          </div>
        </section>

        {/* Section 3: Links */}
        <section>
          <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
             <div className="w-2 h-7 bg-indigo-500 rounded-full"></div>
             官方數據來源
          </h3>
          <div className="grid grid-cols-1 divide-y-2 divide-slate-50 border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm">
             <a href="https://mops.twse.com.tw" target="_blank" className="p-6 bg-white hover:bg-slate-50 flex justify-between items-center group transition-all">
                <span className="text-xl font-black text-slate-700 group-hover:text-primary">公開資訊觀測站</span>
                <ExternalLink size={24} className="text-slate-300 group-hover:text-primary" />
             </a>
             <a href="https://goodinfo.tw" target="_blank" className="p-6 bg-white hover:bg-slate-50 flex justify-between items-center group transition-all">
                <span className="text-xl font-black text-slate-700 group-hover:text-primary">Goodinfo! 台灣股市資訊網</span>
                <ExternalLink size={24} className="text-slate-300 group-hover:text-primary" />
             </a>
             <a href="https://is.twse.com.tw/is/etf/index.jsp" target="_blank" className="p-6 bg-white hover:bg-slate-50 flex justify-between items-center group transition-all">
                <span className="text-xl font-black text-slate-700 group-hover:text-primary">證交所 e 添富 (ETF專區)</span>
                <ExternalLink size={24} className="text-slate-300 group-hover:text-primary" />
             </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Tools;