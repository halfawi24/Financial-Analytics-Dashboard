// Advanced Financial Calculation Engine
export interface FinancialAssumptions {
  openingCash: number;
  month1Revenue: number;
  monthlyGrowth: number;
  cogsPercent: number;
  monthlyOpex: number;
  monthlyCapex: number;
  taxRate: number;
  arDays: number;
  apDays: number;
  locAmount: number;
  locRate: number;
  loanAmount: number;
  loanTerm: number;
  loanRate: number;
}

export interface MonthlyMetrics {
  month: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  ebitda: number;
  opex: number;
  capex: number;
  deltaWC: number;
  taxes: number;
  netCashFlow: number;
  startingCash: number;
  endingCash: number;
  cashBurn: number;
}

export interface DashboardInsights {
  startingCash: number;
  endingCash: number;
  totalRevenue: number;
  totalEbitda: number;
  avgMonthlyNetCF: number;
  cashRunway: number;
  minCash: number;
  maxCash: number;
  arDays: number;
  apDays: number;
  ccc: number;
  netWC: number;
  ebitdaMargin: number;
  dscr: number;
  riskLevel: 'critical' | 'warning' | 'healthy' | 'excellent';
  recommendations: string[];
}

export const DEFAULT_ASSUMPTIONS: FinancialAssumptions = {
  openingCash: 250000,
  month1Revenue: 75000,
  monthlyGrowth: 0.06,
  cogsPercent: 0.32,
  monthlyOpex: 35000,
  monthlyCapex: 8000,
  taxRate: 0.21,
  arDays: 35,
  apDays: 50,
  locAmount: 150000,
  locRate: 0.08,
  loanAmount: 100000,
  loanTerm: 36,
  loanRate: 0.065,
};

export function calculateMonthlyMetrics(
  assumptions: FinancialAssumptions,
  scenario: 'base' | 'best' | 'worst' = 'base'
): MonthlyMetrics[] {
  const adj = applyScenario(assumptions, scenario);
  const metrics: MonthlyMetrics[] = [];
  let runningCash = adj.openingCash;

  for (let m = 1; m <= 12; m++) {
    const revenue =
      adj.month1Revenue * Math.pow(1 + adj.monthlyGrowth, m - 1);
    const cogs = revenue * adj.cogsPercent;
    const grossProfit = revenue - cogs;
    const ebitda = grossProfit - adj.monthlyOpex;
    const capex = adj.monthlyCapex;

    // Change in WC (working capital)
    const prevRevenue =
      m === 1
        ? 0
        : adj.month1Revenue * Math.pow(1 + adj.monthlyGrowth, m - 2);
    const deltaWC = (revenue - prevRevenue) * 0.12;

    // Taxes
    const taxes = ebitda > 0 ? ebitda * adj.taxRate : 0;

    // Net cash flow
    const netCashFlow = ebitda - capex - deltaWC - taxes;
    const endingCash = runningCash + netCashFlow;
    const cashBurn = netCashFlow < 0 ? Math.abs(netCashFlow) : 0;

    metrics.push({
      month: m,
      revenue,
      cogs,
      grossProfit,
      ebitda,
      opex: adj.monthlyOpex,
      capex,
      deltaWC,
      taxes,
      netCashFlow,
      startingCash: runningCash,
      endingCash,
      cashBurn,
    });

    runningCash = endingCash;
  }

  return metrics;
}

export function generateInsights(
  metrics: MonthlyMetrics[],
  assumptions: FinancialAssumptions
): DashboardInsights {
  const totalRevenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const totalEbitda = metrics.reduce((s, m) => s + m.ebitda, 0);
  const netCFValues = metrics.map((m) => m.netCashFlow);
  const avgMonthlyNetCF =
    netCFValues.reduce((a, b) => a + b, 0) / metrics.length;
  const endingCashes = metrics.map((m) => m.endingCash);
  const minCash = Math.min(...endingCashes);
  const maxCash = Math.max(...endingCashes);

  // DSCR
  const loanPayment = calculateLoanPayment(
    assumptions.loanAmount,
    assumptions.loanTerm,
    assumptions.loanRate
  );
  const locInterest = assumptions.locAmount * (assumptions.locRate / 12);
  const monthlyDebtService = loanPayment + locInterest;
  const dscr = totalEbitda / (monthlyDebtService * 12);

  // NWC
  const avgRevenue = totalRevenue / 12;
  const arValue = (avgRevenue * assumptions.arDays) / 30;
  const apValue = (avgRevenue * assumptions.cogsPercent * assumptions.apDays) / 30;
  const netWC = arValue - apValue;

  // Runway
  const avgBurn =
    netCFValues.filter((v) => v < 0).reduce((a, b) => a + b, 0) /
    netCFValues.filter((v) => v < 0).length;
  const cashRunway = minCash > 0 ? Math.round(minCash / Math.abs(avgBurn)) : 0;

  // Risk assessment
  let riskLevel: 'critical' | 'warning' | 'healthy' | 'excellent' = 'healthy';
  const recommendations: string[] = [];

  if (minCash < 50000) {
    riskLevel = 'critical';
    recommendations.push('🔴 Critical: Cash reserves dangerously low. Consider immediate funding.');
  } else if (minCash < 100000) {
    riskLevel = 'warning';
    recommendations.push('⚠️ Warning: Low cash reserves. Monitor closely.');
  } else if (dscr < 1.0) {
    riskLevel = 'warning';
    recommendations.push('⚠️ DSCR below 1.0: Insufficient EBITDA to cover debt service.');
  } else if (minCash > 200000 && dscr > 1.5) {
    riskLevel = 'excellent';
    recommendations.push('✅ Excellent: Strong cash position and debt coverage.');
  }

  if (assumptions.arDays > 45) {
    recommendations.push('💡 Consider AR acceleration: Current DSO is high.');
  }

  if (cashRunway < 6) {
    recommendations.push('💡 Funding strategy needed: Runway under 6 months.');
  }

  if (netWC > totalRevenue * 0.15) {
    recommendations.push('💡 WC optimization: Consider extending payment terms.');
  }

  return {
    startingCash: metrics[0].startingCash,
    endingCash: metrics[11].endingCash,
    totalRevenue,
    totalEbitda,
    avgMonthlyNetCF,
    cashRunway: Math.max(0, cashRunway),
    minCash,
    maxCash,
    arDays: assumptions.arDays,
    apDays: assumptions.apDays,
    ccc: assumptions.arDays - assumptions.apDays,
    netWC,
    ebitdaMargin: totalEbitda / totalRevenue,
    dscr,
    riskLevel,
    recommendations: recommendations.slice(0, 3),
  };
}

function calculateLoanPayment(
  principal: number,
  months: number,
  annualRate: number
): number {
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return principal / months;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

function applyScenario(
  assumptions: FinancialAssumptions,
  scenario: 'base' | 'best' | 'worst'
): FinancialAssumptions {
  if (scenario === 'base') return assumptions;

  const adj = { ...assumptions };

  if (scenario === 'best') {
    adj.month1Revenue *= 1.35;
    adj.monthlyGrowth = 0.09;
    adj.cogsPercent = 0.28;
    adj.monthlyOpex *= 0.85;
  } else if (scenario === 'worst') {
    adj.month1Revenue *= 0.65;
    adj.monthlyGrowth = 0.02;
    adj.cogsPercent = 0.40;
    adj.monthlyOpex *= 1.15;
  }

  return adj;
}
