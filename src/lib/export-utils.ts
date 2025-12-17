import type { FinancialAssumptions, MonthlyMetrics } from './financial-engine';

export async function exportToCSV(
  monthlyData: MonthlyMetrics[],
  scenario: 'base' | 'best' | 'worst'
) {
  try {
    const response = await fetch('/api/export/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyData, scenario }),
    });

    if (!response.ok) throw new Error('CSV export failed');

    const csv = await response.text();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financial-report-${scenario}-case.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('CSV export error:', error);
    throw error;
  }
}

export async function exportToXLSX(
  monthlyData: MonthlyMetrics[],
  scenario: 'base' | 'best' | 'worst',
  assumptions?: FinancialAssumptions
) {
  try {
    const response = await fetch('/api/export/xlsx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyData, scenario, assumptions }),
    });

    if (!response.ok) throw new Error('XLSX export failed');

    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financial-report-${scenario}-case.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('XLSX export error:', error);
    throw error;
  }
}

export async function exportToPDF(
  monthlyData: MonthlyMetrics[],
  scenario: 'base' | 'best' | 'worst',
  assumptions?: FinancialAssumptions
) {
  try {
    const response = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyData, scenario, assumptions }),
    });

    if (!response.ok) throw new Error('PDF export failed');

    const html = await response.text();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      });
    }

    // Also offer direct download as HTML
    setTimeout(() => {
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `financial-report-${scenario}-case.html`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1000);

    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
}

export async function exportToPPTX(
  monthlyData: MonthlyMetrics[],
  scenario: 'base' | 'best' | 'worst',
  assumptions?: FinancialAssumptions
) {
  try {
    const response = await fetch('/api/export/pptx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthlyData, scenario, assumptions }),
    });

    if (!response.ok) throw new Error('PPTX export failed');

    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financial-report-${scenario}-case.pptx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('PPTX export error:', error);
    throw error;
  }
}
