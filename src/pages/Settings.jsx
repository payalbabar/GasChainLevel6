import React, { useState } from 'react';
import { User, Shield, Globe, Bell, Lock, Database, Trash2, CheckCircle, Smartphone, Key } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Account Profile', icon: User },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'network', label: 'Network Node', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const handleClearCache = () => {
    localStorage.clear();
    toast({ title: "Cache Cleared", description: "Local system cache has been purged. Re-synchronizing..." });
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your enterprise identity and network protocol configuration.</p>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-10">
        
        {/* Sidebar Nav */}
        <div className="space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                activeTab === tab.id 
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="space-y-8">
          
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <section className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-xl font-bold border border-primary/30">
                    {user?.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{user?.name || 'Administrator'}</h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Enterprise Authority Node</p>
                  </div>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6 pt-4">
                  <SettingItem label="Email Address" value={user?.email || 'admin@gaschain.network'} />
                  <SettingItem label="Organization" value="GasChain Logistics PVT" />
                  <SettingItem label="Node Status" value="Active / Synced" />
                  <SettingItem label="Account Type" value="Enterprise Protocol" />
                </div>
              </section>

              <section className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-border/50 pb-3">Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="rounded-xl h-10 px-6 border-border/50 hover:bg-white/5 transition-all">Edit Profile</Button>
                  <Button onClick={handleClearCache} variant="outline" className="rounded-xl h-10 px-6 border-destructive/20 text-destructive hover:bg-destructive/10 transition-all">
                    <Trash2 className="h-4 w-4 mr-2" /> Purge System Cache
                  </Button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <section className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-border/50 pb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" /> Cryptographic Identity
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Freighter Wallet Connected</p>
                        <p className="text-xs text-muted-foreground font-mono">G...42X9A</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">Disconnect</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-black/20 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Key size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Two-Factor Authentication</p>
                        <p className="text-xs text-muted-foreground">Enabled via Authenticator</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">Update</Button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <section className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest border-b border-border/50 pb-3 flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" /> Stellar Protocol Connection
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Horizon Node URL</label>
                    <div className="flex gap-2">
                      <input 
                        readOnly
                        value="https://horizon-testnet.stellar.org"
                        className="flex-1 h-10 px-4 bg-black/20 border border-border/50 rounded-xl text-xs font-mono text-white outline-none"
                      />
                      <Button variant="outline" className="rounded-xl">Test Latency</Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Smartphone className="h-4 w-4" /> Device ID: <span className="font-mono text-white">node-enterprise-v2-main</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Node
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function SettingItem({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}
