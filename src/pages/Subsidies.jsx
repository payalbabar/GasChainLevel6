import React, { useState, useEffect, useMemo } from 'react';

import { Shield, Vote, CheckCircle, Clock, XCircle, Zap, Cpu, ChevronDown, AlertCircle, FileText, Radio, Loader2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import moment from 'moment';

const statusConfig = {
  active:   { style: 'bg-primary/10 text-primary border-primary/25', icon: Vote, label: 'ACTIVE' },
  passed:   { style: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/25', icon: CheckCircle, label: 'PASSED' },
  rejected: { style: 'bg-rose-400/10 text-rose-400 border-rose-400/25', icon: XCircle, label: 'REJECTED' },
  pending:  { style: 'bg-amber-400/10 text-amber-400 border-amber-400/25', icon: Clock, label: 'PENDING' },
};

export default function Subsidies() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [activeMetric, setActiveMetric] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProposal, setNewProposal] = useState({ title: '', desc: '' });

  const fetchBlocks = async () => {
    try {
      const data = await base44.entities.SupplyChainBlock.list("-created_date", 500);
      setBlocks(data);
    } catch (err) {
      console.error("Governance fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 10000);
    return () => clearInterval(interval);
  }, []);

  const governance = useMemo(() => {
    const proposals = {};
    const events = [];
    const voteEvents = [];
    const userVotes = {};

    [...blocks].sort((a, b) => new Date(a.created_date || a.timestamp) - new Date(b.created_date || b.timestamp)).forEach(bl => {
      let metadata = {};
      try { metadata = typeof bl.event_data === 'string' ? JSON.parse(bl.event_data) : (bl.event_data || {}); } catch(e) {}

      const blockIdentity = bl.verified_by || bl.node_id || "unknown-node";

      if (bl.event_type === 'proposal_created') {
        const id = metadata.id || bl.id;
        const proposerIdentity = metadata.proposer || blockIdentity;
        proposals[id] = {
          id,
          title: metadata.title,
          desc: metadata.desc,
          proposer: proposerIdentity,
          created_at: bl.created_date || bl.timestamp,
          ends_at: metadata.ends_at,
          votes: { yes: 0, no: 0, abstain: 0 },
          impact: metadata.impact || 'n/a',
          techSpec: metadata.techSpec || "n/a"
        };
        events.unshift({
            type: 'Created',
            title: metadata.title,
            user: proposerIdentity,
            time: bl.created_date || bl.timestamp
        });
      }

      if (bl.event_type === 'vote_cast') {
        const { proposal_id, choice } = metadata;
        const voterIdentity = metadata.voter || blockIdentity;
        if (proposals[proposal_id]) {
          proposals[proposal_id].votes[choice] += 1;
          const currentUserId = user?.id || user?.name || "unknown-node";
          if (voterIdentity === currentUserId) {
            userVotes[proposal_id] = choice;
          }
          const voteEvent = {
            proposal_id,
            title: proposals[proposal_id].title,
            choice,
            voter: voterIdentity,
            time: bl.created_date || bl.timestamp
          };
          voteEvents.unshift(voteEvent);
          events.unshift({
            type: 'Vote',
            title: proposals[proposal_id].title,
            user: voterIdentity,
            time: bl.created_date || bl.timestamp,
            choice
          });
        }
      }
    });

    const isPassedLogic = (p) => {
        const total = p.votes.yes + p.votes.no + p.votes.abstain;
        if (total === 0) return false;
        const yesPercent = (p.votes.yes / total) * 100;
        const deadlinePassed = moment().isAfter(p.ends_at);
        return yesPercent >= 66 && deadlinePassed;
    };

    const proposalList = Object.values(proposals).map(p => {
        const passed = isPassedLogic(p);
        const expired = moment().isAfter(p.ends_at);
        let status = 'active';
        if (expired) {
            status = passed ? 'passed' : 'rejected';
        }
        return { ...p, status, isPassed: passed };
    }).sort((a, b) => moment(b.created_at).diff(moment(a.created_at)));

    const currentIdentity = user?.id || user?.name || "unknown-node";
    const verifiedByMe = blocks.filter(b => b.verified_by === currentIdentity);

    return { 
        proposals: proposalList, 
        voteEvents,
        events: events.slice(0, 10),
        userVotes,
        passedProposals: proposalList.filter(p => p.isPassed),
        nodeInfo: {
            identity: currentIdentity,
            verifiedCount: verifiedByMe.length,
            power: verifiedByMe.length * 10
        }
    };
  }, [blocks, user]);

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    if (!newProposal.title || !newProposal.desc) return;

    setIsBroadcasting(true);
    const id = `GIP-${Math.floor(Math.random() * 9000) + 1000}`;
    const identity = user?.id || user?.name || "unknown-node";
    
    const proposalData = {
        id,
        title: newProposal.title,
        desc: newProposal.desc,
        proposer: identity,
        ends_at: moment().add(3, 'days').toISOString(),
        impact: 'GIP Protocol Adjustment',
        techSpec: `SPEC-${id}`
    };

    try {
        await base44.entities.SupplyChainBlock.create({
            block_index: blocks.length + 1,
            block_hash: `0x${Math.random().toString(16).slice(2)}`,
            previous_hash: blocks[0]?.block_hash || "0x0",
            timestamp: new Date().toISOString(),
            event_type: 'proposal_created',
            event_data: JSON.stringify(proposalData),
            verified_by: identity,
            nonce: 777
        });
        toast({ title: "GIP Proposed", description: "Governance contract initialized on-chain." });
        setShowCreate(false);
        setNewProposal({ title: '', desc: '' });
        fetchBlocks();
    } catch (err) {
        toast({ title: "Broadcast Failed", description: "Consensus rejected the proposal block.", variant: "destructive" });
    } finally {
        setIsBroadcasting(false);
    }
  };

  const handleVote = async (proposalId, choice) => {
    setIsBroadcasting(true);
    const identity = user?.id || user?.name || "unknown-node";
    
    try {
        await base44.entities.SupplyChainBlock.create({
            block_index: blocks.length + 1,
            block_hash: `0x${Math.random().toString(16).slice(2)}`,
            previous_hash: blocks[0]?.block_hash || "0x0",
            timestamp: new Date().toISOString(),
            event_type: 'vote_cast',
            event_data: JSON.stringify({ proposal_id: proposalId, choice, voter: identity }),
            verified_by: identity,
            nonce: 888
        });
        toast({ title: "Vote Cast", description: `Signed signature: ${choice.toUpperCase()}` });
        fetchBlocks();
    } catch (err) {
        toast({ title: "Vote Failed", description: "Network signature could not be verified.", variant: "destructive" });
    } finally {
        setIsBroadcasting(false);
    }
  };

  const filteredProposals = governance.proposals.filter(p => {
    if (activeTab === 'active') return p.status === 'active';
    if (activeTab === 'history') return p.status === 'passed' || p.status === 'rejected';
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">

      
      <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20 relative z-10">
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-border pb-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/25 text-primary text-[10px] font-bold uppercase tracking-widest">
              <Shield className="h-3.5 w-3.5" /> Protocol Authority Node
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Governance <span className="gradient-text">Protocol</span>
            </h1>
            <p className="text-sm text-muted-foreground">Derived from real-time blockchain event synchronization.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex p-1 rounded-lg bg-muted border border-border">
                {['all', 'active', 'history'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors",
                            activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Create GIP
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total GIPs" value={governance.proposals.length.toString()} icon={FileText} active={activeMetric === 'gips'} onClick={() => setActiveMetric(activeMetric === 'gips' ? null : 'gips')} />
          <MetricCard label="Active Votes" value={governance.voteEvents.length.toString()} icon={Zap} active={activeMetric === 'votes'} onClick={() => setActiveMetric(activeMetric === 'votes' ? null : 'votes')} />
          <MetricCard label="Passed" value={governance.passedProposals.length.toString()} icon={CheckCircle} active={activeMetric === 'passed'} onClick={() => setActiveMetric(activeMetric === 'passed' ? null : 'passed')} />
          <MetricCard label="Voting Power" value={`${governance.nodeInfo.power} VP`} icon={Cpu} active={activeMetric === 'power'} onClick={() => setActiveMetric(activeMetric === 'power' ? null : 'power')} />
        </div>

        <AnimatePresence mode="wait">
            {activeMetric && (
                <div className="overflow-hidden">
                    <div className="p-6 rounded-lg bg-card border border-primary/20 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                {activeMetric === 'gips' && <><FileText className="h-5 w-5 text-primary" /> Proposal Ledger</>}
                                {activeMetric === 'votes' && <><Zap className="h-5 w-5 text-primary" /> Active Vote Stream</>}
                                {activeMetric === 'passed' && <><CheckCircle className="h-5 w-5 text-emerald-500" /> Consensus Hall of Fame</>}
                                {activeMetric === 'power' && <><Cpu className="h-5 w-5 text-primary" /> Node Authority Details</>}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => setActiveMetric(null)} className="h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {activeMetric === 'gips' && (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] uppercase font-bold text-muted-foreground border-b border-border pb-2">
                                            <th className="pb-3 px-2">ID</th>
                                            <th className="pb-3 px-2">Title</th>
                                            <th className="pb-3 px-2">Proposer</th>
                                            <th className="pb-3 px-2">Votes (Y/N/A)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {governance.proposals.map(p => (
                                            <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-2 font-mono text-xs text-primary">{p.id}</td>
                                                <td className="py-3 px-2 font-medium">{p.title}</td>
                                                <td className="py-3 px-2 text-muted-foreground">{p.proposer.slice(0, 12)}...</td>
                                                <td className="py-3 px-2">
                                                    <span className="text-emerald-500 font-bold">{p.votes.yes}</span> / 
                                                    <span className="text-rose-500 font-bold ml-1">{p.votes.no}</span> / 
                                                    <span className="text-muted-foreground font-bold ml-1">{p.votes.abstain}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {activeMetric === 'votes' && (
                                <div className="space-y-3">
                                    {governance.voteEvents.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground">No votes cast on current ledger epoch.</div>
                                    ) : (
                                        governance.voteEvents.map((v, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border/50">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("h-8 w-8 rounded-md flex items-center justify-center text-[10px] font-bold", 
                                                        v.choice === 'yes' ? "bg-emerald-500/20 text-emerald-500" : 
                                                        v.choice === 'no' ? "bg-rose-500/20 text-rose-500" : "bg-muted text-muted-foreground")}>
                                                        {v.choice.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold">{v.title}</p>
                                                        <p className="text-[10px] text-muted-foreground">{v.voter.slice(0, 16)}...</p>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-mono text-muted-foreground">{moment(v.time).fromNow()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeMetric === 'passed' && (
                                <div className="space-y-4">
                                    {governance.passedProposals.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground">No proposals have reached consensus yet. (Requires 66% supermajority)</div>
                                    ) : (
                                        governance.passedProposals.map(p => (
                                            <div key={p.id} className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-emerald-500">{p.title}</h4>
                                                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-md">PASSED</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-3">{p.desc}</p>
                                                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    <span>Yes: {p.votes.yes}</span>
                                                    <span>No: {p.votes.no}</span>
                                                    <span>Abstain: {p.votes.abstain}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {activeMetric === 'power' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Identity</p>
                                            <p className="text-xs font-mono truncate">{governance.nodeInfo.identity}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Verified Blocks</p>
                                            <p className="text-xl font-bold text-primary">{governance.nodeInfo.verifiedCount}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                                            <p className="text-[10px] font-bold text-primary uppercase mb-1">Weighting</p>
                                            <p className="text-xl font-bold text-primary">10x</p>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-lg border border-dashed border-primary/30 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">Protocol Authority Power</p>
                                            <p className="text-xs text-muted-foreground mt-1">Calculated as (Verified Blocks × 10)</p>
                                        </div>
                                        <div className="text-4xl font-black text-primary">
                                            {governance.nodeInfo.power}
                                            <span className="text-xs font-bold ml-1 text-muted-foreground uppercase tracking-tighter">VP</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Syncing consensus state...</p>
                    </div>
                ) : filteredProposals.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-border rounded-lg bg-card/30">
                        <Vote className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground">Governance not initialized</h3>
                        <p className="text-sm text-muted-foreground/60 mb-6">No proposals found on the current ledger epoch.</p>
                        <Button onClick={() => setShowCreate(true)} variant="outline">Create First Proposal</Button>
                    </div>
                ) : (
                    filteredProposals.map((p) => {
                        const cfg = statusConfig[p.status] || statusConfig.pending;
                        const StatusIcon = cfg.icon;
                        const total = p.votes.yes + p.votes.no + p.votes.abstain || 0;
                        const isExpanded = expandedId === p.id;
                        const hasVoted = governance.userVotes[p.id];

                        return (
                            <div key={p.id} className={cn("rounded-lg border transition-colors duration-150 overflow-hidden", hasVoted ? "bg-card border-emerald-500/20" : "bg-card border-border hover:border-primary/30")}>
                                <div onClick={() => setExpandedId(isExpanded ? null : p.id)} className="p-6 cursor-pointer">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{p.id}</span>
                                                <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border", cfg.style)}>
                                                    <StatusIcon className="h-3 w-3" /> {cfg.label}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-foreground mb-1">{p.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{p.desc}</p>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Deadline</p>
                                                <p className={cn("text-sm font-bold", p.status === 'active' ? "text-primary" : "text-muted-foreground")}>
                                                    {moment(p.ends_at).format('MMM DD')}
                                                </p>
                                            </div>
                                            <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", isExpanded && "rotate-180")} />
                                        </div>
                                    </div>
                                    {total > 0 && (
                                        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
                                            <VoteBar label="Yes" value={p.votes.yes} total={total} color="bg-emerald-500" />
                                            <VoteBar label="No" value={p.votes.no} total={total} color="bg-rose-500" />
                                            <VoteBar label="Abstain" value={p.votes.abstain} total={total} color="bg-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                    {isExpanded && (
                                        <div className="border-t border-border bg-muted/20">
                                            <div className="p-6 space-y-6">
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <DetailBox title="Authority Node" value={p.proposer} />
                                                    <DetailBox title="Protocol Impact" value={p.impact} />
                                                    <DetailBox title="Merkle Proof" value={p.techSpec} isCode />
                                                </div>
                                                {p.status === 'active' && !hasVoted ? (
                                                    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                                                        <p className="text-xs font-bold uppercase tracking-widest text-primary text-center mb-4">Cryptographic Vote Required</p>
                                                        <div className="flex gap-3">
                                                            {['yes', 'no', 'abstain'].map(v => (
                                                                <Button key={v} disabled={isBroadcasting} onClick={(e) => { e.stopPropagation(); handleVote(p.id, v); }} variant="outline" className={cn("flex-1 capitalize font-bold rounded-md", v === 'yes' && 'hover:bg-emerald-500 hover:text-white border-emerald-500/30', v === 'no' && 'hover:bg-rose-500 hover:text-white border-rose-500/30')}>
                                                                    {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : v}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    ) : hasVoted ? (
                                                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-3">
                                                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                                                        <p className="text-sm font-bold text-emerald-500">Vote Recorded: {hasVoted.toUpperCase()}</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2 text-muted-foreground py-4 border border-dashed border-border rounded-lg">
                                                        <Clock className="h-4 w-4" />
                                                        <p className="text-sm font-medium">Consensus phase concluded.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                            </div>
                        );
                    })
                )}
            </div>

            <div className="lg:col-span-4 space-y-6">
                <div className="p-6 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
                        <Radio className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">Consensus Stream</h4>
                    </div>
                    <div className="space-y-4">
                        {governance.events.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">Waiting for events...</p>
                        ) : (
                            governance.events.map((ev, i) => (
                                <div key={i} className="relative pl-4 border-l border-border/50 pb-4 last:pb-0">
                                    <div className="absolute -left-[4.5px] top-1 h-2 w-2 rounded-full bg-primary" />
                                    <p className="text-[10px] text-muted-foreground font-mono">{moment(ev.time).format('HH:mm:ss')}</p>
                                    <p className="text-xs font-bold text-foreground mt-0.5">{ev.type}: {ev.title}</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                        <Cpu className="h-3 w-3" /> {ev.user.slice(0, 8)}... {ev.choice && `· [${ev.choice.toUpperCase()}]`}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-primary uppercase">Governance Note</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Proposals are automatically resolved after their 72-hour consensus window. 
                        A supermajority (66%+) YES vote is required for protocol implementation.
                    </p>
                </div>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div onClick={() => setShowCreate(false)} className="absolute inset-0 bg-background/80 backdrop-blur-md" />
                <div className="relative w-full max-w-lg bg-card border border-border rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Create GIP</h2>
                        <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}><X className="h-4 w-4" /></Button>
                    </div>
                    <form onSubmit={handleCreateProposal} className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Proposal Title</label>
                            <Input placeholder="e.g. Increase Network Throughput" value={newProposal.title} onChange={e => setNewProposal(prev => ({ ...prev, title: e.target.value }))} className="bg-muted/50 border-border" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Detailed Description</label>
                            <Textarea placeholder="Explain the protocol adjustment..." value={newProposal.desc} onChange={e => setNewProposal(prev => ({ ...prev, desc: e.target.value }))} className="bg-muted/50 border-border min-h-[120px]" />
                        </div>
                        <div className="pt-4 flex gap-3">
                            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button type="submit" disabled={isBroadcasting} className="flex-1">
                                {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                                Broadcast Proposal
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        )}

          {isBroadcasting && !showCreate && (
              <div className="fixed inset-0 z-[110] bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                  <div className="h-20 w-20 rounded-lg bg-card border border-primary/20 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">Consensus Broadcasting</p>
                    <p className="text-sm text-muted-foreground">Signatures being verified by network nodes...</p>
                  </div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, active, onClick }) {
  return (
    <div onClick={onClick} className={cn("p-6 rounded-lg bg-card border transition-colors duration-150 cursor-pointer relative group", active ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30")}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        </div>
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center transition-colors", active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/20")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function VoteBar({ label, value, total, color }) {
    const pct = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
                <span className="text-[10px] font-bold font-mono">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-md bg-muted overflow-hidden">
                <div className={cn("h-full rounded-md transition-all duration-500", color)} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground text-right">{value} votes</p>
        </div>
    );
}

function DetailBox({ title, value, isCode }) {
    return (
        <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
            <div className={cn("p-3 rounded-lg border border-border text-xs leading-relaxed", isCode ? "bg-[#0a0c14] font-mono text-primary/80" : "bg-muted/50 font-medium")}>
                {value}
            </div>
        </div>
    );
}
