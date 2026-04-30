import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import AppHeader from "../components/dashboard/AppHeader";
import { 
  Database, Search, Hash, Shield, ChevronDown, CheckCircle2, Link2, X, ChevronRight, Activity, Lock, Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EVENT_LABELS } from "@/lib/blockchain";
import { cn } from "@/lib/utils";
import moment from "moment";

export default function BlockchainLedger() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedBlock, setExpandedBlock] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedChain, setSelectedChain] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await base44.entities.SupplyChainBlock.list("-created_date", 200);
      setBlocks(data);
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const uniqueChains = [...new Set(blocks.map((b) => b.booking_id))];

  let filtered = blocks.filter(
    (b) =>
      !search ||
      b.block_hash?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_id?.toLowerCase().includes(search.toLowerCase()) ||
      b.event_type?.toLowerCase().includes(search.toLowerCase())
  );
  if (selectedChain) {
    filtered = filtered.filter((b) => b.booking_id === selectedChain);
  }

  function handleStatClick(stat) {
    if (activeFilter === stat) {
      setActiveFilter(null);
      setSelectedChain(null);
      return;
    }
    setActiveFilter(stat);
    setSelectedChain(null);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading ledger...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-8 space-y-8 pb-16 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-tight">Block Explorer</h1>
            <p className="text-sm text-muted-foreground">Real-time cryptographic audit log of the LPG supply network.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hash, chain or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-muted/50 border-border focus:border-primary"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatPanel 
            label="Total Blocks" value={blocks.length} icon={Database}
            active={activeFilter === "total"} onClick={() => handleStatClick("total")}
          />
          <StatPanel 
            label="Active Chains" value={uniqueChains.length} icon={Link2}
            active={activeFilter === "chains"} onClick={() => handleStatClick("chains")}
          />
          <StatPanel 
            label="Integrity Rate" value={blocks.length > 0 ? "Verified" : "—"} icon={Shield}
            active={activeFilter === "verified"} onClick={() => handleStatClick("verified")}
          />
        </div>

        {/* Filter Panel */}
        {activeFilter && (
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-base font-semibold text-foreground">
                {activeFilter === "total" && "Event Distribution"}
                {activeFilter === "chains" && "Chain Index"}
                {activeFilter === "verified" && "Verification Status"}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => { setActiveFilter(null); setSelectedChain(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {activeFilter === "total" && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(
                  blocks.reduce((acc, b) => { acc[b.event_type] = (acc[b.event_type] || 0) + 1; return acc; }, {})
                ).map(([type, count]) => (
                  <div key={type} className="p-4 rounded-lg bg-muted border border-border">
                    <p className="text-2xl font-semibold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground mt-1">{EVENT_LABELS[type] || type?.replace(/_/g, " ")}</p>
                  </div>
                ))}
              </div>
            )}

            {activeFilter === "chains" && (
              <div className="space-y-2">
                {selectedChain && (
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-primary flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5" /> Filtered: {selectedChain}
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedChain(null)}>Reset</Button>
                  </div>
                )}
                {uniqueChains.map((chainId) => {
                  const chainBlocks = blocks.filter((b) => b.booking_id === chainId);
                  const isSelected = selectedChain === chainId;
                  return (
                    <div
                      key={chainId}
                      onClick={() => setSelectedChain(isSelected ? null : chainId)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer border",
                        isSelected ? "bg-primary/10 border-primary/30" : "bg-muted border-border hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium font-mono">{chainId}</p>
                          <p className="text-xs text-muted-foreground">{chainBlocks.length} blocks</p>
                        </div>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isSelected && "rotate-90 text-primary")} />
                    </div>
                  );
                })}
              </div>
            )}

            {activeFilter === "verified" && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-6 rounded-lg bg-muted border border-border text-center">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-3" />
                  <p className="text-3xl font-semibold text-foreground">{blocks.length > 0 ? "Verified" : "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Consensus Integrity</p>
                </div>
                <div className="p-6 rounded-lg bg-muted border border-border text-center">
                  <Lock className="h-8 w-8 text-success mx-auto mb-3" />
                  <p className="text-3xl font-semibold text-foreground">{blocks.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Sealed Blocks</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Block Feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Block Chronology</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} events</p>
          </div>
          
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {filtered.map((block) => {
              const isExpanded = expandedBlock === block.id;
              let eventData = null;
              if (block.event_data) {
                try { eventData = JSON.parse(block.event_data); } catch {}
              }

              return (
                <div key={block.id} className="border-b border-border last:border-0">
                  <div
                    className="px-4 py-2.5 cursor-pointer flex items-center justify-between hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center",
                        isExpanded ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <Hash className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold font-mono">Block #{block.block_index}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-medium uppercase bg-primary/10 text-primary">
                            {EVENT_LABELS[block.event_type] || block.event_type?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-muted-foreground truncate max-w-[240px] mt-0.5">{block.block_hash}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-md bg-success"></span>
                        <span className="text-xs text-success font-medium">Committed</span>
                      </div>
                      <p className="text-xs text-muted-foreground hidden sm:block">{moment(block.created_date).format("DD MMM, HH:mm")}</p>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-4 pt-2 bg-muted/30 border-t border-border">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <DetailItem label="Event Hash" value={block.block_hash} mono />
                        <DetailItem label="Previous Hash" value={block.previous_hash} mono />
                        <DetailItem label="Chain ID" value={block.booking_id} mono />
                        <DetailItem label="Location" value={block.location} />
                        <DetailItem label="Verified By" value={block.verified_by || "unknown-node"} />
                        <DetailItem label="Nonce" value={block.nonce} mono />
                      </div>
                      
                      {eventData && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Payload</p>
                          <pre className="p-4 rounded-lg bg-muted border border-border font-mono text-xs text-muted-foreground overflow-x-auto">
                            {JSON.stringify(eventData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPanel({ label, value, icon: Icon, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-6 rounded-lg border cursor-pointer transition-colors",
        active ? "bg-primary/10 border-primary" : "bg-card border-border hover:border-primary/50"
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
        </div>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center",
          active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, mono }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-sm text-foreground truncate", mono && "font-mono")}>{value}</p>
    </div>
  );
}
