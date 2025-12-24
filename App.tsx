import React, { useState, useEffect } from 'react';
import { ViewState, PortfolioItem, ETFData, Transaction } from './types';
import PerformanceQuery from './components/PerformanceQuery';
import PortfolioBuilder from './components/PortfolioBuilder';
import SmartPlanning from './components/SmartPlanning';
import AIDiagnosis from './components/AIDiagnosis';
import DividendAnnouncements from './components/DividendAnnouncements';
import Navigation from './components/Navigation';
import ETFDetail from './components/ETFDetail';
import { Coins, RefreshCw } from 'lucide-react';
import { calculateFee } from './constants';
import { fetchLiveETFData } from './services/dataService';

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
                    資料日期: {lastUpdate}
                  </span>
                )}
              </div>
            </div>
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
    </div>
  );
};

export default App;