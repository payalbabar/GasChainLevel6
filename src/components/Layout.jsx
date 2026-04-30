import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, ShoppingCart, Package, Truck, 
  Users, BarChart3, Settings, Bell, MapPin, Search, 
  ChevronDown, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { path: "/bookings", label: "Orders", icon: ShoppingCart },
    { path: "/supply-chain", label: "Inventory", icon: Package },
    { path: "/deliveries", label: "Deliveries", icon: Truck },
    { path: "/customers", label: "Customers", icon: Users },
    { path: "/dashboard/metrics", label: "Reports", icon: BarChart3 },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      
      {/* ── Fixed Sidebar (240px) ── */}
      <aside className="saas-sidebar shrink-0">
        <div className="h-14 flex items-center px-6 border-b border-border mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 bg-primary rounded flex items-center justify-center">
              <Package className="text-white h-4.5 w-4.5" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white uppercase">GasChain</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "nav-link",
                  isActive && "nav-link-active"
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group cursor-pointer">
            <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center text-primary font-bold text-xs">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wider">Enterprise</p>
            </div>
            <button onClick={() => logout()} className="p-1.5 text-muted-foreground hover:text-destructive">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Layout Container ── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ── Fixed Navbar (56px) ── */}
        <header className="saas-navbar">
          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-1">
              {[
                { name: 'Dashboard', path: '/dashboard' },
                { name: 'Orders', path: '/bookings' },
                { name: 'Deliveries', path: '/deliveries' },
                { name: 'Inventory', path: '/supply-chain' },
                { name: 'Reports', path: '/dashboard/metrics' }
              ].map((tab) => {
                const isActive = location.pathname.startsWith(tab.path);
                return (
                  <Link 
                    key={tab.name} 
                    to={tab.path}
                    className={cn(
                      "px-4 py-1.5 text-xs font-medium rounded-md transition-all",
                      isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-white hover:bg-secondary/50"
                    )}
                  >
                    {tab.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border cursor-pointer hover:bg-secondary transition-colors text-[11px] font-medium text-muted-foreground">
              <MapPin size={12} />
              Active Node
              <ChevronDown size={10} />
            </div>
            
            <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground relative">
              <Bell size={16} />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-primary rounded-full border-2 border-background" />
            </button>
            
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-primary">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 relative overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
