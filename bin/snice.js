#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join, resolve, basename } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, cpSync, statSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

if (command === 'create-app') {
  // Parse arguments - separate flags from positional arguments
  const flags = {};
  const positional = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      if (arg.includes('=')) {
        const [key, value] = arg.split('=');
        flags[key.slice(2)] = value;
      } else {
        flags[arg.slice(2)] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  const projectPath = positional[0] || '.';
  const template = flags.template || 'default';

  createApp(projectPath, template);
} else if (command === 'mcp') {
  // Start MCP server
  import('./mcp-server.js');
} else if (command === 'validate') {
  validateProject();
} else if (command === 'build-component') {
  // Parse arguments - separate flags from positional arguments
  const flags = {};
  const positional = [];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      if (arg.includes('=')) {
        const [key, value] = arg.split('=');
        flags[key.slice(2)] = value;
      } else {
        flags[arg.slice(2)] = true;
      }
    } else {
      positional.push(arg);
    }
  }

  const componentName = positional[0];
  const outputDir = flags.output || './dist/cdn';
  const formats = flags.format ? flags.format.split(',') : ['iife'];
  const minify = flags.minify !== false;
  const withTheme = flags['with-theme'] === true;

  if (!componentName) {
    console.error('❌ Error: Component name is required\n');
    console.log('Usage: snice build-component <component-name> [options]\n');
    process.exit(1);
  }

  buildComponent(componentName, { outputDir, formats, minify, withTheme, copyToPublic: flags['copy-to-public'] === true });
} else {
  console.log(`
Snice CLI

Usage:
  snice create-app <project-name>                       Create a new Snice app
  snice create-app .                                    Initialize in current directory
  snice build-component <component-name> [options]      Build CDN component
  snice validate                                        Check project for common issues
  snice mcp                                             Start MCP server for AI assistants

Create App Options:
  --template=react                                      Use React template instead of default

Build Component Options:
  --output=<dir>                                        Output directory (default: ./dist/cdn)
  --format=<formats>                                    Comma-separated formats: iife (default: iife)
  --minify                                              Minify output (default: true)
  --with-theme                                          Include theme.css in output

MCP Server:
  Start a Model Context Protocol server for AI-assisted development.
  Connect in Claude Code: claude mcp add snice -- npx snice mcp

Examples:
  snice create-app my-app
  snice create-app my-app --template=react
  snice build-component button
  snice build-component button --output=./cdn --format=iife
  snice mcp
`);
}

function createApp(projectPath, template = 'default') {
  const targetDir = resolve(process.cwd(), projectPath);
  const projectName = projectPath === '.' ? basename(process.cwd()) : basename(targetDir);

  console.log(`\n🚀 Creating Snice app in ${targetDir}...\n`);

  // Check if directory exists and is empty
  if (projectPath !== '.') {
    if (existsSync(targetDir)) {
      const files = readdirSync(targetDir);
      if (files.length > 0 && !files.every(f => f.startsWith('.'))) {
        console.error(`❌ Directory ${targetDir} is not empty!`);
        process.exit(1);
      }
    } else {
      mkdirSync(targetDir, { recursive: true });
    }
  } else {
    // Check current directory
    const files = readdirSync(targetDir);
    const hasNonDotFiles = files.some(f => !f.startsWith('.') && f !== 'node_modules');
    if (hasNonDotFiles) {
      console.error(`❌ Current directory is not empty!`);
      process.exit(1);
    }
  }

  // Path to templates
  const templateDir = join(__dirname, 'templates', template);

  // Check if template exists
  if (!existsSync(templateDir)) {
    console.error(`❌ Template "${template}" not found!`);
    console.error(`Available templates: default, react`);
    process.exit(1);
  }

  // Copy template files
  copyTemplateFiles(templateDir, targetDir, projectName);

  // Copy shared CLAUDE.md
  const claudeMdPath = join(__dirname, 'templates', 'CLAUDE.md');
  if (existsSync(claudeMdPath)) {
    console.log(`  Creating CLAUDE.md...`);
    const claudeMdContent = readFileSync(claudeMdPath, 'utf8');
    writeFileSync(join(targetDir, 'CLAUDE.md'), claudeMdContent.replace(/\{\{projectName\}\}/g, projectName));
  }

  // Copy shared .gitignore
  const gitignorePath = join(__dirname, 'templates', '.gitignore');
  if (existsSync(gitignorePath)) {
    console.log(`  Creating .gitignore...`);
    const gitignoreContent = readFileSync(gitignorePath, 'utf8');
    writeFileSync(join(targetDir, '.gitignore'), gitignoreContent);
  }

  console.log(`\n✨ Project created successfully!\n`);
  console.log('Next steps:');

  if (projectPath !== '.') {
    console.log(`  cd ${projectPath}`);
  }

  console.log('  npm install');
  console.log('  npm run dev\n');
  console.log('Happy coding! 🎉\n');
}

