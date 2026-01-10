# JavaScript to TypeScript Migration Tool

A CLI tool to help migrate JavaScript files to TypeScript in the TraderX project.

## Features

- **Migrate**: Convert JavaScript files to TypeScript with automatic type annotations
- **Init**: Initialize TypeScript configuration for a project
- **Analyze**: Analyze JavaScript files and report migration complexity

## Installation

```bash
cd tools/js-to-ts-migration
npm install
npm run build
```

## Usage

### Migrate Files

Migrate a single file:
```bash
npm run dev -- migrate ../trade-feed/index.js
```

Migrate all JS files in a directory:
```bash
npm run dev -- migrate ../trade-feed -r
```

Dry run (preview changes without modifying files):
```bash
npm run dev -- migrate ../trade-feed -d -r
```

### Initialize TypeScript Configuration

Initialize TypeScript for a Node.js project:
```bash
npm run dev -- init ../trade-feed -t node
```

Supported project types:
- `node` - Standard Node.js project
- `nestjs` - NestJS project with decorators
- `react` - React project
- `angular` - Angular project

### Analyze Files

Analyze migration complexity:
```bash
npm run dev -- analyze ../trade-feed -r
```

## Options

### migrate command
- `-d, --dry-run` - Preview changes without modifying files
- `-r, --recursive` - Recursively migrate all JS files in directory
- `--skip-config` - Skip generating tsconfig.json
- `--skip-package` - Skip updating package.json

### init command
- `-t, --type <type>` - Project type (node, nestjs, react, angular)

### analyze command
- `-r, --recursive` - Recursively analyze all JS files

## What the Migration Does

1. **Converts require() to import statements**
   - `const x = require('y')` becomes `import x from 'y'`
   - Destructured requires are converted to named imports

2. **Adds type annotations to functions**
   - Function parameters get `unknown` type by default
   - Return types are set to `void` by default

3. **Transforms module.exports**
   - `module.exports = x` becomes `export default x`
   - `exports.x = y` becomes `export const x = y`

4. **Generates TypeScript configuration**
   - Creates appropriate tsconfig.json based on project type
   - Updates package.json with TypeScript dependencies

## Example

Before (JavaScript):
```javascript
const express = require('express');
const { Server } = require('socket.io');

function handleConnection(socket) {
  console.log('Connected:', socket.id);
}

module.exports = { handleConnection };
```

After (TypeScript):
```typescript
import express from 'express';
import { Server } from 'socket.io';

function handleConnection(socket: unknown): void {
  console.log('Connected:', socket.id);
}

export { handleConnection };
```

## Post-Migration Steps

After running the migration tool:

1. Install dependencies: `npm install`
2. Review and refine type annotations
3. Add proper interfaces for complex types
4. Run TypeScript compiler: `npm run build`
5. Fix any remaining type errors

## License

Apache-2.0
