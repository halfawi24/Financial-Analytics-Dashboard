# FIAE Architecture Documentation

## System Overview

FIAE (Financial Intelligence Automation Engine) is built as a modular, self-hosted financial intelligence system that operates without external dependencies or API calls. The architecture follows a layered pipeline approach where data flows through discrete, testable stages.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interfaces                           │
│  ┌──────────────────┬──────────────────┬───────────────────┐   │
│  │  Web Dashboard   │   REST API       │   CLI Tool        │   │
│  │  (React UI)      │   (Next.js API)  │   (yargs/chokidar)│   │
│  └────────┬─────────┴────────┬─────────┴────────┬──────────┘   │
└───────────┼──────────────────┼─────────────────┼────────────────┘
            │                  │                 │
┌───────────▼──────────────────▼─────────────────▼────────────────┐
│                   FIAE Processing Pipeline                       │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────────┐        │
│  │ File Parser  │→ │   Process   │→ │  Data          │        │
│  │              │  │  Inference  │  │  Normalizer    │        │
│  └──────────────┘  └─────────────┘  └────────┬────────┘        │
│                                               │                │
│  ┌──────────────────────────────────────────▼──────────────┐  │
│  │         Calculation Engine                              │  │
│  │  • Cash Flow Metrics    • Burn Rate/Runway             │  │
│  │  • Working Capital      • Variance Analysis             │  │
│  │  • Scenario Simulation  • Custom Metrics                │  │
│  └──────────────────────────────────────────┬──────────────┘  │
└─────────────────────────────────────────────┼─────────────────┘
                                              │
┌─────────────────────────────────────────────▼─────────────────┐
│                    Export Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Excel Export │  │  CSV Export  │  │ PPTX Export  │       │
│  │ (ExcelJS)    │  │  (csv-parse) │  │ (PptxGenJS)  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│              Audit & Logging Layer                            │
│  • Winston Logger    • JSON Audit Trails    • Error Tracking │
└──────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Type System (`src/types/fiae/index.ts`)

**Purpose:** Centralized TypeScript type definitions for all FIAE entities

**Key Types:**
- `ProcessDefinition`: Metadata about detected financial process
- `ProcessType`: Enum of supported process types (revenue_ar, ap_expense, budget_actual, fund_ops, mixed_ops)
- `NormalizedFinancialModel`: Unified internal data representation
- `Transaction`: Individual financial transaction
- `TimeBucket`: Period-based aggregation (daily/weekly/monthly/quarterly/annual)
- `CalculatedMetrics`: Computed financial metrics
- `AuditLogEntry`: Event logging entry

### 2. File Parser (`src/lib/fiae/pipeline/file-parser.ts`)

**Purpose:** Extract data from Excel and CSV files with semantic inference

**Responsibilities:**
- Parse XLSX and CSV files using `xlsx` and `csv-parse` libraries
- Classify sheets (transactions, master_data, budget, forecast, assumptions)
- Infer column semantics (date, amount, entity, category, direction, status, etc.)
- Generate confidence scores for each inference
- Handle edge cases (merged cells, multiple headers, sparse data)

**Outputs:**
- `ParsedFile`: Contains parsed sheets with detected schema

**Key Classes:**
- `FileParser`: Main parser service

### 3. Process Inference Engine (`src/lib/fiae/pipeline/process-inference.ts`)

**Purpose:** Automatically detect financial process type from data patterns

**Responsibilities:**
- Match sheet names against process type patterns
- Analyze column semantics to identify process
- Extract inflow/outflow sources
- Determine entity dimensions
- Generate confidence reasoning
- Support 5 process types without manual configuration

**Process Detection Logic:**
- Sheet name keywords: "revenue", "accounts_receivable", "ar" → revenue_ar
- Sheet name keywords: "expense", "accounts_payable", "ap" → ap_expense
- Sheet name keywords: "budget", "actual", "forecast" → budget_actual
- Sheet name keywords: "funding", "operations", "burn" → fund_ops
- Multiple process indicators → mixed_ops

**Outputs:**
- `ProcessDefinition`: Detected process type, confidence, sources, dimensions

**Key Classes:**
- `ProcessInferenceEngine`: Main inference service

### 4. Data Normalizer (`src/lib/fiae/normalization/normalizer.ts`)

**Purpose:** Convert parsed data into unified internal financial model

**Responsibilities:**
- Extract transactions from parsed sheets
- Build entity hierarchy from transaction data
- Create time buckets at various granularities
- Infer cash direction (inflow vs outflow) from process type
- Calculate initial metrics (sum by period, entity)
- Preserve audit trail through pipeline

**Time Granularities Supported:**
- Daily (1 day)
- Weekly (7 days)
- Monthly (calendar month)
- Quarterly (calendar quarter)
- Annual (calendar year)

**Outputs:**
- `NormalizedFinancialModel`: Unified data structure

**Key Classes:**
- `DataNormalizer`: Main normalization service

### 5. Calculation Engine (`src/lib/fiae/calculations/engine.ts`)

**Purpose:** Deterministic financial metric calculation

