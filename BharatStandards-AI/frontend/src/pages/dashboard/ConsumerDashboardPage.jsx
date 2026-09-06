import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  FileCheck2,
  AlertTriangle,
  Bot,
  Compass,
  ArrowRight,
  LogOut,
  Sparkles,
  ExternalLink,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, Badge, StatusBadge, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export const ConsumerDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cmNumber, setCmNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleVerifyMark = (e) => {
    e.preventDefault();
    if (!cmNumber.trim()) return;

    // Simulated authentic BIS verification result
    setVerificationResult({
      cmlNumber: cmNumber.trim().toUpperCase(),
      product: 'Stationary Storage Type Electric Water Heater',
      licensee: 'Bharat Domestic Appliances Ltd.',
      standard: 'IS 2082:2018',
      status: 'OPERATIVE',
      validUntil: '2027-03-31',
      nablLab: 'Central Laboratory, Sahibabad',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Consumer Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-saffron-600 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-base tracking-tight">
                BharatStandards <span className="text-saffron-600">Consumer Portal</span>
              </span>
            </Link>
            <Badge variant="saffron" size="sm">
              CONSUMER TRACK
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {user?.name || 'Citizen User'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {user?.email}
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLogout}
              startIcon={<LogOut className="w-3.5 h-3.5 text-slate-500" />}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 text-left">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-bharat-950 via-bharat-900 to-slate-900 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-2 max-w-2xl">
            <Badge variant="primary" size="sm">
              CITIZEN SAFETY & STANDARDS
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Citizen'}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Verify ISI certification numbers, understand mandatory product safety requirements, and check standard compliance before making purchases.
            </p>
          </div>
        </div>

        {/* Quick Verification Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-bharat-600 dark:text-bharat-400" />
                    <span>Verify ISI / CM/L License Number</span>
                  </CardTitle>
                  <Badge variant="neutral" size="sm">
                    INSTANT CHECK
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter the 7-digit or 8-digit CM/L license number printed under the ISI mark on your product.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleVerifyMark} className="flex gap-2">
                  <input
                    type="text"
                    value={cmNumber}
                    onChange={(e) => setCmNumber(e.target.value)}
                    placeholder="e.g. CM/L-8402914 or 8402914"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-bharat-500"
                  />
                  <Button type="submit" variant="primary" size="md">
                    Verify Mark
                  </Button>
                </form>

                {verificationResult && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                        License Verified • Genuine ISI Mark
                      </span>
                      <StatusBadge status="COMPLETED" label="OPERATIVE" size="sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Product:</span>
                        <span className="font-semibold">{verificationResult.product}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Standard:</span>
                        <span className="font-semibold font-mono">{verificationResult.standard}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Licensee:</span>
                        <span className="font-semibold">{verificationResult.licensee}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Valid Until:</span>
                        <span className="font-semibold">{verificationResult.validUntil}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="w-5 h-5 text-saffron-600" />
                  <span>Ask Consumer Copilot</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 dark:text-slate-400 space-y-3">
                <p>
                  Have a question about product safety, ISI markings, or hallmarking on jewellery?
                </p>
                <Link to="/assistant">
                  <Button variant="outline" size="sm" className="w-full gap-2 mt-1" endIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Launch AI Standards Chat
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Consumer Grievances</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <p>
                  Found sub-standard or counterfeit products misusing the ISI mark? Learn how to file an official report with the Bureau of Indian Standards.
                </p>
                <Link to="/services">
                  <Button variant="secondary" size="sm" className="w-full gap-2">
                    BIS Grievance Guide
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
