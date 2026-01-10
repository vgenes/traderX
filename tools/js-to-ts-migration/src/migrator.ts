import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { generateTsConfig } from './tsconfig-generator';
import { updatePackageJson } from './package-updater';
import { transformJsToTs } from './transformer';

export interface MigrateOptions {
  dryRun: boolean;
  recursive: boolean;
  skipConfig: boolean;
  skipPackage: boolean;
}

export interface MigrateResult {
  success: boolean;
  migratedFiles: string[];
  error?: string;
}

export async function migrate(
  targetPath: string,
  options: MigrateOptions
): Promise<MigrateResult> {
  const absolutePath = path.resolve(targetPath);
  const migratedFiles: string[] = [];

  if (!fs.existsSync(absolutePath)) {
    return {
      success: false,
      migratedFiles: [],
      error: `Path does not exist: ${absolutePath}`,
    };
  }

  const stats = fs.statSync(absolutePath);
  const isDirectory = stats.isDirectory();
  const projectRoot = isDirectory ? absolutePath : path.dirname(absolutePath);

  let jsFiles: string[] = [];

  if (isDirectory) {
    const pattern = options.recursive ? '**/*.js' : '*.js';
    jsFiles = await glob(pattern, {
      cwd: absolutePath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '*.config.js', '*.conf.js'],
      absolute: true,
    });
  } else {
    if (absolutePath.endsWith('.js')) {
      jsFiles = [absolutePath];
    } else {
      return {
        success: false,
        migratedFiles: [],
        error: 'Target file must be a JavaScript file (.js)',
      };
    }
  }

  if (jsFiles.length === 0) {
    return {
      success: false,
      migratedFiles: [],
      error: 'No JavaScript files found to migrate',
    };
  }

  console.log(`Found ${jsFiles.length} JavaScript file(s) to migrate`);

  for (const jsFile of jsFiles) {
    try {
      const jsContent = fs.readFileSync(jsFile, 'utf-8');
      const tsContent = transformJsToTs(jsContent, jsFile);
      const tsFile = jsFile.replace(/\.js$/, '.ts');

      if (options.dryRun) {
        console.log(`[DRY RUN] Would migrate: ${jsFile} -> ${tsFile}`);
        console.log('--- Transformed content preview ---');
        console.log(tsContent.slice(0, 500) + (tsContent.length > 500 ? '...' : ''));
        console.log('-----------------------------------');
      } else {
        fs.writeFileSync(tsFile, tsContent, 'utf-8');
        fs.unlinkSync(jsFile);
        console.log(`Migrated: ${jsFile} -> ${tsFile}`);
      }

      migratedFiles.push(tsFile);
    } catch (error) {
      console.error(`Error migrating ${jsFile}:`, error);
    }
  }

  if (!options.skipConfig && !options.dryRun) {
    const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      console.log('Generating tsconfig.json...');
      await generateTsConfig(projectRoot, 'node');
    }
  }

  if (!options.skipPackage && !options.dryRun) {
    console.log('Updating package.json with TypeScript dependencies...');
    await updatePackageJson(projectRoot, 'node');
  }

  return {
    success: true,
    migratedFiles,
  };
}