**Responsibilities:**
- Calculate cash flow metrics (total inflows/outflows, net cash, cumulative)
- Compute working capital metrics (DSO, DPO)
- Calculate burn rate and runway
- Perform variance analysis (budget vs actual)
- Generate scenario simulations
- Create forecasts with growth rates
- All calculations are pure functions (reproducible, testable)

**Key Metrics:**
- **totalInflows**: Sum of all inflow transactions
- **totalOutflows**: Sum of all outflow transactions
- **netCashFlow**: Inflows - Outflows
- **averageDailyBurn**: Average daily outflow rate
- **runway**: Months of operations at current burn rate
- **daysOfSalesOutstanding**: Average collection period
- **daysPayableOutstanding**: Average payment period
- **budgetVariancePercent**: (Actual - Budget) / Budget

**Outputs:**
- `NormalizedFinancialModel` with populated `calculatedMetrics`

**Key Classes:**
- `CalculationEngine`: Main calculation service

### 6. Excel Exporter (`src/lib/fiae/exports/excel-exporter.ts`)

**Purpose:** Generate professional multi-sheet Excel workbooks

**Responsibilities:**
- Create workbook with 6 sheets:
  1. Summary: Key metrics and process metadata
  2. Transactions: Full transaction detail with formatting
  3. Time Buckets: Period-by-period analysis
  4. Calculations: All computed metrics
  5. Assumptions: Process definition and parameters
  6. Audit Trail: Complete operation log
- Apply professional formatting (number formats, column widths, colors)
- Handle edge cases (large datasets, special characters)

**Features:**
- A4/Letter page setup
- Landscape orientation
- Consistent styling across sheets
- Proper number formatting (currency, percentages, dates)

**Outputs:**
- XLSX file at specified path

**Key Classes:**
- `ExcelExporter`: Main exporter service

### 7. CSV Exporter (`src/lib/fiae/exports/csv-exporter.ts`)

**Purpose:** Export data in clean CSV format for downstream analysis

**Responsibilities:**
- Export transactions CSV
- Export time buckets CSV
- Export metrics CSV
- Proper CSV escaping and formatting
- Standard header rows

**Outputs:**
- CSV files at specified path

**Key Classes:**
- `CSVExporter`: Main exporter service

### 8. PowerPoint Exporter (`src/lib/fiae/exports/pptx-exporter.ts`)

**Purpose:** Generate executive presentation slides

**Responsibilities:**
- Create 8-slide presentation:
  1. Title slide with branding
  2. Executive summary (4 key metrics)
  3. Process overview
  4. Financial health assessment
  5. Key performance indicators table
  6. Cash flow analysis with period data
  7. Recommendations
  8. Appendix with assumptions
- Apply consistent styling and brand colors
- Include data visualizations in tables

**Features:**
- Professional slide layouts
- Consistent typography
- Color-coded metrics (red/yellow/green health indicators)
- Embedded data tables

**Outputs:**
- PPTX file at specified path

**Key Classes:**
- `PowerPointExporter`: Main exporter service

### 9. Logger Service (`src/lib/fiae/core/logger.ts`)

**Purpose:** Audit logging and error tracking

**Responsibilities:**
- Record all pipeline operations
- Track errors with context
- Generate JSON audit trails
- Winston integration for structured logging
- Timestamp all entries
- Support audit log retrieval

**Audit Entry Types:**
- file_parsed
- process_inferred
- data_normalized
- metrics_calculated
- export_generated
- error_occurred
- file_processed

**Key Classes:**
- `AuditLogger`: Main logging service

### 10. Validator Service (`src/lib/fiae/core/validator.ts`)

**Purpose:** Data validation and consistency checking

**Responsibilities:**
- Validate transaction data
- Check time bucket consistency
- Verify process definitions
- Ensure data integrity
- Range and format validation

**Key Classes:**
- `Validator`: Main validation service

### 11. CLI Tool (`src/lib/fiae/cli/cli.ts`)

**Purpose:** Command-line interface for batch processing

**Responsibilities:**
- Parse command-line arguments using yargs
- Support commands: process, watch, audit
- Watch directories for new files
- Batch process files
- Display audit logs

**Commands:**
- `fiae process <file>`: Process single file
- `fiae watch <dir>`: Watch directory and auto-process
- `fiae audit`: Display audit log

**Key Classes:**
- CLI initialization and command handling

## Data Flow Examples

### Example 1: Revenue AR Processing

```
Excel File (AR aging)
    ↓
FileParser
├─ Detects sheet: "accounts_receivable"
├─ Columns: Date, Customer, Amount, Status
├─ Confidence: 95%
    ↓
ProcessInferenceEngine
├─ Sheet name match: "accounts_receivable" → revenue_ar
├─ Inflow sources: ["customer_receivables"]
├─ Outflow sources: []
├─ Confidence: 95%
    ↓
DataNormalizer
├─ Extracts 245 transactions
├─ Creates 12 monthly time buckets
├─ Calculates period inflows: $1.5M, outflows: $0
    ↓
CalculationEngine
├─ Total inflows: $1,500,000
├─ DSO (Days Sales Outstanding): 32.5 days
├─ Metrics populated
    ↓
Exports
├─ Excel report with all sheets
├─ PowerPoint presentation
├─ CSV data files
    ↓
AuditLogger
└─ Records all operations with timestamps
```

