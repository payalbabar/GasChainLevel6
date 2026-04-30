import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, Plus, User, MapPin, Phone, Mail, ShoppingCart, Clock, Loader2, AlertCircle, ChevronRight, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import moment from "moment";
import { Button } from "@/components/ui/button";

export default function Customers() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await base44.entities.Booking.list("-created_date", 200);
        setBookings(data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch customer data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Derive unique customers from bookings
  const customers = useMemo(() => {
    const map = new Map();
    bookings.forEach(b => {
      if (!b.customer_name) return;
      const key = b.customer_phone || b.customer_name;
      if (!map.has(key)) {
        map.set(key, {
          id: b.id || key,
          name: b.customer_name,
          phone: b.customer_phone || "+254 --- --- ---",
          address: b.customer_address?.split(',')[0] || "Unknown Location",
          orders: [],
          totalSpent: 0,
          status: "active"
        });
      }
      const c = map.get(key);
      c.orders.push(b);
      c.totalSpent += (b.final_amount || b.total_amount || 0);
      c.lastOrderDate = !c.lastOrderDate || new Date(b.created_date) > new Date(c.lastOrderDate) 
        ? b.created_date 
        : c.lastOrderDate;
    });
    return Array.from(map.values()).sort((a, b) => b.orders.length - a.orders.length);
  }, [bookings]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1400px] mx-auto space-y-6">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Customers</h1>
          <p className="text-xs text-muted-foreground">{customers.length} total registered customers</p>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground font-bold rounded-md">
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 bg-background border border-border/50 rounded-md text-xs text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 border-border/50 text-xs text-muted-foreground hover:text-white">
            <Filter className="mr-2 h-3.5 w-3.5" /> Filter
          </Button>
        </div>
      </div>

      {/* ── Main Content Split ── */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        
        {/* LEFT (70%): Customers Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col min-h-[500px]">
          <CustomersTable 
            customers={filteredCustomers} 
            loading={loading} 
            error={error}
            selectedCustomer={selectedCustomer}
            onSelect={setSelectedCustomer}
          />
        </div>

        {/* RIGHT (30%): Detail Panel */}
        <div className="sticky top-6">
          <CustomerDetailPanel customer={selectedCustomer} />
        </div>

      </div>
    </div>
  );
}

// ── Components ──

function CustomersTable({ customers, loading, error, selectedCustomer, onSelect }) {
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading customers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm font-semibold text-white">{error}</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-12 w-12 rounded-lg bg-secondary/30 flex items-center justify-center">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-white">No customers found</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-secondary/20">
            <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Customer</th>
            <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Contact</th>
            <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Orders</th>
            <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden md:table-cell">Last Order</th>
            <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {customers.map(c => (
            <CustomerRow 
              key={c.id} 
              customer={c} 
              isSelected={selectedCustomer?.id === c.id}
              onClick={() => onSelect(c)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerRow({ customer, isSelected, onClick }) {
  return (
    <tr 
      onClick={onClick}
      className={cn(
        "cursor-pointer transition-colors duration-150 group",
        isSelected ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-[#1F2937]/30 border-l-2 border-l-transparent"
      )}
    >
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-white shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{customer.name}</p>
            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
              <MapPin size={10} /> {customer.address}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5 hidden sm:table-cell">
        <p className="text-xs text-muted-foreground font-mono">{customer.phone}</p>
      </td>
      <td className="px-4 py-2.5">
        <p className="text-sm font-bold text-white">{customer.orders.length}</p>
        <p className="text-[10px] text-muted-foreground">KES {customer.totalSpent.toLocaleString()}</p>
      </td>
      <td className="px-4 py-2.5 hidden md:table-cell">
        <p className="text-xs text-muted-foreground">{moment(customer.lastOrderDate).format("MMM D, YYYY")}</p>
      </td>
      <td className="px-4 py-2.5 text-right">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Active
        </div>
      </td>
    </tr>
  );
}

function CustomerDetailPanel({ customer }) {
  const navigate = useNavigate();

  if (!customer) {
    return (
      <div className="bg-card border border-border rounded-lg h-[500px] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-full bg-secondary/30 flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-semibold text-white">No Customer Selected</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Select a customer from the table to view their details and order history.</p>
      </div>
    );
  }

  const activeOrders = customer.orders.filter(o => o.status === 'confirmed' || o.status === 'pending');

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
      
      {/* Profile Section */}
      <div className="p-6 border-b border-border bg-secondary/10">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-14 w-14 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{customer.name}</h2>
            <p className="text-xs text-muted-foreground font-mono">ID: {customer.id.substring(0, 8)}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone size={14} className="text-primary/70" /> {customer.phone}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin size={14} className="text-primary/70" /> {customer.address}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px bg-border border-b border-border">
        <CustomerStatsCard label="Total Orders" value={customer.orders.length} />
        <CustomerStatsCard label="Total Spent" value={`₹${customer.totalSpent.toLocaleString()}`} isCurrency />
      </div>

      {/* Recent Orders List */}
      <div className="p-5 flex-1 overflow-y-auto max-h-[500px]">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Complete Order History</h3>
        <CustomerOrdersList orders={customer.orders} />
      </div>

      {/* Actions */}
      <div className="p-5 border-t border-border bg-secondary/5 space-y-2">
        <Button onClick={() => navigate("/book")} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 rounded-md">
          Create new order
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-9 border-border hover:border-muted-foreground/50 text-xs text-muted-foreground hover:text-white transition-colors">
            Edit
          </Button>
          <Button variant="outline" className="flex-1 h-9 border-destructive/30 text-destructive hover:bg-destructive/10 text-xs transition-colors">
            Disable
          </Button>
        </div>
      </div>

    </div>
  );
}

function CustomerStatsCard({ label, value, isCurrency }) {
  return (
    <div className="bg-card p-4 flex flex-col justify-center items-center text-center">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className={cn("text-lg font-bold text-white", isCurrency && "font-mono text-primary")}>{value}</p>
    </div>
  );
}

function CustomerOrdersList({ orders }) {
  if (orders.length === 0) return <p className="text-xs text-muted-foreground text-center py-4">No order history.</p>;

  return (
    <div className="space-y-3">
      {orders.map(order => (
        <div key={order.id} className="flex items-center justify-between p-3 rounded-md border border-border/50 bg-background hover:border-border transition-colors group cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-8 w-8 rounded-md flex items-center justify-center shrink-0",
              order.status === "delivered" ? "bg-emerald-500/10 text-emerald-500" :
              order.status === "pending" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
            )}>
              <ShoppingCart size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-white font-mono">{order.booking_id || order.id.substring(0,8)}</p>
              <p className="text-[10px] text-muted-foreground">{moment(order.created_date).format("MMM D, YYYY")}</p>
            </div>
          </div>
          <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );
}
