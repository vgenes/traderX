import * as fs from 'fs';
import * as path from 'path';

interface TsConfigOptions {
  target: string;
  module: string;
  lib: string[];
  outDir: string;
  rootDir: string;
  strict: boolean;
  esModuleInterop: boolean;
  skipLibCheck: boolean;
  forceConsistentCasingInFileNames: boolean;
  resolveJsonModule: boolean;
  declaration: boolean;
  sourceMap: boolean;
  experimentalDecorators?: boolean;
  emitDecoratorMetadata?: boolean;
}

const projectTypeConfigs: Record<string, TsConfigOptions> = {
  node: {
    target: 'ES2020',
    module: 'commonjs',
    lib: ['ES2020'],
    outDir: './dist',
    rootDir: './src',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    declaration: true,
    sourceMap: true,
  },
  nestjs: {
    target: 'ES2022',
    module: 'commonjs',
    lib: ['ES2022'],
    outDir: './dist',
    rootDir: './',
    strict: false,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: false,
    resolveJsonModule: true,
    declaration: true,
    sourceMap: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  },
  react: {
    target: 'ES2020',
    module: 'ESNext',
    lib: ['DOM', 'DOM.Iterable', 'ESNext'],
    outDir: './dist',
    rootDir: './src',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    declaration: false,
    sourceMap: true,
  },
  angular: {
    target: 'ES2022',
    module: 'ES2022',
    lib: ['ES2022', 'DOM'],
    outDir: './dist',
    rootDir: './src',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    declaration: false,
    sourceMap: true,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
  },
};

export async function generateTsConfig(
  projectPath: string,
  projectType: string
): Promise<void> {
  const config = projectTypeConfigs[projectType] || projectTypeConfigs.node;
  const tsconfigPath = path.join(projectPath, 'tsconfig.json');

  const tsconfig = {
    compilerOptions: {
      ...config,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', 'build'],
  };

  if (projectType === 'nestjs') {
    tsconfig.include = ['src/**/*'];
  }

  fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf-8');
  console.log(`Generated tsconfig.json at ${tsconfigPath}`);
}

export function getTsConfigTemplate(projectType: string): string {
  const config = projectTypeConfigs[projectType] || projectTypeConfigs.node;
  return JSON.stringify(
    {
      compilerOptions: config,
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'build'],
    },
    null,
    2
  );
}
