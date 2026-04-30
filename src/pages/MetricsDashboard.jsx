import React, { useState, useEffect, useMemo } from 'react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Cpu, Wifi, Zap, Clock, Activity, Terminal, X, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';



const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="px-3 py-2 rounded-md bg-popover border border-border text-xs text-popover-foreground">
        {payload[0].value} units
      </div>
    );
  }
  return null;
};

export default function MetricsDashboard() {
  const [data, setData] = useState({ bookings: [], blocks: [], loading: true });
  const [activeStat, setActiveStat] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [bookings, blocks] = await Promise.all([
          base44.entities.Booking.list("-created_date", 200),
          base44.entities.SupplyChainBlock.list("-created_date", 200)
        ]);
        setData({ bookings, blocks, loading: false });
      } catch (err) {
        console.error("Metrics fetch failed:", err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchMetrics();
  }, []);

  const metrics = useMemo(() => {
    const { bookings, blocks } = data;
    if (!bookings.length && !blocks.length) return null;

    const today = moment().format('YYYY-MM-DD');
    const dailyActivity = {};
    const userActivityMap = {}; // userId -> { count, latestTx, type, lastSeen }

    const trackActivity = (userId, type, timestamp, metadata = {}) => {
      const day = moment(timestamp).format('YYYY-MM-DD');
      if (!dailyActivity[day]) dailyActivity[day] = { users: new Set(), txs: 0 };
      dailyActivity[day].users.add(userId);
      dailyActivity[day].txs += 1;

      if (!userActivityMap[userId]) {
        userActivityMap[userId] = { count: 0, firstSeen: timestamp, latestTx: null, type, metadata };
      }
      userActivityMap[userId].count += 1;
      if (!userActivityMap[userId].latestTx || moment(timestamp).isAfter(userActivityMap[userId].latestTx)) {
        userActivityMap[userId].latestTx = timestamp;
      }
    };

    // Process Bookings
    bookings.forEach(b => trackActivity(b.customer_phone || b.id, 'Consumer', b.created_date, { name: b.customer_name }));

    // Process Blocks
    blocks.forEach(bl => trackActivity(bl.verified_by || bl.node_id || "unknown-node", 'Network Node', bl.created_date || bl.timestamp));

    // DAU Details (Today)
    const dauToday = dailyActivity[today]?.users.size || 0;
    const dauDetails = [...bookings, ...blocks]
      .filter(x => moment(x.created_date || x.timestamp).format('YYYY-MM-DD') === today)
      .map(x => ({
        id: x.customer_phone || x.verified_by || x.node_id || "unknown-node",
        time: x.created_date || x.timestamp,
        type: x.customer_phone ? 'Booking' : 'Block Commit',
        label: x.customer_name || x.event_type || 'System Event'
      }))
      .sort((a, b) => moment(b.time).diff(moment(a.time)));

    // Transactions Details
    const transactionDetails = [...bookings.map(b => ({ id: b.booking_id, type: 'Booking', time: b.created_date, status: b.status })), 
                                ...blocks.map(bl => ({ id: bl.block_hash, type: 'Block', time: bl.created_date || bl.timestamp, status: bl.event_type }))]
      .sort((a, b) => moment(b.time).diff(moment(a.time)));

    // User / Identifier Details
    const identifierDetails = Object.entries(userActivityMap).map(([id, info]) => ({
      id,
      ...info
    })).sort((a, b) => b.count - a.count);

    // Retention Details
    const returningUsers = identifierDetails.filter(u => u.count > 1);
    const newUsers = identifierDetails.filter(u => u.count === 1);
    const retentionRate = identifierDetails.length > 0 ? ((returningUsers.length / identifierDetails.length) * 100).toFixed(1) : 0;

    // Trends
    const throughputTrend = Object.keys(dailyActivity).sort().map(day => ({
      time: day,
      value: dailyActivity[day].txs
    }));

    const userTrend = Object.keys(dailyActivity).sort().map(day => ({
      time: day,
      value: dailyActivity[day].users.size
    }));

    return {
      dau: dauToday,
      dauDetails,
      totalTransactions: transactionDetails.length,
      transactionDetails,
      retention: retentionRate,
      retentionDetails: { returning: returningUsers, new: newUsers },
      totalUsers: identifierDetails.length,
      identifierDetails,
      throughputTrend,
      userTrend
    };
  }, [data]);

  const stats = metrics ? [
    { id: 'dau', icon: Cpu, label: 'DAU (Today)', value: metrics.dau.toString(), sub: 'Active signatures', color: 'text-success bg-success/10' },
    { id: 'retention', icon: Clock, label: 'User Retention', value: `${metrics.retention}%`, sub: 'Repeat interactions', color: 'text-primary bg-primary/10' },
    { id: 'txs', icon: Zap, label: 'Total Transactions', value: metrics.totalTransactions.toString(), sub: 'Ledger volume', color: 'text-warning bg-warning/10' },
    { id: 'identifiers', icon: Wifi, label: 'Unique Identifiers', value: metrics.totalUsers.toString(), sub: 'Verified identities', color: 'text-purple-500 bg-purple-500/10' },
  ] : [];

  return (
    <div className="min-h-screen bg-background text-foreground">

      <div className="p-8 space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-tight">Network Vitality</h1>
            <p className="text-sm text-muted-foreground">Audit-grade protocol monitoring and real-time user flow.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="gap-2 text-sm" onClick={() => window.location.reload()}>
                <Terminal className="h-4 w-4" /> Refresh Ledger
             </Button>
          </div>
        </div>

        {data.loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Synchronizing with node cluster...</p>
          </div>
        ) : !metrics ? (
          <div className="text-center py-24 border-2 border-dashed border-border rounded-lg bg-card/30">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Protocol Idle</h3>
            <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
              No ledger activity detected. Metrics will populate once bookings or blocks are broadcasted.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveStat(activeStat === s.id ? null : s.id)}
                  className={cn(
                      "p-6 rounded-lg border transition-colors cursor-pointer group relative overflow-hidden",
                      activeStat === s.id ? "bg-muted border-primary" : "bg-card border-border hover:border-primary/50"
                  )}
                >
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors", s.color)}>
                      <s.icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-semibold text-foreground tracking-tight">{s.value}</p>
                  <p className="text-sm font-medium text-foreground mt-1">{s.label}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{s.sub}</p>
                    <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", activeStat === s.id && "rotate-90 text-primary")} />
                  </div>
                </div>
              ))}
            </div>

              {activeStat && (
                <div className="rounded-lg border border-border bg-card p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Activity className="h-4 w-4" />
                      </div>
                      <h3 className="text-base font-semibold capitalize">{activeStat.replace('txs', 'transactions')} Underlying Data</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setActiveStat(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {activeStat === 'dau' && (
                      <DataTable 
                        headers={['User Signature', 'Activity', 'Timestamp']}
                        data={metrics.dauDetails.map(d => [
                          <span className="font-mono text-xs">{d.id}</span>,
                          <span className="text-xs px-2 py-0.5 rounded-md bg-muted border border-border">{d.label}</span>,
                          <span className="text-xs text-muted-foreground">{moment(d.time).fromNow()}</span>
                        ])}
                      />
                    )}

                    {activeStat === 'retention' && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-success">Returning Users ({metrics.retentionDetails.returning.length})</p>
                          <DataTable 
                             headers={['Identity', 'Frequency']}
                             data={metrics.retentionDetails.returning.map(u => [
                               <span className="font-mono text-xs">{u.id}</span>,
                               <span className="text-xs font-bold text-primary">{u.count} interactions</span>
                             ])}
                          />
                        </div>
                        <div className="space-y-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">New Users ({metrics.retentionDetails.new.length})</p>
                          <DataTable 
                             headers={['Identity', 'Status']}
                             data={metrics.retentionDetails.new.map(u => [
                               <span className="font-mono text-xs">{u.id}</span>,
                               <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted border border-border uppercase">First Interaction</span>
                             ])}
                          />
                        </div>
                      </div>
                    )}

                    {activeStat === 'txs' && (
                      <DataTable 
                        headers={['Event Hash / ID', 'Type', 'Status', 'Time']}
                        data={metrics.transactionDetails.map(t => [
                          <span className="font-mono text-xs truncate max-w-[120px] block">{t.id}</span>,
                          <span className="text-xs font-medium">{t.type}</span>,
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase font-bold">{t.status?.replace(/_/g, ' ')}</span>,
                          <span className="text-xs text-muted-foreground">{moment(t.time).format('MMM DD, HH:mm')}</span>
                        ])}
                      />
                    )}

                    {activeStat === 'identifiers' && (
                      <DataTable 
                        headers={['Signature ID', 'Classification', 'Total Activity']}
                        data={metrics.identifierDetails.map(i => [
                          <span className="font-mono text-xs">{i.id}</span>,
                          <span className="text-xs">{i.type}</span>,
                          <span className="text-xs font-bold">{i.count} events</span>
                        ])}
                      />
                    )}
                  </div>
                </div>
              )}

            <div className="grid lg:grid-cols-2 gap-6">
              <ChartPanel title="Daily Active Users" subtitle="Unique interaction signatures per day" badge="User Flow">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={metrics.userTrend} barCategoryGap="20%">
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartPanel>
              <ChartPanel title="Transaction Throughput" subtitle="Bookings and Blocks processed" badge="Velocity">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={metrics.throughputTrend}>
                    <defs>
                      <linearGradient id="tpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)' }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#tpGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DataTable({ headers, data }) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-border/40">
          {headers.map(h => (
            <th key={h} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-2.5 px-2">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border/20">
        {data.length === 0 ? (
          <tr><td colSpan={headers.length} className="py-8 text-center text-xs text-muted-foreground">No data available in this segment</td></tr>
        ) : data.map((row, i) => (
          <tr key={i} className="hover:bg-muted/10 transition-colors">
            {row.map((cell, j) => (
              <td key={j} className="py-2.5 px-2 whitespace-nowrap">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChartPanel({ title, subtitle, badge, children }) {
    return (
        <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-base font-semibold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
                <div className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">{badge}</div>
            </div>
            <div className="relative">{children}</div>
        </div>
    );
}
