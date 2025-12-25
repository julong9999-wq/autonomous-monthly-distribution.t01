import React, { useState, useEffect } from 'react';
import { ViewState, PortfolioItem, ETFData, Transaction } from './types';
import PerformanceQuery from './components/PerformanceQuery';
import PortfolioBuilder from './components/PortfolioBuilder';
import SmartPlanning from './components/SmartPlanning';
import AIDiagnosis from './components/AIDiagnosis';
import DividendAnnouncements from './components/DividendAnnouncements';
import Navigation from './components/Navigation';
import ETFDetail from './components/ETFDetail';
import { Coins, RefreshCw, KeyRound, X, Check, ExternalLink, CircleHelp, ShieldCheck, Zap, BookOpen } from 'lucide-react';
import { calculateFee } from './constants';
import { fetchLiveETFData } from './services/dataService';
import { USER_KEY_STORAGE } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('PERFORMANCE');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    try {
      const saved = localStorage.getItem('etf_portfolio_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  // Global State starts EMPTY. No hardcoded data here.
  const [globalEtfData, setGlobalEtfData] = useState<ETFData[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [selectedEtf, setSelectedEtf] = useState<ETFData | null>(null);

  // API Key Management State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false); // New Help Modal State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasUserKey, setHasUserKey] = useState(false);

  // Check for existing key on mount
  useEffect(() => {
    const key = localStorage.getItem(USER_KEY_STORAGE);
    if (key) {
      setApiKeyInput(key);
      setHasUserKey(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (!apiKeyInput.trim()) {
      localStorage.removeItem(USER_KEY_STORAGE);
      setHasUserKey(false);
    } else {
      localStorage.setItem(USER_KEY_STORAGE, apiKeyInput.trim());
      setHasUserKey(true);
    }
    setShowKeyModal(false);
  };

  // Fetch Live Data (From CSV) on Mount
  useEffect(() => {
    const initData = async () => {
      setIsUpdating(true);
      try {
        const liveData = await fetchLiveETFData();
        setGlobalEtfData(liveData);
        // Set the report date from the PDF context - Removed "(預估)"
        setLastUpdate('2025/12/23');
      } catch (e) {
        console.error("Failed to fetch live data", e);
      } finally {
        setIsUpdating(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    localStorage.setItem('etf_portfolio_v2', JSON.stringify(portfolio));
  }, [portfolio]);

  const handleAddToPortfolio = (etf: ETFData) => {
    // 只有當股價大於 0 時才建議加入
    if (etf.priceRecent <= 0) {
        alert("此標的目前無報價資料，無法計算成本。");
        return;
    }

    setPortfolio(prev => {
      if (prev.find(p => p.code === etf.code)) {
        alert(`${etf.name} 已在您的投資組合中`);
        return prev;
      }

      const targetBudget = 500000;
      const price = etf.priceRecent;
      // Calculate full lots (1000 shares per lot) to avoid decimal lots
      const shares = Math.floor(targetBudget / (price * 1000)) * 1000;
      const fee = calculateFee(price, shares);
      const totalCost = (price * shares) + fee;

      const initialTransaction: Transaction = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        shares: shares,
        price: price,
        fee: fee,
        totalCost: totalCost
      };

      const newItem: PortfolioItem = {
        code: etf.code,
        name: etf.name,
        transactions: [initialTransaction]
      };

      setCurrentView('PORTFOLIO');
      setSelectedEtf(null);
      return [...prev, newItem];
    });
  };

  const handleUpdatePortfolio = (newPortfolio: PortfolioItem[]) => {
    setPortfolio(newPortfolio);
  };

  const handleViewDetail = (etf: ETFData) => {
    setSelectedEtf(etf);
  };

  const handleBackFromDetail = () => {
    setSelectedEtf(null);
  };

  const handleSetView = (view: ViewState) => {
    setCurrentView(view);
    setSelectedEtf(null);
  };

  const renderContent = () => {
    if (selectedEtf) {
      return (
        <div className="h-full w-full bg-white">
          <ETFDetail 
            etf={selectedEtf} 
            onBack={handleBackFromDetail} 
            onAddToPortfolio={handleAddToPortfolio} 
          />
        </div>
      );
    }

    switch (currentView) {
      case 'PERFORMANCE':
        return (
          <div className="h-full w-full bg-white">
            <PerformanceQuery 
              data={globalEtfData}
              onAddToPortfolio={handleAddToPortfolio} 
              onViewDetail={handleViewDetail} 
              isLoading={isUpdating}
            />
          </div>
        );
      
      default:
        let Component;
        switch (currentView) {
          case 'PORTFOLIO':
            Component = (
              <PortfolioBuilder 
                portfolio={portfolio} 
                etfList={globalEtfData}
                onUpdatePortfolio={handleUpdatePortfolio} 
                onNavigateToPerformance={() => setCurrentView('PERFORMANCE')} 
              />
            );
            break;
          case 'PLANNING':
            Component = <SmartPlanning etfList={globalEtfData} />;
            break;
          case 'DIAGNOSIS':
            Component = <AIDiagnosis portfolio={portfolio} />;
            break;
          case 'ANNOUNCEMENTS':
            Component = <DividendAnnouncements etfList={globalEtfData} />;
            break;
          default:
            Component = null;
        }

        return (
          <div className="h-full w-full overflow-y-auto bg-slate-50 no-scrollbar">
             <div className="min-h-full">
               {Component}
             </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <header className="flex-none bg-primary text-white shadow-sm z-20">
        <div className="w-full px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="text-accent" size={24} />
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none">自主月月配</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-[10px] text-blue-100 opacity-80">穩定被動收入</p>
                {lastUpdate && (
                  <span className="text-[9px] bg-blue-800/50 px-1 rounded text-blue-200 flex items-center gap-0.5">
                    <RefreshCw size={8} className={isUpdating ? "animate-spin" : ""} />
                    {lastUpdate}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Help Button */}
            <button 
              onClick={() => setShowHelpModal(true)}
              className="p-2 rounded-full bg-white/10 border border-white/20 text-blue-100 hover:bg-white/20 active:scale-95 transition-all"
            >
               <CircleHelp size={20} strokeWidth={2.5} />
            </button>

            {/* API Key Settings Button */}
            <button 
              onClick={() => setShowKeyModal(true)}
              className={`p-2 rounded-full transition-all active:scale-95 border ${
                hasUserKey 
                  ? 'bg-white/10 border-white/20 text-accent hover:bg-white/20' 
                  : 'bg-accent border-accent text-primary animate-pulse hover:bg-accent/90'
              }`}
            >
               <KeyRound size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative w-full overflow-hidden">
        {renderContent()}
      </main>

      {!selectedEtf && (
        <div className="flex-none z-30">
          <Navigation currentView={currentView} setView={handleSetView} />
        </div>
      )}

      {/* Help / Instructions Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowHelpModal(false)}>
           <div className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center flex-none">
                 <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                   <BookOpen size={20} className="text-primary"/> 使用說明書
                 </h3>
                 <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
              </div>

              <div className="p-5 overflow-y-auto custom-scrollbar">
                 <div className="space-y-6">
                    {/* Section 1: API Key */}
                    <div className="space-y-2">
                       <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <div className="bg-accent/20 p-1.5 rounded-lg text-accent"><KeyRound size={16}/></div>
                          為什麼需要 API Key?
                       </h4>
                       <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                          本應用程式使用 Google 強大的 Gemini AI 來進行「智慧規劃」與「持股診斷」。為了啟用這些 AI 功能，Google 需要一把鑰匙 (API Key) 來驗證身份。
                       </p>
                    </div>

                    <div className="space-y-2">
                       <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <div className="bg-green-100 p-1.5 rounded-lg text-green-600"><Zap size={16}/></div>
                          這需要付費嗎？
                       </h4>
                       <p className="text-sm text-slate-600 leading-relaxed">
                          <span className="font-bold text-green-600">不用擔心，通常是免費的！</span> Google 提供個人開發者非常大方的免費額度，對於此類個人理財應用來說，基本上可以完全免費使用。
                       </p>
                    </div>

                    <div className="space-y-2">
                       <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600"><ShieldCheck size={16}/></div>
                          安全性說明
                       </h4>
                       <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                          <li>您的金鑰僅儲存在<span className="font-bold text-slate-800">您的瀏覽器</span>中。</li>
                          <li>除了直接傳送給 Google 伺服器進行運算外，不會傳送給任何第三方。</li>
                          <li>您可以隨時在 Google AI Studio 撤銷該金鑰。</li>
                       </ul>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                       <h4 className="font-bold text-slate-900 mb-3 mt-3">如何開始？</h4>
                       <ol className="text-sm text-slate-600 space-y-3 list-decimal pl-5">
                          <li>點擊 <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-primary font-bold hover:underline inline-flex items-center gap-0.5">取得金鑰 <ExternalLink size={12}/></a> (需登入 Google)。</li>
                          <li>點擊「Create API key」建立新金鑰。</li>
                          <li>回到本 APP，點擊右上角的 <span className="inline-block bg-accent text-white p-0.5 rounded"><KeyRound size={12}/></span> 圖示。</li>
                          <li>貼上金鑰並儲存，即可解鎖 AI 功能！</li>
                       </ol>
                    </div>
                 </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex-none">
                 <button onClick={() => setShowHelpModal(false)} className="w-full bg-slate-200 text-slate-700 font-bold py-3 rounded-xl active:scale-95 transition-transform">
                    我瞭解了
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowKeyModal(false)}>
           <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                   <KeyRound size={20} className="text-primary"/> AI 金鑰設定
                 </h3>
                 <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
              </div>
              
              <div className="p-5 space-y-4">
                 <p className="text-sm text-slate-600 leading-relaxed">
                   本應用程式使用 Google Gemini API 進行智慧規劃與診斷。請輸入您自己的 API Key (免費申請)。
                 </p>
                 
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">API Key</label>
                   <input 
                     type="password" 
                     value={apiKeyInput}
                     onChange={(e) => setApiKeyInput(e.target.value)}
                     placeholder="AIzaSy..."
                     className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 text-slate-800 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                   />
                 </div>

                 <a 
                   href="https://aistudio.google.com/app/apikey" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                 >
                   <ExternalLink size={14}/> 前往 Google AI Studio 取得金鑰
                 </a>

                 <div className="pt-2">
                    <button 
                      onClick={handleSaveKey}
                      className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                      <Check size={18} strokeWidth={3} />
                      {apiKeyInput ? '儲存設定' : '清除設定'}
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-3">
                      * Key 僅儲存於您的瀏覽器中，不會上傳至伺服器。
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;