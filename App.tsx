import React, { useState, useEffect } from 'react';
import { ViewState, PortfolioItem, ETFData, Transaction } from './types';
import PerformanceQuery from './components/PerformanceQuery';
import PortfolioBuilder from './components/PortfolioBuilder';
import SmartPlanning from './components/SmartPlanning';
import AIDiagnosis from './components/AIDiagnosis';
import DividendAnnouncements from './components/DividendAnnouncements';
import Navigation from './components/Navigation';
import ETFDetail from './components/ETFDetail';
import { Coins, RefreshCw, KeyRound, X, Check, ExternalLink, CircleHelp, ShieldCheck, Zap, BookOpen, Trash2, LogIn, MousePointerClick } from 'lucide-react';
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
      alert("請輸入有效的 API Key");
      return;
    }
    localStorage.setItem(USER_KEY_STORAGE, apiKeyInput.trim());
    setHasUserKey(true);
    setShowKeyModal(false);
  };

  const handleClearKey = () => {
    if (window.confirm("確定要移除您的 API Key 嗎？移除後 AI 功能將無法使用。")) {
      localStorage.removeItem(USER_KEY_STORAGE);
      setApiKeyInput('');
      setHasUserKey(false);
      setShowKeyModal(false);
    }
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
              <h1 className="text-lg font-black tracking-tight leading-none">自組月月配 V01.0</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] text-blue-100 opacity-80">穩定被動收入</p>
                {lastUpdate && (
                  <span className="text-[9px] bg-blue-800/50 px-1.5 py-0.5 rounded text-blue-200 flex items-center gap-1">
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
                   <BookOpen size={20} className="text-primary"/> 新手指南
                 </h3>
                 <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
              </div>

              <div className="p-5 overflow-y-auto custom-scrollbar">
                 <div className="space-y-6">
                    {/* Beginner Guide: Step-by-Step */}
                    <div>
                        <h4 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-lg">
                           <span className="bg-accent text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                           如何取得免費金鑰？
                        </h4>
                        <div className="space-y-4 pl-3 border-l-2 border-slate-100 ml-3">
                           
                           {/* Step 1 */}
                           <div className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <ExternalLink size={16} className="text-primary"/>
                                <span className="font-bold text-slate-700 text-sm">前往申請頁面</span>
                              </div>
                              <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                className="block w-full text-center bg-blue-50 text-primary font-bold py-3 rounded-xl border-2 border-blue-100 hover:bg-blue-100 transition-colors text-sm"
                              >
                                點此開啟 Google AI Studio
                              </a>
                           </div>

                           {/* Step 2 */}
                           <div className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <LogIn size={16} className="text-primary"/>
                                <span className="font-bold text-slate-700 text-sm">登入 Google 帳號</span>
                              </div>
                              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg leading-relaxed">
                                 開啟網頁後，請登入您平常使用的 Google 帳號 (Gmail)。如果出現歡迎畫面，請勾選同意條款並點擊 Continue。
                              </p>
                           </div>

                           {/* Step 3 */}
                           <div className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <MousePointerClick size={16} className="text-primary"/>
                                <span className="font-bold text-slate-700 text-sm">建立金鑰</span>
                              </div>
                              <ol className="text-xs text-slate-600 space-y-2 list-decimal pl-4 bg-slate-50 p-3 rounded-lg">
                                 <li>點擊左上角的 <span className="font-bold text-slate-800">"Get API key"</span> 按鈕。</li>
                                 <li>點擊藍色的 <span className="font-bold text-blue-600">"Create API key"</span>。</li>
                                 <li>選擇 "Create API key in new project"。</li>
                                 <li>複製產生的一長串文字 (以 AIza 開頭)。</li>
                              </ol>
                           </div>

                           {/* Step 4 */}
                           <div className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <KeyRound size={16} className="text-primary"/>
                                <span className="font-bold text-slate-700 text-sm">貼上金鑰</span>
                              </div>
                              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg leading-relaxed">
                                 回到本 APP，點擊右上角的鑰匙圖示，貼上剛剛複製的文字並儲存即可。
                              </p>
                           </div>

                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-3">
                       <h4 className="font-black text-slate-900 flex items-center gap-2">
                          <ShieldCheck size={18} className="text-green-600"/>
                          安全與費用常見問題
                       </h4>
                       <div className="grid grid-cols-1 gap-3">
                          <div className="bg-green-50 p-3 rounded-xl">
                             <h5 className="font-bold text-green-800 text-xs mb-1 flex items-center gap-1"><Zap size={12}/> 要付錢嗎？</h5>
                             <p className="text-xs text-green-700 leading-normal">
                                不需要。Google 對於個人使用者提供很高的免費額度，一般使用完全免費。
                             </p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl">
                             <h5 className="font-bold text-slate-700 text-xs mb-1 flex items-center gap-1"><ShieldCheck size={12}/> 安全嗎？</h5>
                             <p className="text-xs text-slate-600 leading-normal">
                                您的金鑰只會存在您的手機/電腦瀏覽器中，不會傳送到我們的伺服器，請安心使用。
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex-none">
                 <button onClick={() => setShowHelpModal(false)} className="w-full bg-primary text-white font-bold py-3 rounded-xl active:scale-95 transition-transform shadow-lg shadow-blue-200">
                    我學會了，開始設定
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
                   請輸入您的 Google Gemini API Key 以解鎖智慧功能。
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

                 <div className="flex justify-between items-center">
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <ExternalLink size={14}/> 取得金鑰
                    </a>
                    
                    <button 
                       onClick={() => { setShowKeyModal(false); setShowHelpModal(true); }}
                       className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    >
                       <CircleHelp size={14}/> 不知道怎麼做？
                    </button>
                 </div>

                 <div className="pt-2 flex gap-3">
                    {hasUserKey && (
                      <button 
                        onClick={handleClearKey}
                        className="flex-1 bg-red-50 text-red-600 border border-red-100 font-bold py-3.5 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} />
                        移除
                      </button>
                    )}
                    <button 
                      onClick={handleSaveKey}
                      className="flex-[2] bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                      <Check size={18} strokeWidth={3} />
                      儲存設定
                    </button>
                 </div>
                 <p className="text-[10px] text-center text-slate-400 mt-1">
                   * Key 僅儲存於您的瀏覽器中，不會上傳。
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;