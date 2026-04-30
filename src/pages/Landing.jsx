import React from "react";
import { motion } from "framer-motion";
import { 
  Shield, Zap, Globe, ArrowRight, 
  Layers, Lock, Database, Code2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary overflow-x-hidden font-sans">
      
      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-border px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="h-7 w-7 bg-primary rounded flex items-center justify-center">
              <Layers className="text-white h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tighter text-white uppercase">GasChain</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Protocol', 'Solutions', 'Security', 'Developers'].map(item => (
              <a key={item} href="#" className="text-[13px] font-medium text-muted-foreground hover:text-white transition-colors">{item}</a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-xs font-semibold hover:bg-secondary" onClick={() => navigate("/dashboard")}>Sign in</Button>
          <Button size="sm" onClick={() => navigate("/dashboard")} className="bg-primary text-primary-foreground font-bold text-xs rounded-md px-5 h-9">Get Started</Button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase"
          >
            <Zap className="h-3 w-3 fill-primary" />
            V2.4 Protocol Status: Stable
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-8xl font-bold tracking-tighter leading-[0.9] text-white"
          >
            Energy logistics, <br />
            <span className="text-muted-foreground">reimagined.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium"
          >
            The enterprise operating system for global LPG distribution. 
            Cryptographically verified, instantly settled, globally compliant.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button 
              size="lg" 
              onClick={() => navigate("/dashboard")}
              className="h-12 px-8 bg-primary text-primary-foreground font-bold rounded-md group"
            >
              Launch Dashboard <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => alert("Documentation portal is being synchronized with the network protocol. Please check back shortly.")}
              className="h-12 px-8 rounded-md border-border hover:bg-secondary font-semibold transition-colors duration-150"
            >
              Documentation
            </Button>
          </motion.div>
        </div>
      </main>

      {/* ── Feature Grid ── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
          <FeatureCard 
            icon={Lock} 
            title="Sovereign Identity" 
            desc="Physical assets linked to unique cryptographic identities on the network ledger." 
          />
          <FeatureCard 
            icon={Database} 
            title="Real-time Ledger" 
            desc="Instant settlement with zero reconciliation overhead. Audit ready by default." 
          />
          <FeatureCard 
            icon={Globe} 
            title="Global Compliance" 
            desc="Automated reporting and multi-region tax settlement built into the protocol." 
          />
        </div>
      </section>

      {/* ── Architecture ── */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center space-y-12">
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Protocol Layer</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">Built for the future.</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <TechItem icon={Code2} label="SOROBAN" />
          <TechItem icon={Layers} label="CAP-0015" />
          <Shield size={32} className="mx-auto" />
          <Zap size={32} className="mx-auto" />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-20 px-6 bg-card">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-4 max-w-xs">
            <div className="flex items-center gap-2">
              <Layers className="text-primary h-5 w-5" />
              <span className="text-xl font-bold tracking-tighter text-white uppercase">GasChain</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Standardizing the global energy grid through decentralized protocol logic.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <FooterCol title="Protocol" links={['Mainnet', 'Nodes', 'Governance']} />
            <FooterCol title="Resources" links={['Docs', 'API', 'Audit']} />
            <FooterCol title="Company" links={['About', 'Privacy', 'Terms']} />
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="bg-card p-10 space-y-4 hover:bg-secondary/20 transition-colors group">
      <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
        <Icon size={20} />
      </div>
      <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function TechItem({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Icon size={32} className="mx-auto" />
      <span className="text-[10px] font-bold tracking-widest uppercase">{label}</span>
    </div>
  );
}

function FooterCol({ title, links }) {
  return (
    <div className="space-y-4">
      <h4 className="text-[11px] font-bold text-white uppercase tracking-widest">{title}</h4>
      <ul className="space-y-2">
        {links.map(link => (
          <li key={link}><a href="#" className="text-sm text-muted-foreground hover:text-white transition-colors">{link}</a></li>
        ))}
      </ul>
    </div>
  );
}
