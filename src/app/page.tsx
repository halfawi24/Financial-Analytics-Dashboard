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
import { DataGrid } from '@/components/enterprise/data-grid';
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
  Download,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
} from 'lucide-react';

interface CollapsibleSection {
  id: string;
  title: string;
  isOpen: boolean;
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [scenario, setScenario] = useState<'base' | 'best' | 'worst'>('base');
  const [assumptions, setAssumptions] = useState<FinancialAssumptions>(DEFAULT_ASSUMPTIONS);
  const [extractedData, setExtractedData] = useState<Partial<FinancialAssumptions> | undefined>(undefined);
  const [activeNav, setActiveNav] = useState<'overview' | 'forecast' | 'analysis' | 'files' | 'settings'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sections, setSections] = useState<CollapsibleSection[]>([
    { id: 'overview', title: '📊 Financial Overview', isOpen: true },
    { id: 'cashflow', title: '💰 Cash Flow Analysis', isOpen: true },
    { id: 'revenue', title: '📈 Revenue & Profitability', isOpen: true },
    { id: 'workingcap', title: '⏱️ Working Capital', isOpen: false },
    { id: 'scenarios', title: '🔄 Scenario Comparison', isOpen: false },
    { id: 'data', title: '📋 Financial Data Table', isOpen: false },
    { id: 'fileupload', title: '📁 File Import', isOpen: false },
    { id: 'export', title: '⬇️ Export Reports', isOpen: false },
    { id: 'assumptions', title: '⚙️ Assumptions', isOpen: false },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const monthlyData = useMemo(
    () => calculateMonthlyMetrics(assumptions, scenario),
    [assumptions, scenario]
  );

  const insights = useMemo(() => generateInsights(monthlyData, assumptions), [monthlyData, assumptions]);

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, isOpen: !s.isOpen } : s
    ));
  };

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

            {/* Collapsible Sections */}
            <div className="space-y-4">
              {sections.map((section, idx) => {
                const isOpen = section.isOpen;
                
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="card"
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                      <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </button>

                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-200 p-4 space-y-6"
                      >
                        {/* Overview Section */}
                        {section.id === 'overview' && (
                          <>
                            <MetricGrid metrics={overviewMetrics} />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="card">
                                <h4 className="text-md font-bold text-slate-900 mb-4">Revenue Trend</h4>
                                <RevenueTrendChart data={monthlyData} height={250} />
                              </div>
                              <div className="card">
                                <h4 className="text-md font-bold text-slate-900 mb-4">Cash Flow Trend</h4>
                                <CashFlowTrendChart data={monthlyData} height={250} />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Cash Flow Analysis */}
                        {section.id === 'cashflow' && (
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
                        )}

                        {/* Revenue & Profitability */}
                        {section.id === 'revenue' && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="card">
                              <h4 className="text-md font-bold text-slate-900 mb-4">Expense Breakdown</h4>
                              <ExpenseBreakdownChart data={monthlyData} height={280} />
                            </div>
                            <div className="card">
                              <h4 className="text-md font-bold text-slate-900 mb-4">Revenue Trend</h4>
                              <RevenueTrendChart data={monthlyData} height={280} />
                            </div>
                          </div>
                        )}

                        {/* Working Capital */}
                        {section.id === 'workingcap' && (
                          <div className="bg-slate-50 rounded-lg p-4 text-center">
                            <p className="text-sm text-slate-600">
                              AR Days: <span className="font-bold text-slate-900">{assumptions.arDays}</span> | 
                              AP Days: <span className="font-bold text-slate-900">{assumptions.apDays}</span> |
                              CCC: <span className="font-bold text-slate-900">{assumptions.arDays - assumptions.apDays}</span>
                            </p>
                          </div>
                        )}

                        {/* Scenario Comparison */}
                        {section.id === 'scenarios' && (
                          <ScenarioComparison metrics={scenarioMetrics} activeScenario={scenario} />
                        )}

                        {/* Data Table */}
                        {section.id === 'data' && (
                          <DataGrid data={monthlyData} />
                        )}

                        {/* File Upload */}
                        {section.id === 'fileupload' && (
                          <FileUploadCardEnhanced onAssumptionsExtracted={setExtractedData} />
                        )}

                        {/* Export */}
                        {section.id === 'export' && (
                          <ExportPanel scenario={scenario} monthlyData={monthlyData} assumptions={assumptions} />
                        )}

                        {/* Assumptions */}
                        {section.id === 'assumptions' && (
                          <AssumptionsPanelEnhanced 
                            assumptions={assumptions} 
                            onChange={setAssumptions}
                            extractedData={extractedData}
                          />
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
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
