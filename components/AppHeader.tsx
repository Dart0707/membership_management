import type { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { AttendanceIcon, DatabaseIcon, ScanIcon, UserPlusIcon } from "@/components/icons";

export default function AppHeader({ activeTab, setActiveTab, activeCount, expiredCount }: {
  activeTab: string; setActiveTab: Dispatch<SetStateAction<string>>; activeCount: number; expiredCount: number;
}) {
  return (
      <header className="border-b border-[#e4e6f0] bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          
          {/* Gym Brand Logo */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 w-full md:w-auto">
            <div className="h-12 w-20 sm:h-14 sm:w-24 shrink-0 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm border border-[#e4e6f0]">
              <Image
                src="/logo.png"
                alt="MTFC logo"
                width={96}
                height={96}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate bg-gradient-to-r from-[#151d3d] via-[#151d3d] to-[#5d70c7] bg-clip-text text-transparent">
                <span className="text-[#6f80d2] text-xs sm:text-sm font-semibold uppercase tracking-widest ml-1">Gym Desk</span>
              </h1>
              <p className="hidden sm:block text-xs text-[#5d70c7] truncate">QR Member Check-In & Management System</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="grid grid-cols-4 items-stretch w-full md:w-auto md:flex bg-white/90 p-1 rounded-xl border border-[#e4e6f0]/80 shadow-inner">
            <button
              onClick={() => setActiveTab("register")}
              className={`flex items-center justify-center gap-1 md:gap-2 px-1.5 sm:px-3 md:px-4 py-2 rounded-lg text-[10px] sm:text-xs md:text-sm leading-tight font-medium transition-all duration-200 ${
                activeTab === "register"
                  ? "bg-[#5d70c7] text-[#151d3d] font-bold shadow-md shadow-[#5d70c7]/20"
                  : "text-[#5d70c7] hover:text-[#151d3d] hover:bg-white"
              }`}
            >
              <UserPlusIcon />
              <span>Customer Registration</span>
            </button>

            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex items-center justify-center gap-1 md:gap-2 px-1.5 sm:px-3 md:px-4 py-2 rounded-lg text-[10px] sm:text-xs md:text-sm leading-tight font-medium transition-all duration-200 ${
                activeTab === "attendance"
                  ? "bg-[#5d70c7] text-[#151d3d] font-bold shadow-md shadow-[#5d70c7]/20"
                  : "text-[#5d70c7] hover:text-[#151d3d] hover:bg-white"
              }`}
            >
              <AttendanceIcon />
              <span>Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab("scanner")}
              className={`flex items-center justify-center gap-1 md:gap-2 px-1.5 sm:px-3 md:px-4 py-2 rounded-lg text-[10px] sm:text-xs md:text-sm leading-tight font-medium transition-all duration-200 ${
                activeTab === "scanner"
                  ? "bg-[#5d70c7] text-[#151d3d] font-bold shadow-md shadow-[#5d70c7]/20"
                  : "text-[#5d70c7] hover:text-[#151d3d] hover:bg-white"
              }`}
            >
              <ScanIcon />
              <span>Desk Scanner</span>
            </button>

            <button
              onClick={() => setActiveTab("database")}
              className={`flex items-center justify-center gap-1 md:gap-2 px-1.5 sm:px-3 md:px-4 py-2 rounded-lg text-[10px] sm:text-xs md:text-sm leading-tight font-medium transition-all duration-200 ${
                activeTab === "database"
                  ? "bg-[#5d70c7] text-[#151d3d] font-bold shadow-md shadow-[#5d70c7]/20"
                  : "text-[#5d70c7] hover:text-[#151d3d] hover:bg-white"
              }`}
            >
              <DatabaseIcon />
              <span>Member Database</span>
            </button>
          </nav>

          {/* Quick Metrics */}
          <div className="hidden lg:flex items-center space-x-4 text-xs font-medium">
            <div className="px-3 py-1.5 rounded-lg bg-[#e4e6f0]/30 border border-[#c4c9df]/60 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#6f80d2] animate-pulse"></span>
              <span className="text-[#5d70c7]">Active Passes:</span>
              <span className="text-[#6f80d2] font-bold">{activeCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#fae5e8]/20 border border-[#f8cbd1]/60 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#f26173]"></span>
              <span className="text-[#5d70c7]">Expired:</span>
              <span className="text-[#f26173] font-bold">{expiredCount}</span>
            </div>
          </div>

        </div>
      </header>

  );
}
