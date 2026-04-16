import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Home from '@/pages/Home';
import Benefits from '@/pages/Benefits';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import TermsOfUse from '@/pages/TermsOfUse';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import Processes from '@/pages/processes/Processes'; 
import ProcessDetail from '@/pages/processes/ProcessDetail'; 
import ProcessForm from '@/pages/processes/ProcessForm'; 
import AdminPanel from '@/pages/AdminPanel';
import AuditPage from '@/pages/AuditPage';
import Header from '@/components/Header';
import DashboardLayout from '@/components/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import MyAccount from '@/pages/MyAccount';
import MyTeam from '@/pages/MyTeam';
import People from '@/pages/people/People';
import ScanBarcodePage from '@/pages/items/ScanBarcodePage';
import CapturePhotoPage from '@/pages/items/CapturePhotoPage';
import ManualEntryPage from '@/pages/items/ManualEntryPage';
import CalendarPage from '@/pages/CalendarPage';
import ReferralsPage from '@/pages/ReferralsPage';
import Consent from '@/pages/oauth/Consent';

const AppContent = () => {
  const location = useLocation();

  // Define public routes where the main Header should appear
  const publicRoutes = ['/', '/benefits', '/termos-de-uso', '/privacidade'];
  const isPublicRoute = publicRoutes.some(path => {
    // Exact match for '/'
    if (path === '/') return location.pathname === '/';
    // Starts with for other paths
    return location.pathname.startsWith(path);
  });

  // Check if it's an authentication route (login/signup) or oauth
  const isAuthRoute = location.pathname.startsWith('/login') || 
                      location.pathname.startsWith('/signup') ||
                      location.pathname.startsWith('/oauth');

  // Render the Header only if it's a public route and not an auth route
  const shouldShowHeader = isPublicRoute && !isAuthRoute;

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {shouldShowHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/benefits" element={<Benefits />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/termos-de-uso" element={<TermsOfUse />} />
        <Route path="/privacidade" element={<PrivacyPolicy />} />
        
        {/* OAuth Routes */}
        <Route path="/oauth/consent" element={<Consent />} />

        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/processes" element={<Processes />} />
          <Route path="/processes/new" element={<ProcessForm />} />
          <Route path="/processes/:id" element={<ProcessDetail />} />
          <Route path="/processes/:id/edit" element={<ProcessForm />} />
          <Route path="/account" element={<MyAccount />} />
          <Route path="/team" element={<MyTeam />} />
          <Route path="/people" element={<People />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          
          <Route path="/items/scan-barcode" element={<ScanBarcodePage />} />
          <Route path="/items/capture-photo" element={<CapturePhotoPage />} />
          <Route path="/items/manual-entry" element={<ManualEntryPage />} />
        </Route>

        <Route element={<AdminRoute><DashboardLayout /></AdminRoute>}>
            <Route path="/admin" element={<AdminPanel />} />
        </Route>

      </Routes>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;