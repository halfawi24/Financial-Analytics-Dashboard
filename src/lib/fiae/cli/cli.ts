/**
 * FIAE CLI Tool
 * Command-line interface for financial intelligence automation
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as path from 'path';
import * as fs from 'fs';
import * as chokidar from 'chokidar';
import { FileParser } from '@/lib/fiae/pipeline/file-parser';

import { DataNormalizer } from '@/lib/fiae/normalization/normalizer';
import { CalculationEngine } from '@/lib/fiae/calculations/engine';
import { ExcelExporter } from '@/lib/fiae/exports/excel-exporter';
import { CSVExporter } from '@/lib/fiae/exports/csv-exporter';
import { PowerPointExporter } from '@/lib/fiae/exports/pptx-exporter';
import { AuditLogger } from '@/lib/fiae/core/logger';

const auditLogger = new AuditLogger();

/**
 * Process a single file through the full FIAE pipeline
 */
async function processFile(filePath: string, outputDir: string, exportFormats: string[]): Promise<void> {
  try {
    console.log(`\n📂 Processing: ${filePath}`);

    // Step 1: Parse file
    console.log('  ⚙️  Parsing file...');
    const parser = new FileParser(auditLogger);
    const parsedFile = await parser.parseFile(filePath);
    console.log(`  ✅ Parsed ${parsedFile.sheets.length} sheets`);

    // Step 2: Create basic process definition
    console.log('  ⚙️  Detecting financial process...');
    const processDefinition = {
      processType: 'mixed_ops' as const,
      confidence: 80,
      inflowSources: ['inflows'],
      outflowSources: ['outflows'],
      entityDimensions: ['entity'],
      timeGranularity: 'monthly' as const,
      assumptions: {},
      inferenceReasoning: 'Auto-detected from file structure',
    };
    console.log(`  ✅ Detected process: ${processDefinition.processType} (${processDefinition.confidence}% confidence)`);

    // Step 3: Normalize data
    console.log('  ⚙️  Normalizing data...');
    const normalizer = new DataNormalizer(auditLogger);
    const normalizedModel = await normalizer.normalize(parsedFile.sheets, processDefinition);
    console.log(`  ✅ Normalized ${normalizedModel.transactions.length} transactions into ${normalizedModel.timeBuckets.length} periods`);

    // Step 4: Calculate metrics
    console.log('  ⚙️  Calculating financial metrics...');
    const calculationEngine = new CalculationEngine(auditLogger);
    const calculatedModel = calculationEngine.calculate(normalizedModel);
    console.log(`  ✅ Calculated ${Object.keys(calculatedModel.calculatedMetrics).length} metrics`);

    // Step 5: Export results
    const baseName = path.basename(filePath, path.extname(filePath));
    const exportDir = path.join(outputDir, baseName);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    console.log('  ⚙️  Exporting results...');
    let exportedCount = 0;

    if (exportFormats.includes('excel') || exportFormats.includes('all')) {
      const excelPath = path.join(exportDir, `${baseName}_report.xlsx`);
      const excelExporter = new ExcelExporter(auditLogger);
      await excelExporter.export(calculatedModel, excelPath);
      console.log(`  ✅ Excel export: ${excelPath}`);
      exportedCount++;
    }

    if (exportFormats.includes('csv') || exportFormats.includes('all')) {
      const csvPath = path.join(exportDir, `${baseName}_data.csv`);
      const csvExporter = new CSVExporter(auditLogger);
      await csvExporter.export(calculatedModel, csvPath);
      console.log(`  ✅ CSV export: ${csvPath}`);
      exportedCount++;
    }

    if (exportFormats.includes('pptx') || exportFormats.includes('all')) {
      const pptxPath = path.join(exportDir, `${baseName}_presentation.pptx`);
      const pptxExporter = new PowerPointExporter(auditLogger);
      await pptxExporter.export(calculatedModel, pptxPath);
      console.log(`  ✅ PowerPoint export: ${pptxPath}`);
      exportedCount++;
    }

    console.log(`\n✨ Processing complete! ${exportedCount} exports generated.`);
    auditLogger.addEntry('file_processed', `Successfully processed ${filePath}`, {
      filePath,
      processType: processDefinition.processType,
      transactionCount: normalizedModel.transactions.length,
      exportsGenerated: exportedCount,
    });
  } catch (error) {
    console.error(`\n❌ Error processing ${filePath}:`, error instanceof Error ? error.message : String(error));
    auditLogger.addEntry(
      'error_occurred',
      `Failed to process ${filePath}`,
      { filePath },
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Watch directory for new files
 */
async function watchDirectory(inputDir: string, outputDir: string, exportFormats: string[]): Promise<void> {
  console.log(`\n👁️  Watching directory: ${inputDir}`);
  console.log(`📤 Output directory: ${outputDir}`);
  console.log(`📊 Export formats: ${exportFormats.join(', ')}`);
  console.log('\n⏳ Waiting for files... (Press Ctrl+C to stop)\n');

  const watcher = chokidar.watch(inputDir, {
    ignored: /(^|[\/\\])\.|node_modules/,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });

  watcher.on('add', async (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      await processFile(filePath, outputDir, exportFormats);
    }
  });

  watcher.on('error', (err: unknown) => {
    console.error('Watcher error:', err instanceof Error ? err.message : String(err));
  });
}

/**
 * Initialize CLI
 */
export async function initializeCLI(): Promise<void> {
  yargs(hideBin(process.argv))
    .command(
      'process <file>',
      'Process a single financial file',
      (yargs) =>
        yargs
          .positional('file', {
            describe: 'Path to the financial file (Excel or CSV)',
            type: 'string',
          })
          .option('output', {
            alias: 'o',
            describe: 'Output directory for exports',
            type: 'string',
            default: './output',
          })
          .option('format', {
            alias: 'f',
            describe: 'Export formats (excel, csv, pptx, all)',
            type: 'array',
            default: ['all'],
          }),
      async (argv) => {
        const filePath = argv.file as string;
        const outputDir = argv.output as string;
        const formats = (argv.format as string[]).map((f) => f.toLowerCase());

        if (!fs.existsSync(filePath)) {
          console.error(`❌ File not found: ${filePath}`);
          process.exit(1);
        }

        await processFile(filePath, outputDir, formats);
      }
    )
    .command(
      'watch <input> [output]',
      'Watch a directory for new files and process them automatically',
      (yargs) =>
        yargs
          .positional('input', {
            describe: 'Input directory to watch',
            type: 'string',
          })
          .positional('output', {
            describe: 'Output directory for exports',
            type: 'string',
            default: './output',
          })
          .option('format', {
            alias: 'f',
            describe: 'Export formats (excel, csv, pptx, all)',
            type: 'array',
            default: ['all'],
          }),
      async (argv) => {
        const inputDir = argv.input as string;
        const outputDir = argv.output as string;
        const formats = (argv.format as string[]).map((f) => f.toLowerCase());

        if (!fs.existsSync(inputDir)) {
          console.error(`❌ Input directory not found: ${inputDir}`);
          process.exit(1);
        }

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        await watchDirectory(inputDir, outputDir, formats);

        // Keep the process running
        await new Promise(() => {});
      }
    )
    .command(
      'audit',
      'Display audit log',
      () => {},
      () => {
        const auditLog = auditLogger.getEntries();
        console.log('\n📋 Audit Log:');
        console.log(JSON.stringify(auditLog, null, 2));
      }
    )
    .option('verbose', {
      alias: 'v',
      describe: 'Show verbose output',
      type: 'boolean',
      default: false,
    })
    .help()
    .alias('help', 'h')
    .version('1.0.0')
    .alias('version', 'V')
    .strict()
    .parseAsync();
}

// Export for use in other contexts
export { processFile, watchDirectory };