### Example 2: Folder Watch (Continuous Processing)

```
Folder Watch Initiated
    │
    ├─ [New file added: revenue.xlsx]
    │  └─ Auto-triggers full pipeline
    │     └─ Generates exports
    │
    ├─ [New file added: expenses.csv]
    │  └─ Auto-triggers full pipeline
    │     └─ Generates exports
    │
    └─ [Existing files ignored]
```

## API Routes

### POST /api/ingest
- Receives file upload
- Creates async processing job
- Returns jobId for status polling
- Stores processed model for exports

### GET /api/status
- Returns current job status
- Shows progress for processing jobs
- Returns full results for completed jobs

### GET /api/exports
- Generates export in requested format
- Downloads file directly
- Supports: excel, csv, pptx

## Design Patterns

### 1. Service Locator Pattern
Each service takes dependencies as constructor arguments:
```typescript
const logger = new AuditLogger();
const parser = new FileParser(logger);
const inferencer = new ProcessInferenceEngine(logger);
const normalizer = new DataNormalizer(logger);
const calculator = new CalculationEngine(logger);
```

### 2. Pipeline Pattern
Data flows through discrete stages:
- Parse → Infer → Normalize → Calculate → Export

### 3. Pure Functions
Calculations use pure functions with no side effects, enabling:
- Easy testing
- Reproducible results
- Parallel execution

### 4. Immutable Data
Models passed through pipeline are never mutated, only transformed:
```typescript
const calculated = engine.calculate(normalized);
// normalized remains unchanged
```

## Error Handling

### Strategy
- All errors logged to audit trail
- User-friendly error messages in responses
- Stack traces in audit logs only
- Graceful degradation where possible

### Error Propagation
```
Service error
    ↓
Catch and log via AuditLogger
    ↓
Return user-friendly message
    ↓
API returns 500 with error details
```

## Extensibility

### Adding New Process Type
1. Add type to `ProcessType` enum
2. Add pattern matching in `ProcessInferenceEngine`
3. Add validation rules if needed
4. Export logic works for all types (generic)

### Adding New Export Format
1. Create new `{Format}Exporter` class
2. Implement `export(model, path): Promise<string>`
3. Add to export routes
4. Add to CLI tool

### Adding New Metric
1. Add to `CalculatedMetrics` interface
2. Add calculation in `CalculationEngine`
3. Metrics appear in all exports automatically
4. Dashboard shows new metric if configured

## Performance Characteristics

### Time Complexity
- File parsing: O(n) where n = row count
- Process inference: O(m) where m = sheet count
- Data normalization: O(n) for transactions
- Calculation: O(n + p) where p = time periods
- Export: O(n) for writing

### Space Complexity
- In-memory model: O(n + p) where n = transactions, p = periods
- Temporary file: ~1x input file size
- Output exports: ~2-3x input file size

### Tested Sizes
- Files: Up to 100MB
- Transactions: Up to 1M transactions
- Time periods: 1 day to 10+ years
- Entities: Up to 10K unique entities

## Security Considerations

### No External API Calls
- All processing is local
- No network requests except for user-provided files
- No telemetry or tracking

### Temporary File Handling
- Files stored in system temp directory
- Cleaned up after processing
- Temp paths include UUID for uniqueness

### Audit Trail
- All operations logged with timestamps
- User actions tracked
- Errors recorded with context

### Input Validation
- File type validation (Excel/CSV only)
- Schema validation before processing
- Amount range validation
- Date sequence validation

## Testing Strategy

### Unit Tests (Jest)
- Calculation functions
- Process inference logic
- Validation rules
- Data transformation functions

### Integration Tests
- Full pipeline processing
- File parsing with various formats
- Export generation
- API route handling

### Test Coverage Goal
- 60%+ overall coverage
- 80%+ for critical calculation functions
- 70%+ for inference logic

## Deployment Architecture

### Development
```
npm run dev
→ Next.js dev server (port 3000)
→ Hot reload on changes
```

### Production
```
npm run build
npm start
→ Optimized Next.js server
→ Startup in ~5 seconds
```

### Docker
```
docker-compose up
→ Multi-stage build (builder + runtime)
→ Health checks enabled
→ Volume mounts for input/output
→ Optional Nginx reverse proxy
```

## Monitoring & Observability

### Audit Logs
- JSON format for easy parsing
- All operations timestamped
- Error context included
- Accessible via CLI and API

### Health Checks
- Docker health check endpoint
- File processing verification
- Memory usage monitoring
- Error rate tracking

## Future Enhancements

### Planned
- Database backend for multi-instance deployments
- Advanced ML-based process detection
- Custom metric definition UI
- Scheduled report generation
- Email delivery of exports
- Integration with accounting systems

### Considered
- Web socket real-time updates
- Advanced forecasting algorithms
- Three-way reconciliation
- Multi-user collaboration
- Role-based access control
- Encrypted storage

---

**Document Version:** 1.0
**Last Updated:** December 2024
**FIAE Version:** 1.0.0
