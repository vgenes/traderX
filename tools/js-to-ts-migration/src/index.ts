#!/usr/bin/env node

import { Command } from 'commander';
import { migrate } from './migrator';
import { generateTsConfig } from './tsconfig-generator';
import { updatePackageJson } from './package-updater';
import chalk from 'chalk';

const program = new Command();

program
  .name('js-to-ts')
  .description('CLI tool to migrate JavaScript files to TypeScript')
  .version('1.0.0');

program
  .command('migrate')
  .description('Migrate JavaScript files to TypeScript')
  .argument('<path>', 'Path to file or directory to migrate')
  .option('-d, --dry-run', 'Preview changes without modifying files', false)
  .option('-r, --recursive', 'Recursively migrate all JS files in directory', false)
  .option('--skip-config', 'Skip generating tsconfig.json', false)
  .option('--skip-package', 'Skip updating package.json', false)
  .action(async (path: string, options) => {
    console.log(chalk.blue('Starting JavaScript to TypeScript migration...'));
    console.log(chalk.gray(`Target: ${path}`));
    console.log(chalk.gray(`Options: ${JSON.stringify(options)}`));
    
    try {
      const result = await migrate(path, {
        dryRun: options.dryRun,
        recursive: options.recursive,
        skipConfig: options.skipConfig,
        skipPackage: options.skipPackage,
      });
      
      if (result.success) {
        console.log(chalk.green('\nMigration completed successfully!'));
        console.log(chalk.gray(`Files migrated: ${result.migratedFiles.length}`));
        result.migratedFiles.forEach(file => {
          console.log(chalk.gray(`  - ${file}`));
        });
      } else {
        console.log(chalk.red('\nMigration failed:'));
        console.log(chalk.red(result.error));
      }
    } catch (error) {
      console.error(chalk.red('Migration error:'), error);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize TypeScript configuration for a project')
  .argument('<path>', 'Path to project directory')
  .option('-t, --type <type>', 'Project type (node, nestjs, react, angular)', 'node')
  .action(async (path: string, options) => {
    console.log(chalk.blue('Initializing TypeScript configuration...'));
    
    try {
      await generateTsConfig(path, options.type);
      await updatePackageJson(path, options.type);
      console.log(chalk.green('TypeScript configuration initialized successfully!'));
    } catch (error) {
      console.error(chalk.red('Initialization error:'), error);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze JavaScript files and report migration complexity')
  .argument('<path>', 'Path to file or directory to analyze')
  .option('-r, --recursive', 'Recursively analyze all JS files', false)
  .action(async (path: string, options) => {
    console.log(chalk.blue('Analyzing JavaScript files...'));
    
    try {
      const { analyzeFiles } = await import('./analyzer');
      const result = await analyzeFiles(path, options.recursive);
      
      console.log(chalk.green('\nAnalysis complete:'));
      console.log(chalk.gray(`Total files: ${result.totalFiles}`));
      console.log(chalk.gray(`Total lines: ${result.totalLines}`));
      console.log(chalk.gray(`Estimated complexity: ${result.complexity}`));
      console.log(chalk.gray(`CommonJS imports: ${result.commonjsImports}`));
      console.log(chalk.gray(`ES6 imports: ${result.es6Imports}`));
      console.log(chalk.gray(`Functions without types: ${result.untypedFunctions}`));
    } catch (error) {
      console.error(chalk.red('Analysis error:'), error);
      process.exit(1);
    }
  });

program.parse();
