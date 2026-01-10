import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  name?: string;
  version?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

const typescriptDependencies: Record<string, Record<string, string>> = {
  node: {
    typescript: '^5.3.3',
    '@types/node': '^20.10.0',
    'ts-node': '^10.9.2',
  },
  nestjs: {
    typescript: '^5.3.3',
    '@types/node': '^20.10.0',
    'ts-node': '^10.9.2',
    '@nestjs/cli': '^10.0.0',
  },
  react: {
    typescript: '^5.3.3',
    '@types/react': '^18.2.0',
    '@types/react-dom': '^18.2.0',
    '@types/node': '^20.10.0',
  },
  angular: {
    typescript: '^5.3.3',
    '@types/node': '^20.10.0',
  },
};

const commonTypePackages: Record<string, string> = {
  express: '@types/express',
  'socket.io': '@types/socket.io',
  winston: '@types/winston',
  cors: '@types/cors',
  lodash: '@types/lodash',
  jest: '@types/jest',
  mocha: '@types/mocha',
  chai: '@types/chai',
};

export async function updatePackageJson(
  projectPath: string,
  projectType: string
): Promise<void> {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.log('No package.json found, creating one...');
    const newPackageJson: PackageJson = {
      name: path.basename(projectPath),
      version: '1.0.0',
      main: 'dist/index.js',
      scripts: {
        build: 'tsc',
        start: 'node dist/index.js',
        dev: 'ts-node src/index.ts',
      },
      dependencies: {},
      devDependencies: typescriptDependencies[projectType] || typescriptDependencies.node,
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(newPackageJson, null, 2), 'utf-8');
    return;
  }

  const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  if (!packageJson.devDependencies) {
    packageJson.devDependencies = {};
  }

  const tsDevDeps = typescriptDependencies[projectType] || typescriptDependencies.node;
  for (const [dep, version] of Object.entries(tsDevDeps)) {
    if (!packageJson.devDependencies[dep]) {
      packageJson.devDependencies[dep] = version;
      console.log(`Added devDependency: ${dep}@${version}`);
    }
  }

  if (packageJson.dependencies) {
    for (const dep of Object.keys(packageJson.dependencies)) {
      const typesPackage = commonTypePackages[dep];
      if (typesPackage && !packageJson.devDependencies[typesPackage]) {
        packageJson.devDependencies[typesPackage] = '*';
        console.log(`Added type definitions: ${typesPackage}`);
      }
    }
  }

  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  if (!packageJson.scripts.build) {
    packageJson.scripts.build = 'tsc';
  }

  if (packageJson.main && packageJson.main.endsWith('.js')) {
    const newMain = packageJson.main.replace(/\.js$/, '.ts');
    if (packageJson.main.startsWith('dist/') || packageJson.main.startsWith('./dist/')) {
    } else {
      packageJson.main = `dist/${path.basename(packageJson.main)}`;
    }
  }

  if (packageJson.scripts.start && packageJson.scripts.start.includes('node ')) {
    const startScript = packageJson.scripts.start;
    if (!startScript.includes('dist/')) {
      packageJson.scripts.start = startScript.replace(/node\s+(\S+\.js)/, 'node dist/$1');
    }
  }

  if (!packageJson.scripts.dev) {
    packageJson.scripts.dev = 'ts-node src/index.ts';
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
  console.log(`Updated package.json at ${packageJsonPath}`);
}

export function getRequiredTypePackages(dependencies: Record<string, string>): string[] {
  const typePackages: string[] = [];
  for (const dep of Object.keys(dependencies)) {
    const typesPackage = commonTypePackages[dep];
    if (typesPackage) {
      typePackages.push(typesPackage);
    }
  }
  return typePackages;
}
