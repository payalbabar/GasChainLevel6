import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BookCylinder from './pages/BookCylinder';
import MyBookings from './pages/MyBookings';
import SupplyChain from './pages/SupplyChain';
import Subsidies from './pages/Subsidies';
import BlockchainLedger from './pages/BlockchainLedger';
import BlockchainSimulator from './components/BlockchainSimulator';
import Landing from './pages/Landing';
import MetricsDashboard from './pages/MetricsDashboard';

import Deliveries from './pages/Deliveries';
import Customers from './pages/Customers';
import Settings from './pages/Settings';

import { LayoutDashboard } from "lucide-react";

const AuthenticatedApp = () => {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  if (!isAuthenticated && location.pathname !== '/' && location.pathname !== '/login') {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/book" element={<BookCylinder />} />
        <Route path="/bookings" element={<MyBookings />} />
        <Route path="/supply-chain" element={<SupplyChain />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/subsidies" element={<Subsidies />} />
        <Route path="/dashboard/metrics" element={<MetricsDashboard />} />
        <Route path="/ledger" element={<BlockchainLedger />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <AuthenticatedApp />
          <BlockchainSimulator />
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
