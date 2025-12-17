# Financial Intelligence Automation Engine (FIAE)

**A fully automated, self-hosted financial intelligence system that automatically detects financial processes from data files and generates intelligent insights without vendor lock-in.**

![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-green)
![License: MIT](https://img.shields.io/badge/License-MIT-blue)
![Node Version](https://img.shields.io/badge/Node-20%2B-blue)

---

## 🎯 Overview

FIAE is a comprehensive financial intelligence system designed for finance teams that need to:

- **Automatically detect** financial processes from Excel/CSV files (no manual schema definition)
- **Normalize** disparate financial data into a unified internal model
- **Calculate** deterministic financial metrics (cash flow, burn rate, runway, DSO, DPO, etc.)
- **Generate** professional exports (Excel workbooks, CSV, PowerPoint presentations)
- **Scale** from single-file processing to automated folder-watch operations
- **Audit** every operation with comprehensive JSON audit trails

### Key Features

✅ **Process-Aware Intelligence**
- Automatic detection of 5+ financial process types (revenue AR, AP expenses, budget/actual, funding ops, mixed operations)
- Confidence scoring for all inferences
- No hardcoded schemas or configurations required

✅ **Deterministic Calculations**
- Pure functions with reproducible results
- 12+ financial metrics calculated automatically
- Scenario simulation (revenue multiplier, cost multiplier, payment delays)
- Comprehensive variance analysis

✅ **Production-Grade Architecture**
- Modular, injectable dependencies
- Full TypeScript strict mode
- Comprehensive audit logging with Winston
- Zero vendor lock-in - runs completely self-hosted
- Professional-grade error handling

✅ **Multiple Interfaces**
- **Web Dashboard**: Interactive UI with real-time calculations
- **REST API**: Programmatic access via HTTP endpoints
- **CLI Tool**: Command-line processing with folder-watch capability
- **Docker**: Container-ready with docker-compose

✅ **Enterprise Exports**
- **Excel Workbooks**: Multi-sheet professional reports with formatting
- **PowerPoint Presentations**: 8-slide executive briefings
- **CSV Data**: Clean standardized exports for downstream analysis
- **JSON Audit Trails**: Complete operation history

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- For Docker: Docker and Docker Compose

### Installation

```bash
# Clone repository (or unzip provided archive)
cd fiae

# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev
```

Visit http://localhost:3000 in your browser.

### First Use - Web Dashboard

1. **Upload a Financial File**
   - Click "Upload File" on the dashboard
   - Select Excel (.xlsx, .xls) or CSV file
   - FIAE automatically detects the financial process

2. **View Results**
   - Process type and confidence score
   - Automatic metrics calculation
   - Interactive charts and KPI visualization
   - Data grid with transaction details

3. **Export Results**
   - Download Excel report with all sheets
   - Generate PowerPoint presentation
   - Export raw CSV data

---

## 📋 CLI Usage

### Process Single File

```bash
npm run fiae process <file.xlsx>
```

**Options:**
- `-o, --output <dir>`: Output directory (default: ./output)
- `-f, --format <format>`: Export formats - excel, csv, pptx, all (default: all)

**Example:**
```bash
npm run fiae process revenue_data.xlsx -o ./reports -f excel,pptx
```

### Watch Directory (Auto-Processing)

```bash
npm run fiae watch <input-dir> [output-dir]
```

Automatically processes any new Excel/CSV files added to the input directory.

**Example:**
```bash
npm run fiae watch ./financial-files ./processed-reports -f all
```

### View Audit Log

```bash
npm run fiae audit
```

Displays complete audit trail of all FIAE operations in JSON format.

---

## 🔌 REST API

### POST /api/ingest

Upload and process a financial file.

**Request:**
```bash
curl -X POST http://localhost:3000/api/ingest \
  -F "file=@revenue_data.xlsx"
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "message": "File received. Processing started."
}
```

### GET /api/status

Get processing status and results.

**Request:**
```bash
curl http://localhost:3000/api/status?jobId=550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": {
    "processType": "revenue_ar",
    "confidence": 95,
    "transactionCount": 245,
    "timeBuckets": 12,
    "metrics": {
      "totalInflows": 1500000,
      "totalOutflows": 1200000,
      "netCashFlow": 300000,
      "daysOfSalesOutstanding": 32.5,
      "runway": 8.5
    }
  }
}
```

### GET /api/exports

Download processed file in specified format.

**Request:**
```bash
curl http://localhost:3000/api/exports?jobId=550e8400&format=excel \
  -o report.xlsx
```

**Parameters:**
- `jobId`: Job ID from ingest response
- `format`: excel | csv | pptx

---

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t fiae:latest .
```

### Run Container

```bash
docker run -p 3000:3000 fiae:latest
```

### Docker Compose (Recommended)

```bash
docker-compose up -d
```

This starts FIAE with:
- Main application on port 3000
- Volume mounts for input/output directories
- Automatic health checks
- Optional Nginx reverse proxy on port 80

---

## 🏗️ Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Web UI / API / CLI                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌─────────▼─────────┐  ┌──────▼────────┐
│   File Parser  │  │  Process Inference│  │ Data Normalizer
│                │  │                   │  │
│ • XLSX parsing │  │ • Auto-detection  │  │ • Unified model
│ • CSV parsing  │  │ • Confidence      │  │ • Time buckets
│ • Schema      │  │   scoring         │  │ • Entity hier.
│   inference    │  │ • Source extract  │  │ • Metric calc.
└────────────────┘  └───────────────────┘  └─────────────────┘
                              │
                ┌─────────────▼─────────────┐
                │  Calculation Engine       │
                │                           │
                │ • Cash flow metrics       │
                │ • Burn rate / runway      │
                │ • Variance analysis       │
                │ • Scenario simulation     │
                │ • Custom calculations     │
                └─────────────┬─────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────────┐  ┌──────▼──────────┐  ┌──────▼────────┐
│ Excel Exporter   │  │  CSV Exporter   │  │PPTX Exporter
│                  │  │                 │  │
│ • Multi-sheet    │  │ • Clean format  │  │ • 8-slide deck
│ • Formatting     │  │ • Proper CSV    │  │ • Professional
│ • Audit trail    │  │   escaping      │  │   styling
└──────────────────┘  │ • Headers       │  │ • KPI boxes
                      └─────────────────┘  └────────────────┘
                              │
                ┌─────────────▼──────────┐
                │   Audit Logger        │
                │                       │
                │ • Winston logging     │
                │ • JSON audit trails   │
                │ • Error tracking      │
                └───────────────────────┘
```

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 16.0.7 |
| Frontend | React | 19.x |
| Language | TypeScript | 5.x (strict) |
| Styling | Tailwind CSS | 4.x |
| File Parsing | xlsx, csv-parse | Latest |
| Logging | Winston | 3.x |
| CLI | yargs | 17.x |
| File Watch | chokidar | 3.x |
| Export (PPT) | PptxGenJS | 4.x |
| Testing | Jest | Latest |
| UI Components | Shadcn/UI, Radix UI | Latest |

---

## 📊 Supported Financial Processes

FIAE automatically detects and processes these financial scenarios:

### 1. Revenue Accounts Receivable (revenue_ar)
- Inflow source: Customer revenue
- Metrics: Total revenue, Days Sales Outstanding (DSO)
- Common files: AR aging, invoice listings, revenue by customer

### 2. Accounts Payable Expenses (ap_expense)
- Outflow source: Vendor payments
- Metrics: Total expenses, Days Payable Outstanding (DPO)
- Common files: AP aging, expense reports, vendor invoices

### 3. Budget vs Actual (budget_actual)
- Comparison of budgeted vs actual amounts
- Metrics: Variance, variance percentage
- Common files: Budget vs actual reports, forecasts vs actuals

### 4. Funding & Operations (fund_ops)
- Inflow: Funding received
- Outflow: Operating expenses
- Metrics: Runway, burn rate, cash balance
- Common files: Funding rounds, monthly P&L, cash flow projections

### 5. Mixed Operations (mixed_ops)
- Multiple process types in one file
- Metrics: Comprehensive financial analysis
- Common files: Consolidated financial statements

---

## 📈 Financial Metrics Calculated

### Cash Flow Metrics
- **Total Inflows**: Sum of all inflow transactions
- **Total Outflows**: Sum of all outflow transactions
- **Net Cash Flow**: Inflows minus outflows
- **Ending Cash Balance**: Current cash position

### Working Capital
- **Days Sales Outstanding (DSO)**: Average days to collect receivables
- **Days Payable Outstanding (DPO)**: Average days to pay obligations
- **Working Capital Cycle**: DSO - DPO

### Burn Rate & Runway
- **Average Daily Burn**: Daily cash outflow rate
- **Runway (Months)**: How many months of operations with current cash

### Budget Analysis
- **Budget Variance**: Actual minus budgeted amount
- **Budget Variance %**: Variance as percentage of budget

### Scenario Simulation
- Apply multipliers to revenue/expenses
- Model payment timing changes
- Generate forecast scenarios

---

## 🧪 Testing

### Run Test Suite

```bash
npm run test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Lint Check

```bash
npm run lint
```

---

## 📦 Production Deployment

### Environment Variables

Create `.env.production` with:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Build for Production

```bash
npm run build
npm start
```

### Docker Production

```bash
docker build -t fiae:latest .
docker-compose -f docker-compose.yml up -d
```

### Scaling Considerations

- File uploads stored in /tmp (configure persistent storage for production)
- In-memory job status (use database for multi-instance deployments)
- Winston logging to stdout (integrate with log aggregation service)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Support

For issues, feature requests, or questions:

1. Check the documentation
2. Review sample files in `/samples`
3. Enable verbose logging for debugging
4. Review audit logs with `npm run fiae audit`

---

## 🎓 Sample Files

The `/samples` directory contains example financial files for testing:

- `sample_revenue.xlsx` - Accounts receivable example
- `sample_expenses.csv` - Accounts payable example
- `sample_budget_actual.xlsx` - Budget vs actual comparison
- `sample_funding.xlsx` - Funding and operations

**Quick test:**
```bash
npm run fiae process samples/sample_revenue.xlsx -o ./test-output -f all
```

---

## 🔐 Security Notes

- FIAE runs completely self-hosted with no external API calls
- File uploads stored in system temp directory (cleaned after processing)
- All data processing happens locally
- Audit logs contain all operation details
- No user data leaves your infrastructure

---

**Version:** 1.0.0
**Last Updated:** December 2024
