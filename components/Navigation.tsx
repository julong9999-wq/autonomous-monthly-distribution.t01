import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Wallet, BrainCircuit, Stethoscope, Bell } from 'lucide-react';

interface Props {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Navigation: React.FC<Props> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'PERFORMANCE', label: '績效', icon: LayoutDashboard },
    { id: 'PORTFOLIO', label: '自組', icon: Wallet },
    { id: 'PLANNING', label: '規劃', icon: BrainCircuit },
    { id: 'DIAGNOSIS', label: '診斷', icon: Stethoscope },
    { id: 'ANNOUNCEMENTS', label: '公告', icon: Bell },
  ];

  return (
    <nav className="w-full pb-safe bg-primary shadow-[0_-2px_4px_rgba(0,0,0,0.1)]">
      <div className="flex justify-between px-1 py-1.5 gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`flex flex-col items-center justify-center py-1 w-full transition-all duration-200 rounded-lg ${
                isActive 
                  ? 'text-accent scale-105' 
                  : 'text-blue-200 opacity-70'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 3 : 2} />
              <span className={`text-[10px] mt-0.5 whitespace-nowrap ${isActive ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;