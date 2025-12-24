import React, { useState } from 'react';
import { generateSmartPlan } from '../services/geminiService';
import { Mic, PlayCircle, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ETFData } from '../types';

interface Props {
  etfList: ETFData[];
}

const SmartPlanning: React.FC<Props> = ({ etfList }) => {
  const [amount, setAmount] = useState<number>(500);
  const [prompt, setPrompt] = useState<string>("股債配置 80 : 20 , 股票產業分散 ,季配型各季 * 1 , 月配 * 2 , 均衡股息收入");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handlePlan = async () => {
    setLoading(true);
    // Pass the etfList to the service
    const plan = await generateSmartPlan(amount, prompt, etfList);
    setResult(plan);
    setLoading(false);
  };

  return (
    <div className="animate-fade-in bg-white min-h-full flex flex-col">
      <div className="p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Sparkles size={24} /> 智慧規劃
        </h2>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* Input Section */}
        <div className="space-y-5">
          <div>
            <label className="block text-base font-bold text-slate-700 mb-2">
              規劃金額 (萬元)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-4 border border-slate-300 bg-slate-50 rounded-xl text-xl font-bold text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-slate-700 mb-2">
              您的需求 (可輸入或語音)
            </label>
            <div className="relative">
              <textarea
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-4 border border-slate-300 bg-slate-50 rounded-xl text-base leading-relaxed text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none resize-none focus:bg-white transition-colors"
              />
              <button className="absolute bottom-3 right-3 p-3 bg-white shadow border border-slate-200 rounded-full text-slate-500 hover:text-primary">
                <Mic size={20} />
              </button>
            </div>
          </div>

          <button
            onClick={handlePlan}
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <PlayCircle size={24} />}
            {loading ? "AI 分析中..." : "開始規劃"}
          </button>
        </div>

        {/* Result Section */}
        {result && (
          <div className="mt-8 pt-6 border-t border-slate-200">
             <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">AI 建議方案</h3>
             <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm">
               <div className="prose prose-lg prose-slate max-w-none leading-relaxed text-slate-800">
                  {/* Style Injection for Mobile Card View */}
                  <style>{`
                    @media (max-width: 768px) {
                      .responsive-table thead { display: none; }
                      .responsive-table tr { 
                        display: block; 
                        margin-bottom: 1.5rem; 
                        border: 1px solid #cbd5e1; 
                        border-radius: 0.75rem; 
                        background: white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                        padding: 0.5rem;
                      }
                      .responsive-table td { 
                        display: flex; 
                        justify-content: space-between;
                        align-items: flex-start;
                        padding: 0.75rem 0.5rem;
                        border-bottom: 1px solid #f1f5f9;
                        text-align: right;
                        font-size: 1rem;
                      }
                      .responsive-table td:last-child { border-bottom: none; }
                      
                      /* Inject Labels */
                      .responsive-table td:nth-of-type(1)::before { content: "標的"; font-weight: bold; color: #475569; margin-right: 1em; text-align: left;}
                      .responsive-table td:nth-of-type(2)::before { content: "配置"; font-weight: bold; color: #475569; margin-right: 1em; text-align: left;}
                      .responsive-table td:nth-of-type(3)::before { content: "金額"; font-weight: bold; color: #475569; margin-right: 1em; text-align: left;}
                      .responsive-table td:nth-of-type(4) { flex-direction: column; text-align: left; background-color: #f8fafc; margin: 0.5rem -0.5rem -0.5rem -0.5rem; padding: 1rem; border-top: 1px solid #e2e8f0; border-radius: 0 0 0.5rem 0.5rem;}
                      .responsive-table td:nth-of-type(4)::before { content: "投資理由"; font-weight: bold; color: #475569; margin-bottom: 0.5rem; display: block; font-size: 0.9rem;}
                    }
                  `}</style>

                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({node, ...props}) => (
                        <div className="w-full my-6">
                          <table className="w-full text-base text-left responsive-table" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => <thead className="bg-blue-50 text-blue-900 font-bold hidden md:table-header-group" {...props} />,
                      tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-100" {...props} />,
                      tr: ({node, ...props}) => <tr className="hover:bg-slate-50/80 transition-colors md:table-row" {...props} />,
                      th: ({node, ...props}) => <th className="px-4 py-3 whitespace-nowrap border-b border-blue-100" {...props} />,
                      td: ({node, ...props}) => <td className="px-4 py-3 text-slate-700" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 last:mb-0 text-base leading-7" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-700" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-slate-700" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-primary font-bold text-lg" {...props} />,
                    }}
                  >
                    {result}
                  </ReactMarkdown>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartPlanning;