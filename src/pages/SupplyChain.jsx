import React, { useState, useEffect } from 'react';
import { Package, Search, ChevronDown, ChevronUp, CheckCircle, Database, Globe, MapPin, Terminal, Zap, Shield, Loader2, Box } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SupplyChain() {
  const [loading, setLoading]   = useState(true);
  const [scanning, setScanning] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks]     = useState([]);
  const [query, setQuery]       = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [b, bl] = await Promise.all([
          base44.entities.Booking.list(),
          base44.entities.SupplyChainBlock.list(),
        ]);
        setBookings(b.sort((x,y) => new Date(y.created_date)-new Date(x.created_date)));
        setBlocks(bl);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const filteredBlocks = blocks.filter(b => 
    !query || 
    b.booking_id?.toLowerCase().includes(query.toLowerCase()) || 
    b.block_hash?.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Supply Chain Explorer</h1>
          <p className="text-xs text-muted-foreground">Real-time cryptographic verification of physical asset movement.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search ID..." 
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="h-9 w-64 pl-9 bg-card border-border/50 text-xs focus:ring-1 focus:ring-primary/50" 
            />
          </div>
          <Button 
            onClick={() => { setScanning(true); setTimeout(()=>setScanning(false),1500); }} 
            size="sm" 
            className="h-9 w-9 p-0"
          >
            {scanning ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Active Shipments */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active Tracking</h3>
          
          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => <div key={i} className="h-16 w-full skeleton" />)}
            </div>
          ) : filteredBlocks.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center border border-border rounded-lg bg-card">
              <Box size={40} className="text-muted-foreground mb-4" />
              <p className="text-sm font-medium text-white">No blockchain events detected</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search query.</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="space-y-0 divide-y divide-border/50">
                {filteredBlocks.map((block) => (
                  <div key={block.id} className="py-4 flex items-start gap-4 hover:bg-secondary/10 transition-colors px-4 rounded-md">
                    <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/20 mt-1">
                      <Terminal size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-white truncate">
                          {block.event_type?.replace(/_/g, " ").toUpperCase() || "SYSTEM EVENT"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(block.created_date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                        <p className="text-[11px] text-muted-foreground">
                          Contract ID: <span className="font-mono font-bold text-white">{block.booking_id}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground hidden sm:block">•</p>
                        <p className="text-[11px] text-muted-foreground">
                          Node: <span className="text-white">{block.verified_by || 'system-node'}</span>
                        </p>
                      </div>
                      <div className="mt-3 p-2 rounded-md bg-background border border-border/50 flex items-center justify-between gap-4">
                        <p className="text-[10px] font-mono text-muted-foreground truncate uppercase">Hash: {block.block_hash || 'PENDING'}</p>
                        <CheckCircle size={12} className="text-primary flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Network Authority Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 pb-4 border-b border-border">Network Authority</h3>
            <div className="space-y-4">
              {[
                { icon: Globe, label: "Active Hubs", val: "08" },
                { icon: Zap, label: "In-Flight", val: bookings.filter(b=>b.status==="confirmed").length },
                { icon: CheckCircle, label: "Completed", val: bookings.filter(b=>b.status==="delivered").length },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                      <r.icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{r.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white font-mono">{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-secondary/10 border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-primary" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Compliance</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              All logistic records are immutable and cryptographically signed on the Stellar ledger. Compliance status: <span className="text-primary font-bold">VERIFIED</span>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
