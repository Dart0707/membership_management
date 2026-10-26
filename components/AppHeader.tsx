import type { Dispatch, SetStateAction } from "react";
import { DatabaseIcon, ScanIcon, UserPlusIcon } from "@/components/icons";

export default function AppHeader({ activeTab, setActiveTab, activeCount, expiredCount }: {
  activeTab: string; setActiveTab: Dispatch<SetStateAction<string>>; activeCount: number; expiredCount: number;
}) {
  return (
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Gym Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="font-extrabold text-slate-950 text-xl tracking-tighter">FP</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                MTFC <span className="text-emerald-400 text-sm font-semibold uppercase tracking-widest ml-1">Gym Desk</span>
              </h1>
              <p className="text-xs text-slate-400">QR Member Check-In & Management System</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 shadow-inner">
            <button
              onClick={() => setActiveTab("register")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "register"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <UserPlusIcon />
              <span>Customer Registration</span>
            </button>

            <button
              onClick={() => setActiveTab("scanner")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "scanner"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <ScanIcon />
              <span>Desk Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab("database")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "database"
                  ? "bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <DatabaseIcon />
              <span>Member Database</span>
            </button>
          </nav>

          {/* Quick Metrics */}
          <div className="hidden lg:flex items-center space-x-4 text-xs font-medium">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">Active Passes:</span>
              <span className="text-emerald-400 font-bold">{activeCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-slate-400">Expired:</span>
              <span className="text-rose-400 font-bold">{expiredCount}</span>
            </div>
          </div>

        </div>
      </header>

  );
}
