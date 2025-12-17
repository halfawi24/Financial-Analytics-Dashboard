'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  calculateMonthlyMetrics,
  generateInsights,
  DEFAULT_ASSUMPTIONS,
  type FinancialAssumptions,
} from '@/lib/financial-engine';
import { KPIStrip } from '@/components/enterprise/kpi-strip';
import { MetricGrid } from '@/components/enterprise/metric-cards';
import { FileUploadCardEnhanced } from '@/components/enterprise/file-upload-card-enhanced';

import { ScenarioComparison } from '@/components/enterprise/scenario-comparison';
import { ExportPanel } from '@/components/enterprise/export-panel';
import { AssumptionsPanelEnhanced } from '@/components/enterprise/assumptions-panel-enhanced';
import { RevenueTrendChart, CashFlowTrendChart } from '@/components/charts/revenue-trend-chart';
import { RevenueBreakdownChart, InflowOutflowChart, ExpenseBreakdownChart } from '@/components/charts/comparison-charts';
import { 
  LayoutDashboard, 
  FileUp, 
  BarChart3, 
  Settings, 
  Menu,
  X,
} from 'lucide-react';



export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [scenario, setScenario] = useState<'base' | 'best' | 'worst'>('base');
  const [assumptions, setAssumptions] = useState<FinancialAssumptions>(DEFAULT_ASSUMPTIONS);
  const [extractedData, setExtractedData] = useState<Partial<FinancialAssumptions> | undefined>(undefined);
  const [activeNav, setActiveNav] = useState<'overview' | 'forecast' | 'analysis' | 'files' | 'settings'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle automatic dashboard population when file is imported
  const handleAssumptionsExtracted = (newAssumptions: Partial<FinancialAssumptions>) => {
    setExtractedData(newAssumptions);
    
    // Merge extracted data with existing assumptions
    const mergedAssumptions: FinancialAssumptions = {
      ...assumptions,
      ...Object.fromEntries(
        Object.entries(newAssumptions).filter(([key, v]) => v !== undefined && v !== null && key)
      ),
    };
    
    // Auto-apply the extracted assumptions
    setAssumptions(mergedAssumptions);
    
    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 4000);
    
    // Navigate to overview to show results
    setActiveNav('overview');
  };

  const monthlyData = useMemo(
    () => calculateMonthlyMetrics(assumptions, scenario),
    [assumptions, scenario]
  );

  const insights = useMemo(() => generateInsights(monthlyData, assumptions), [monthlyData, assumptions]);



  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  const finalMetrics = {
    revenue: monthlyData.reduce((acc, m) => acc + m.revenue, 0),
    ebitda: monthlyData.reduce((acc, m) => acc + m.ebitda, 0),
    cash: monthlyData[11]?.endingCash || 0,
    dscr: insights.dscr || 0,
    runway: insights.cashRunway || 0,
    margin: monthlyData.length > 0 ? (monthlyData.reduce((acc, m) => acc + m.ebitda, 0) / monthlyData.reduce((acc, m) => acc + m.revenue, 0)) : 0,
  };

  const overviewMetrics = [
    { label: '12M Revenue', value: finalMetrics.revenue, format: 'currency' as const, status: 'excellent' as const, trend: 12.5 },
    { label: 'Total EBITDA', value: finalMetrics.ebitda, format: 'currency' as const, status: 'healthy' as const, trend: 8.2 },
    { label: 'EBITDA Margin', value: finalMetrics.margin, format: 'percent' as const, status: finalMetrics.margin > 0.3 ? 'excellent' as const : 'healthy' as const },
    { label: 'Cash Balance', value: finalMetrics.cash, format: 'currency' as const, status: finalMetrics.cash > 200000 ? 'excellent' as const : finalMetrics.cash > 100000 ? 'healthy' as const : 'warning' as const },
    { label: 'DSCR', value: finalMetrics.dscr, format: 'number' as const, status: finalMetrics.dscr > 1.5 ? 'excellent' as const : 'healthy' as const },
    { label: 'Cash Runway', value: finalMetrics.runway, format: 'number' as const, status: finalMetrics.runway > 24 ? 'excellent' as const : 'healthy' as const },
  ];

  const scenarioMetrics = [
    { label: '12M Revenue', base: finalMetrics.revenue, best: finalMetrics.revenue * 1.25, worst: finalMetrics.revenue * 0.85, format: 'currency' as const },
    { label: 'Total EBITDA', base: finalMetrics.ebitda, best: finalMetrics.ebitda * 1.35, worst: finalMetrics.ebitda * 0.75, format: 'currency' as const },
    { label: 'Ending Cash', base: finalMetrics.cash, best: finalMetrics.cash * 1.4, worst: finalMetrics.cash * 0.6, format: 'currency' as const },
    { label: 'DSCR', base: finalMetrics.dscr, best: finalMetrics.dscr * 1.3, worst: finalMetrics.dscr * 0.85, format: 'number' as const },
  ];

  // Display extracted metrics count for confirmation
  const extractedMetricsCount = Object.keys(extractedData || {}).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky KPI Bar */}
      <KPIStrip metrics={finalMetrics} scenario={scenario} />

      <div className="flex relative">
        {/* Mobile Menu Toggle */}
        <motion.button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-4 left-4 z-50 md:hidden p-2 hover:bg-slate-100 rounded-lg"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.button>

        {/* Sidebar Navigation */}
        <motion.aside 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`fixed md:static top-0 left-0 w-64 bg-white border-r border-slate-200 min-h-screen pt-4 transition-all ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } z-40 md:z-auto`}
        >
          <div className="px-4 mb-8 mt-12 md:mt-0">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Menu</h2>
          </div>
          
          <nav className="space-y-2 px-4">
            {[
              { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
              { id: 'forecast' as const, label: 'Forecasting', icon: BarChart3 },
              { id: 'analysis' as const, label: 'Analysis', icon: BarChart3 },
              { id: 'files' as const, label: 'File Import', icon: FileUp },
              { id: 'settings' as const, label: 'Settings', icon: Settings },
            ].map(item => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    setActiveNav(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeNav === item.id
                      ? 'bg-teal-50 text-teal-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </motion.button>
              );
            })}
          </nav>

          {/* Scenario Selector */}
          <div className="mt-8 px-4 border-t border-slate-200 pt-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Scenarios</h3>
            <div className="space-y-2">
              {['base', 'best', 'worst'].map((s) => (
                <motion.button
                  key={s}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setScenario(s as any)}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scenario === s
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {s === 'base' ? '📊 Base' : s === 'best' ? '🚀 Best' : '⚠️ Worst'} Case
                </motion.button>
              ))}
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto w-full md:w-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 mt-16 md:mt-0"
            >
              <h1 className="text-3xl font-bold text-slate-900">Financial Analytics Dashboard</h1>
              <p className="text-slate-600 mt-2">
                Scenario: <span className="font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  {scenario.toUpperCase()} CASE
                </span>
              </p>
            </motion.div>

            {/* Content Sections Based on Active Navigation */}
            <div className="space-y-4">
              {/* Overview Section */}
              {activeNav === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="card p-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Financial Overview</h2>
                    <MetricGrid metrics={overviewMetrics} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      <div className="card">
                        <h4 className="text-md font-bold text-slate-900 mb-4">Revenue Trend</h4>
                        <RevenueTrendChart data={monthlyData} height={250} />
                      </div>
                      <div className="card">
                        <h4 className="text-md font-bold text-slate-900 mb-4">Cash Flow Trend</h4>
                        <CashFlowTrendChart data={monthlyData} height={250} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Forecasting Section */}
              {activeNav === 'forecast' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="card p-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Forecasting & Scenarios</h2>
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Scenario Analysis</h3>
                      <ScenarioComparison metrics={scenarioMetrics} activeScenario={scenario} />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="card">
                        <h4 className="text-md font-bold text-slate-900 mb-4">Revenue Breakdown</h4>
                        <RevenueBreakdownChart data={monthlyData} height={250} />
                      </div>
                      <div className="card">
                        <h4 className="text-md font-bold text-slate-900 mb-4">Inflow vs Outflow</h4>
                        <InflowOutflowChart data={monthlyData} height={250} />
                      </div>
                      <div className="card">
                        <h4 className="text-md font-bold text-slate-900 mb-4">Expense Breakdown</h4>
                        <ExpenseBreakdownChart data={monthlyData} height={250} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Analysis Section */}
              {activeNav === 'analysis' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="card p-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Financial Analysis</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="card">
                        <h4 className="text-md font-bold text-slate-900 mb-4">Inflow vs Outflow</h4>
                        <InflowOutflowChart data={monthlyData} height={280} />
                      </div>
                      <div className="card">
                        <h4 className="text-md font-bold text-slate-900 mb-4">Revenue Breakdown</h4>
                        <RevenueBreakdownChart data={monthlyData} height={280} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* File Import Section */}
              {activeNav === 'files' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="card p-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">File Import & Data Upload</h2>
                    <FileUploadCardEnhanced onAssumptionsExtracted={handleAssumptionsExtracted} />
                    {showSuccessMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-white font-bold">✓</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-800">Data Extracted Successfully</p>
                            <p className="text-xs text-green-700 mt-1">
                              {extractedMetricsCount > 0 
                                ? `${extractedMetricsCount} parameters loaded. Dashboard updated automatically.`
                                : 'Dashboard ready with extracted assumptions.'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Settings Section */}
              {activeNav === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="card p-4">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Settings & Configuration</h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Assumptions Editor</h3>
                        <AssumptionsPanelEnhanced 
                          assumptions={assumptions} 
                          onChange={setAssumptions}
                          extractedData={extractedData}
                        />
                      </div>
                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Export Options</h3>
                        <ExportPanel scenario={scenario} monthlyData={monthlyData} assumptions={assumptions} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 p-4 bg-slate-100 rounded-lg text-center text-xs text-slate-600"
            >
              <p>FlexFinToolkit — Enterprise Financial Analytics Platform | All data is calculated in real-time</p>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
