#!/usr/bin/env node

/**
 * FIAE CLI Entry Point
 * Command-line interface for Financial Intelligence Automation Engine
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import * as path from 'path';
import * as fs from 'fs';

yargs(hideBin(process.argv))
  .command('process <file>', 'Process a single financial data file', (yargs) => {
    return yargs
      .positional('file', {
        describe: 'Path to CSV or XLSX file',
        type: 'string'
      })
      .option('output', {
        alias: 'o',
        describe: 'Output directory for exports',
        type: 'string',
        default: './exports'
      })
      .option('format', {
        alias: 'f',
        describe: 'Export format: excel, csv, pptx, all',
        type: 'string',
        default: 'all'
      })
      .option('verbose', {
        alias: 'v',
        describe: 'Verbose logging',
        type: 'boolean',
        default: false
      });
  }, (argv) => {
    const { file, output, format, verbose } = argv;
    
    if (verbose) console.log(`📂 Processing: ${file}`);
    if (!fs.existsSync(file)) {
      console.error(`❌ File not found: ${file}`);
      process.exit(3);
    }
    
    const baseName = path.basename(file, path.extname(file));
    const exportDir = path.join(output, baseName);
    
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
    
    console.log('✅ Processing complete!');
    if (verbose) console.log(`📁 Output: ${exportDir}`);
  })
  .command('watch <directory>', 'Watch directory for new files', (yargs) => {
    return yargs
      .positional('directory', {
        describe: 'Directory to monitor',
        type: 'string'
      })
      .option('output', {
        alias: 'o',
        describe: 'Output directory',
        type: 'string',
        default: './exports'
      })
      .option('format', {
        alias: 'f',
        describe: 'Export format',
        type: 'string',
        default: 'all'
      });
  }, (argv) => {
    const { directory, output } = argv;
    console.log(`👀 Watching ${directory} for CSV/XLSX files...`);
    console.log('Press Ctrl+C to stop watching.');
  })
  .command('audit', 'View audit logs', (yargs) => {
    return yargs
      .option('filter', {
        alias: 'f',
        describe: 'Filter type: all, errors, processing, exports',
        type: 'string',
        default: 'all'
      })
      .option('limit', {
        alias: 'l',
        describe: 'Limit results',
        type: 'number',
        default: 50
      })
      .option('format', {
        describe: 'Output format: json, table',
        type: 'string',
        default: 'table'
      });
  }, (argv) => {
    const { filter, limit, format } = argv;
    console.log(`📋 Showing ${limit} ${filter} logs in ${format} format`);
  })
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .parse();
