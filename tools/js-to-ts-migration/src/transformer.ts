import * as path from 'path';

interface ImportInfo {
  type: 'commonjs' | 'es6';
  module: string;
  variable: string;
}

export function transformJsToTs(content: string, filePath: string): string {
  let transformed = content;

  transformed = transformRequireToImport(transformed);
  transformed = addTypeAnnotationsToFunctions(transformed);
  transformed = transformModuleExports(transformed);
  transformed = addTypeAnnotationsToVariables(transformed);

  return transformed;
}

function transformRequireToImport(content: string): string {
  let transformed = content;

  const chainedRequirePattern = /const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\(\s*\)\s*;/g;
  transformed = transformed.replace(chainedRequirePattern, (match, varName, modulePath) => {
    return `import ${varName}Factory from '${modulePath}';\nconst ${varName} = ${varName}Factory();`;
  });

  const methodCallRequirePattern = /const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\.(\w+)\s*\(\s*([^)]*)\s*\)\s*;/g;
  transformed = transformed.replace(methodCallRequirePattern, (match, varName, modulePath, method, args) => {
    const importName = `${modulePath.replace(/[^a-zA-Z0-9]/g, '_')}Module`;
    return `import ${importName} from '${modulePath}';\nconst ${varName} = ${importName}.${method}(${args});`;
  });

  const requirePattern = /const\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)(?:\.(\w+))?;?/g;
  transformed = transformed.replace(requirePattern, (match, varName, modulePath, property) => {
    if (property) {
      return `import { ${property} as ${varName} } from '${modulePath}';`;
    }
    
    return `import ${varName} from '${modulePath}';`;
  });

  const destructuredRequirePattern = /const\s*\{\s*([^}]+)\s*\}\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\);?/g;
  transformed = transformed.replace(destructuredRequirePattern, (match, imports, modulePath) => {
    const cleanImports = imports.split(',').map((i: string) => i.trim()).join(', ');
    return `import { ${cleanImports} } from '${modulePath}';`;
  });

  return transformed;
}

function addTypeAnnotationsToFunctions(content: string): string {
  let transformed = content;

  const functionPattern = /function\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
  transformed = transformed.replace(functionPattern, (match, funcName, params) => {
    const typedParams = addTypesToParams(params);
    return `function ${funcName}(${typedParams}): void {`;
  });

  const arrowFunctionPattern = /const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*\{/g;
  transformed = transformed.replace(arrowFunctionPattern, (match, funcName, params) => {
    const typedParams = addTypesToParams(params);
    return `const ${funcName} = (${typedParams}): void => {`;
  });

  const arrowFunctionWithReturnPattern = /const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*([^{])/g;
  transformed = transformed.replace(arrowFunctionWithReturnPattern, (match, funcName, params, returnStart) => {
    const typedParams = addTypesToParams(params);
    return `const ${funcName} = (${typedParams}) => ${returnStart}`;
  });

  return transformed;
}

function addTypesToParams(params: string): string {
  if (!params.trim()) return '';

  return params.split(',').map((param: string) => {
    const trimmed = param.trim();
    if (!trimmed) return trimmed;

    if (trimmed.includes(':')) return trimmed;

    if (trimmed.includes('=')) {
      const [name, defaultValue] = trimmed.split('=').map(s => s.trim());
      const inferredType = inferTypeFromValue(defaultValue);
      return `${name}: ${inferredType} = ${defaultValue}`;
    }

    return `${trimmed}: unknown`;
  }).join(', ');
}

function inferTypeFromValue(value: string): string {
  if (value === 'true' || value === 'false') return 'boolean';
  if (/^\d+$/.test(value)) return 'number';
  if (/^['"].*['"]$/.test(value)) return 'string';
  if (value === 'null') return 'null';
  if (value === 'undefined') return 'undefined';
  if (value.startsWith('[')) return 'unknown[]';
  if (value.startsWith('{')) return 'Record<string, unknown>';
  return 'unknown';
}

function transformModuleExports(content: string): string {
  let transformed = content;

  const moduleExportsPattern = /module\.exports\s*=\s*(\{[^}]+\}|\w+);?/g;
  transformed = transformed.replace(moduleExportsPattern, (match, exports) => {
    if (exports.startsWith('{')) {
      const exportItems = exports.slice(1, -1).split(',').map((item: string) => item.trim()).filter(Boolean);
      return `export { ${exportItems.join(', ')} };`;
    }
    return `export default ${exports};`;
  });

  const namedExportsPattern = /exports\.(\w+)\s*=\s*([^;]+);/g;
  transformed = transformed.replace(namedExportsPattern, (match, name, value) => {
    return `export const ${name} = ${value};`;
  });

  return transformed;
}

function addTypeAnnotationsToVariables(content: string): string {
  let transformed = content;

  const portPattern = /const\s+(\w*[Pp]ort\w*)\s*=\s*([^;]+);/g;
  transformed = transformed.replace(portPattern, (match, varName, value) => {
    return `const ${varName}: number | string = ${value};`;
  });

  return transformed;
}
