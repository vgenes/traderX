import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

export interface AnalysisResult {
  totalFiles: number;
  totalLines: number;
  complexity: 'low' | 'medium' | 'high';
  commonjsImports: number;
  es6Imports: number;
  untypedFunctions: number;
  files: FileAnalysis[];
}

export interface FileAnalysis {
  path: string;
  lines: number;
  commonjsImports: number;
  es6Imports: number;
  functions: number;
  classes: number;
  complexity: 'low' | 'medium' | 'high';
}

export async function analyzeFiles(
  targetPath: string,
  recursive: boolean
): Promise<AnalysisResult> {
  const absolutePath = path.resolve(targetPath);
  const stats = fs.statSync(absolutePath);
  const isDirectory = stats.isDirectory();

  let jsFiles: string[] = [];

  if (isDirectory) {
    const pattern = recursive ? '**/*.js' : '*.js';
    jsFiles = await glob(pattern, {
      cwd: absolutePath,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '*.config.js', '*.conf.js'],
      absolute: true,
    });
  } else {
    if (absolutePath.endsWith('.js')) {
      jsFiles = [absolutePath];
    }
  }

  const fileAnalyses: FileAnalysis[] = [];
  let totalCommonjsImports = 0;
  let totalEs6Imports = 0;
  let totalUntypedFunctions = 0;
  let totalLines = 0;

  for (const jsFile of jsFiles) {
    const content = fs.readFileSync(jsFile, 'utf-8');
    const analysis = analyzeFile(content, jsFile);
    fileAnalyses.push(analysis);

    totalCommonjsImports += analysis.commonjsImports;
    totalEs6Imports += analysis.es6Imports;
    totalUntypedFunctions += analysis.functions;
    totalLines += analysis.lines;
  }

  const overallComplexity = calculateOverallComplexity(fileAnalyses);

  return {
    totalFiles: jsFiles.length,
    totalLines,
    complexity: overallComplexity,
    commonjsImports: totalCommonjsImports,
    es6Imports: totalEs6Imports,
    untypedFunctions: totalUntypedFunctions,
    files: fileAnalyses,
  };
}

function analyzeFile(content: string, filePath: string): FileAnalysis {
  const lines = content.split('\n').length;

  const commonjsPattern = /require\s*\(/g;
  const commonjsMatches = content.match(commonjsPattern) || [];

  const es6Pattern = /import\s+.*\s+from\s+['"][^'"]+['"]/g;
  const es6Matches = content.match(es6Pattern) || [];

  const functionPattern = /function\s+\w+\s*\([^)]*\)/g;
  const arrowFunctionPattern = /(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
  const functionMatches = content.match(functionPattern) || [];
  const arrowMatches = content.match(arrowFunctionPattern) || [];

  const classPattern = /class\s+\w+/g;
  const classMatches = content.match(classPattern) || [];

  const totalFunctions = functionMatches.length + arrowMatches.length;
  const complexity = calculateFileComplexity(lines, totalFunctions, classMatches.length);

  return {
    path: filePath,
    lines,
    commonjsImports: commonjsMatches.length,
    es6Imports: es6Matches.length,
    functions: totalFunctions,
    classes: classMatches.length,
    complexity,
  };
}

function calculateFileComplexity(
  lines: number,
  functions: number,
  classes: number
): 'low' | 'medium' | 'high' {
  const score = lines * 0.01 + functions * 2 + classes * 5;

  if (score < 10) return 'low';
  if (score < 30) return 'medium';
  return 'high';
}

function calculateOverallComplexity(
  files: FileAnalysis[]
): 'low' | 'medium' | 'high' {
  if (files.length === 0) return 'low';

  const highCount = files.filter(f => f.complexity === 'high').length;
  const mediumCount = files.filter(f => f.complexity === 'medium').length;

  if (highCount > files.length * 0.3) return 'high';
  if (mediumCount + highCount > files.length * 0.5) return 'medium';
  return 'low';
}
