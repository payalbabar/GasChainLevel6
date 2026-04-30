import React, { useState, useEffect, useMemo } from "react"; // Fixed useMemo import
import { 
  ShoppingCart, Package, Truck, BarChart3, 
  Plus, Search, Filter, Download, ArrowRight,
  AlertCircle, ChevronRight, Box
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import moment from "moment";
import { cn } from "@/lib/utils";

// ── Components ──

function StatusBadge({ status }) {
  const styles = {
    pending:   "bg-amber-500/10 text-amber-500 border-amber-500/20",
    confirmed: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    failed:    "bg-red-500/10 text-red-500 border-red-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  };
  return (
    <div className={cn("badge", styles[status] || "bg-muted/10 text-muted border-border/20")}>
      <span className="h-1 w-1 rounded-full bg-current" />
      {status?.replace(/_/g, " ")}
    </div>
  );
}

function StatCard({ label, value, subtitle, icon: Icon, loading, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "stat-card group cursor-pointer transition-all duration-300",
        active ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "hover:border-primary/30"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
          {loading ? (
            <div className="h-8 w-24 skeleton mt-1" />
          ) : (
            <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          )}
        </div>
        <div className={cn(
          "h-8 w-8 rounded-md border flex items-center justify-center transition-colors duration-300",
          active ? "bg-primary text-white border-primary" : "bg-secondary/50 border-border text-primary group-hover:text-white group-hover:border-primary/50"
        )}>
          <Icon size={16} />
        </div>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-3 w-32 skeleton" />
        ) : (
          <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ orders: [], subsidies: [], stats: { total: 0, revenue: 0, pending: 0 } });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'revenue', 'pending'

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [bookings, subsidies] = await Promise.all([
        base44.entities.Booking.list("-created_date", 200),
        base44.entities.Subsidy.list("-created_date", 200)
      ]);

      const sortedOrders = bookings.sort((x, y) => new Date(y.created_date) - new Date(x.created_date));
      const totalRevenue = subsidies.reduce((acc, s) => acc + (s.amount || 0), 0);
      const pendingCount = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;

      setData({
        orders: sortedOrders,
        subsidies: subsidies,
        stats: {
          total: bookings.length,
          revenue: totalRevenue,
          pending: pendingCount
        }
      });
    } catch (err) {
      console.error(err);
      setError("Failed to synchronize with network ledger.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredData = useMemo(() => {
    if (activeFilter === 'pending') {
      return data.orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
    }
    return data.orders;
  }, [data.orders, activeFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Network Overview</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Status: {moment().format("MMMM D, YYYY")} · Stellar Mainnet
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 border-border/50 hover:bg-white/5" onClick={() => window.print()}>
            <Download size={14} className="mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate("/book")} size="sm" className="h-9 rounded-md bg-primary hover:bg-primary/90 text-white font-bold">
            <Plus size={16} className="mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          label="Total Orders" 
          value={data.stats.total} 
          subtitle="Validated blockchain entries" 
          icon={ShoppingCart} 
          loading={isLoading}
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
        />
        <StatCard 
          label="Total Revenue" 
          value={`₹${data.stats.revenue.toLocaleString()}`} 
          subtitle="Subsidies settled on-chain" 
          icon={BarChart3} 
          loading={isLoading}
          active={activeFilter === 'revenue'}
          onClick={() => { setActiveFilter('revenue'); navigate('/subsidies'); }}
        />
        <StatCard 
          label="Active Logistics" 
          value={data.stats.pending} 
          subtitle="Orders awaiting delivery" 
          icon={Truck} 
          loading={isLoading}
          active={activeFilter === 'pending'}
          onClick={() => setActiveFilter('pending')}
        />
      </div>

      {/* ── Main Data Table ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {activeFilter === 'all' ? 'Recent Ledger Activity' : activeFilter === 'pending' ? 'Active Shipments' : 'Revenue Streams'}
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search ID..." className="h-9 w-48 pl-9 bg-card border-border/50 text-xs focus:ring-1 focus:ring-primary/50" />
            </div>
            <Button variant="outline" size="sm" className="h-9 px-3 border-border/50">
              <Filter size={14} />
            </Button>
          </div>
        </div>

        {error ? (
          <div className="py-20 flex flex-col items-center justify-center border border-border rounded-lg bg-card">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <p className="text-sm font-medium text-white mb-2">{error}</p>
            <Button variant="secondary" onClick={fetchDashboardData} size="sm">Retry Sync</Button>
          </div>
        ) : (
          <div className="data-table-container">
            <div className="overflow-x-auto">
              <table className="saas-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>CUSTOMER</th>
                    <th>DEPOT</th>
                    <th>AMOUNT</th>
                    <th>DATE</th>
                    <th>STATUS</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                      <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-5 w-full skeleton" /></td></tr>
                    ))
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="h-12 w-12 rounded-lg bg-secondary/30 flex items-center justify-center">
                            <Box className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">No activity detected</p>
                            <p className="text-xs text-muted-foreground">The network ledger is currently empty.</p>
                          </div>
                          <Button size="sm" onClick={() => navigate("/book")} className="bg-primary text-primary-foreground font-bold">Create Entry</Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.slice(0, 10).map((order) => (
                      <tr key={order.id} className="group cursor-pointer" onClick={() => navigate("/bookings")}>
                        <td className="font-mono text-xs text-primary font-medium">{order.booking_id}</td>
                        <td className="text-white font-medium">{order.customer_name}</td>
                        <td className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">{order.location || 'Network Node'}</td>
                        <td className="text-white font-mono">₹{(order.final_amount || 0).toLocaleString()}</td>
                        <td className="text-muted-foreground">{moment(order.created_date).format("MMM D, YYYY")}</td>
                        <td>
                          <StatusBadge status={order.status} />
                        </td>
                        <td>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-colors" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!isLoading && data.orders.length > 0 && (
              <div className="p-4 border-t border-border flex justify-center bg-secondary/5">
                <Button variant="ghost" size="sm" className="text-xs font-medium text-muted-foreground hover:text-white" onClick={() => navigate("/bookings")}>
                  View full ledger <ArrowRight size={12} className="ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
