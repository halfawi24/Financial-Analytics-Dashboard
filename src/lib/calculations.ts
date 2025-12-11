export interface Assumptions {
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
  factoringFee: number;
  loanAmount: number;
  loanTerm: number;
  loanRate: number;
}

export interface MonthlyData {
  month: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  opex: number;
  ebitda: number;
  capex: number;
  deltaWC: number;
  taxes: number;
  netCashFlow: number;
  startingCash: number;
  endingCash: number;
}

export interface DashboardMetrics {
  startingCash: number;
  endingCash: number;
  totalRevenue: number;
  totalEbitda: number;
  avgMonthlyNetCF: number;
  minCash: number;
  maxCash: number;
  arDays: number;
  apDays: number;
  ccc: number;
  netWC: number;
  dscr: number;
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  openingCash: 150000,
  month1Revenue: 50000,
  monthlyGrowth: 0.05,
  cogsPercent: 0.35,
  monthlyOpex: 25000,
  monthlyCapex: 5000,
  taxRate: 0.21,
  arDays: 30,
  apDays: 45,
  locAmount: 100000,
  locRate: 0.08,
  factoringFee: 0.03,
  loanAmount: 75000,
  loanTerm: 36,
  loanRate: 0.065,
};

export function calculateMonthlyData(
  assumptions: Assumptions,
  scenario: 'base' | 'best' | 'worst' = 'base'
): MonthlyData[] {
  const adjustedAssumptions = applyScenario(assumptions, scenario);
  const data: MonthlyData[] = [];
  let currentCash = adjustedAssumptions.openingCash;

  for (let month = 1; month <= 12; month++) {
    const revenue =
      adjustedAssumptions.month1Revenue *
      Math.pow(1 + adjustedAssumptions.monthlyGrowth, month - 1);

    const cogs = revenue * adjustedAssumptions.cogsPercent;
    const grossProfit = revenue - cogs;
    const opex = adjustedAssumptions.monthlyOpex;
    const ebitda = grossProfit - opex;
    const capex = adjustedAssumptions.monthlyCapex;

    // Delta WC: assume working capital needs grow with revenue
    const previousRevenue =
      month === 1
        ? 0
        : adjustedAssumptions.month1Revenue *
          Math.pow(1 + adjustedAssumptions.monthlyGrowth, month - 2);
    const deltaWC = (revenue - previousRevenue) * 0.15;

    const taxes = ebitda > 0 ? ebitda * adjustedAssumptions.taxRate : 0;
    const netCashFlow = ebitda - capex - deltaWC - taxes;
    const endingCash = currentCash + netCashFlow;

    data.push({
      month,
      revenue,
      cogs,
      grossProfit,
      opex,
      ebitda,
      capex,
      deltaWC,
      taxes,
      netCashFlow,
      startingCash: currentCash,
      endingCash,
    });

    currentCash = endingCash;
  }

  return data;
}

export function calculateMetrics(
  monthlyData: MonthlyData[],
  assumptions: Assumptions
): DashboardMetrics {
  const netCFValues = monthlyData.map((m) => m.netCashFlow);
  const endingCashes = monthlyData.map((m) => m.endingCash);
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalEbitda = monthlyData.reduce((sum, m) => sum + m.ebitda, 0);

  // DSCR calculation
  const monthlyLoanPayment = calculateLoanPayment(
    assumptions.loanAmount,
    assumptions.loanTerm,
    assumptions.loanRate
  );
  const monthlyLocInterest =
    assumptions.locAmount * (assumptions.locRate / 12);
  const monthlyDebtService = monthlyLoanPayment + monthlyLocInterest;
  const annualDebtService = monthlyDebtService * 12;

  const dscr =
    annualDebtService > 0 ? totalEbitda / annualDebtService : 0;

  // Net WC
  const avgRevenue = totalRevenue / 12;
  const arValue = (avgRevenue / 30) * assumptions.arDays;
  const cogs = totalRevenue * assumptions.cogsPercent;
  const apValue = (cogs / 30) * assumptions.apDays;
  const netWC = arValue - apValue;

  return {
    startingCash: monthlyData[0].startingCash,
    endingCash: monthlyData[11]?.endingCash || 0,
    totalRevenue,
    totalEbitda,
    avgMonthlyNetCF: netCFValues.reduce((a, b) => a + b, 0) / 12,
    minCash: Math.min(...endingCashes),
    maxCash: Math.max(...endingCashes),
    arDays: assumptions.arDays,
    apDays: assumptions.apDays,
    ccc: assumptions.arDays - assumptions.apDays,
    netWC,
    dscr,
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
  assumptions: Assumptions,
  scenario: 'base' | 'best' | 'worst'
): Assumptions {
  if (scenario === 'base') return assumptions;

  const adjusted = { ...assumptions };

  if (scenario === 'best') {
    adjusted.month1Revenue *= 1.3;
    adjusted.monthlyGrowth = 0.08;
    adjusted.cogsPercent = 0.3;
    adjusted.monthlyOpex *= 0.88;
  } else if (scenario === 'worst') {
    adjusted.month1Revenue *= 0.7;
    adjusted.monthlyGrowth = 0.02;
    adjusted.cogsPercent = 0.42;
    adjusted.monthlyOpex *= 1.2;
  }

  return adjusted;
}
