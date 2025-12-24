import React, { useState, useEffect } from 'react';
import { PortfolioItem } from '../types';
import { generateDiagnosis } from '../services/geminiService';
import { Activity, ShieldCheck, PieChart, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  portfolio: PortfolioItem[];
}

const AIDiagnosis: React.FC<Props> = ({ portfolio }) => {
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (portfolio.length > 0) {
      handleDiagnosis();
    }
  }, [portfolio.length]);

  const handleDiagnosis = async () => {
    setLoading(true);
    const result = await generateDiagnosis(portfolio);
    setDiagnosis(result);
    setLoading(false);
  };

  if (portfolio.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
        <div className="bg-slate-100 p-6 rounded-full mb-6">
           <Activity size={40} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700">尚無投資組合</h2>
        <p className="text-base text-slate-500 mt-3">請先至「自組月月配」加入標的</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-white min-h-full">
      <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Activity size={24} /> AI 持股健檢
        </h2>
      </div>

      <div className="p-5 space-y-8">
        {/* Indicators - Larger Cards */}
        <div className="grid grid-cols-1 gap-4">
           <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-4 border border-blue-100 shadow-sm">
              <div className="bg-white p-3 rounded-full shadow-sm text-blue-500"><PieChart size={24}/></div>
              <div>
                <h4 className="text-lg font-bold text-blue-900">產業分散</h4>
                <p className="text-sm text-blue-700 opacity-90 mt-0.5">檢查是否過度集中特定產業</p>
              </div>
           </div>
           <div className="bg-indigo-50 p-4 rounded-xl flex items-center gap-4 border border-indigo-100 shadow-sm">
              <div className="bg-white p-3 rounded-full shadow-sm text-indigo-500"><Activity size={24}/></div>
              <div>
                <h4 className="text-lg font-bold text-indigo-900">收益均衡</h4>
                <p className="text-sm text-indigo-700 opacity-90 mt-0.5">分析各月份配息落差</p>
              </div>
           </div>
        </div>

        {/* Report Content */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">診斷報告</h3>
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 min-h-[200px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                 <Loader2 className="animate-spin text-primary mb-3" size={32} />
                 <span className="text-base font-medium">AI 思考中...</span>
              </div>
            ) : (
              <div className="prose prose-lg prose-slate max-w-none leading-relaxed text-slate-800">
                 {/* Style Injection for Mobile Card View for Diagnosis Table */}
                  <style>{`
                    @media (max-width: 768px) {
                      .diagnosis-table thead { display: none; }
                      .diagnosis-table tr { 
                        display: block; 
                        margin-bottom: 2rem; 
                        border: 1px solid #cbd5e1; 
                        border-radius: 1rem; 
                        background: white;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                      }
                      .diagnosis-table td { 
                        display: block; 
                        padding: 1.25rem;
                        border-bottom: 1px solid #f1f5f9;
                        text-align: left;
                        font-size: 1.05rem;
                      }
                      .diagnosis-table td:last-child { border-bottom: none; }
                      
                      /* Column 1: 檢查項目 */
                      .diagnosis-table td:nth-of-type(1) {
                         background-color: #eff6ff;
                         font-weight: 800;
                         color: #1e3a8a;
                         font-size: 1.25rem;
                         border-bottom: 2px solid #bfdbfe;
                      }
                      
                      /* Column 2: 現狀分析 */
                      .diagnosis-table td:nth-of-type(2)::before { 
                        content: "現狀分析"; 
                        display: block;
                        font-size: 0.9rem;
                        font-weight: bold; 
                        color: #64748b; 
                        margin-bottom: 0.5rem;
                      }

                      /* Column 3: 優化建議 */
                      .diagnosis-table td:nth-of-type(3) {
                         background-color: #f0fdf4;
                      }
                      .diagnosis-table td:nth-of-type(3)::before { 
                         content: "優化建議"; 
                         display: block;
                         font-size: 0.9rem;
                         font-weight: bold; 
                         color: #059669; 
                         margin-bottom: 0.5rem;
                      }
                    }
                  `}</style>
                 <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({node, ...props}) => (
                        <div className="w-full my-6">
                          <table className="w-full text-base text-left diagnosis-table" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 hidden md:table-header-group" {...props} />,
                      tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-100" {...props} />,
                      tr: ({node, ...props}) => <tr className="hover:bg-slate-50 transition-colors md:table-row" {...props} />,
                      th: ({node, ...props}) => <th className="px-4 py-3 whitespace-nowrap" {...props} />,
                      td: ({node, ...props}) => <td className="px-4 py-3 text-slate-700 align-top" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 last:mb-0 text-lg leading-8" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-700 text-lg" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-slate-700 text-lg" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-primary font-bold" {...props} />,
                    }}
                  >
                    {diagnosis}
                  </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
        
        <button 
           onClick={handleDiagnosis} 
           disabled={loading}
           className="w-full py-4 bg-white border-2 border-primary text-primary font-bold rounded-xl text-lg hover:bg-blue-50 active:scale-95 transition-transform shadow-sm"
        >
           重新診斷
        </button>
      </div>
    </div>
  );
};

export default AIDiagnosis;