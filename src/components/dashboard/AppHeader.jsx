import { Bell, Clock, Search, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function AppHeader({ breadcrumb }) {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="hidden lg:flex sticky top-0 z-40 h-14 items-center justify-between px-8 border-b border-border bg-[#070707]/80 backdrop-blur-md">
      
      {/* Left: Breadcrumb & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Mainnet Live</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>GasChain</span>
          <span className="text-border">/</span>
          <span className="text-white font-bold">{breadcrumb}</span>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-6">
        {/* Depot Switcher (Visual) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border cursor-pointer hover:bg-secondary transition-colors">
          <MapPin size={12} className="text-muted-foreground" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Active Node</span>
        </div>

        {/* Search Trigger */}
        <div className="relative group">
          <Search size={14} className="text-muted-foreground group-hover:text-white transition-colors" />
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Time */}
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Clock size={14} />
          <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Notifications */}
        <button className="relative p-1 text-muted-foreground hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-primary rounded-full border-2 border-[#070707]" />
        </button>

        {/* User Snapshot */}
        <div className="flex items-center gap-3 pl-2 border-l border-border">
          <div className="h-8 w-8 rounded-lg bg-primary text-black flex items-center justify-center font-bold text-xs">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}