function copyTemplateFiles(sourceDir, targetDir, projectName) {
  const files = readdirSync(sourceDir, { withFileTypes: true });

  for (const file of files) {
    const sourcePath = join(sourceDir, file.name);
    const targetPath = join(targetDir, file.name);

    if (file.isDirectory()) {
      // Create directory and recursively copy contents
      if (!existsSync(targetPath)) {
        mkdirSync(targetPath, { recursive: true });
      }
      copyTemplateFiles(sourcePath, targetPath, projectName);
    } else {
      // Read file, replace placeholders, and write to target
      console.log(`  Creating ${file.name}...`);

      let content = readFileSync(sourcePath, 'utf8');

      // Replace {{projectName}} placeholders
      content = content.replace(/\{\{projectName\}\}/g, projectName);

      writeFileSync(targetPath, content);
    }
  }
}

async function buildComponent(componentName, options) {
  const { outputDir, formats, minify, withTheme, copyToPublic } = options;

  console.log(`\n🔨 Building CDN component: ${componentName}\n`);

  // Verify component exists
  const componentPath = join(process.cwd(), 'components', componentName, `snice-${componentName}.ts`);
  if (!existsSync(componentPath)) {
    console.error(`❌ Component not found: ${componentPath}`);
    console.error('Available components:');

    const componentsDir = join(process.cwd(), 'components');
    if (existsSync(componentsDir)) {
      const items = readdirSync(componentsDir);
      for (const item of items) {
        const itemPath = join(componentsDir, item);
        if (statSync(itemPath).isDirectory() && item !== 'theme') {
          const tsFile = join(itemPath, `snice-${item}.ts`);
          if (existsSync(tsFile)) {
            console.error(`  - ${item}`);
          }
        }
      }
    }
    process.exit(1);
  }

  const configContent = `
import { createCdnBuild } from './rollup.config.cdn.js';

export default createCdnBuild('${componentName}', {
  minify: ${minify},
  withTheme: ${withTheme},
  formats: ${JSON.stringify(formats)}
});
`;

  const tempConfigPath = join(process.cwd(), '.rollup.config.temp.js');
  writeFileSync(tempConfigPath, configContent);

  try {
    const { stdout, stderr } = await execAsync(`npx rollup -c ${tempConfigPath}`);
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('created')) console.error(stderr);
  } catch (error) {
    console.error(`\n❌ Build failed:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    process.exit(1);
  } finally {
    if (existsSync(tempConfigPath)) {
      const { unlinkSync } = await import('fs');
      unlinkSync(tempConfigPath);
    }
  }

  const outputPath = join(process.cwd(), outputDir, componentName);

  // Copy .min.js files to public/components/
  const publicDir = join(process.cwd(), 'public', 'components');
  if (existsSync(publicDir) && existsSync(outputPath)) {
    const minFiles = readdirSync(outputPath).filter(f => f.endsWith('.min.js'));
    for (const file of minFiles) {
      const src = join(outputPath, file);
      const dest = join(publicDir, file);
      const { copyFileSync } = await import('fs');
      copyFileSync(src, dest);
    }
    if (minFiles.length > 0) {
      console.log(`📋 Copied ${minFiles.length} file(s) to public/components/`);
    }
  }

  console.log(`\n✨ Build complete!\n`);
  console.log(`📁 Output: ${outputDir}/${componentName}/\n`);

  // List generated files
  if (existsSync(outputPath)) {
    console.log('Generated files:');
    const files = readdirSync(outputPath);
    for (const file of files) {
      const filePath = join(outputPath, file);
      const stats = statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  ${file} (${sizeKB} KB)`);
    }
  }
}

function validateProject() {
  console.log('\n🔍 Validating project...\n');

  const warnings = [];
  const controllersDir = join(process.cwd(), 'controllers');

  if (existsSync(controllersDir)) {
    const files = readdirSync(controllersDir, { recursive: true });

    for (const file of files) {
      if (typeof file === 'string' && file.endsWith('.ts')) {
        const filePath = join(controllersDir, file);
        const content = readFileSync(filePath, 'utf8');

        // Check for imports from component files (not .types.ts)
        const importRegex = /from\s+['"].*\/components\/[^'"]+\/snice-[^'"]+(?<!\.types)['"];?/g;
        const matches = content.match(importRegex);

        if (matches) {
          for (const match of matches) {
            // Skip if it's actually a .types import
            if (!match.includes('.types')) {
              warnings.push({
                file: filePath,
                message: `Controller imports from component file instead of .types.ts`,
                match: match.trim()
              });
            }
          }
        }
      }
    }
  }

  if (warnings.length === 0) {
    console.log('✅ No issues found.\n');
  } else {
    console.log(`⚠️  Found ${warnings.length} warning(s):\n`);
    for (const warning of warnings) {
      console.log(`  ${warning.file}`);
      console.log(`    ${warning.message}`);
      console.log(`    ${warning.match}`);
      console.log(`    → Use .types.ts imports to avoid circular dependencies\n`);
    }
  }
}
