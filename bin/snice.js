#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join, resolve, basename } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, cpSync } from 'fs';

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
  const template = flags.template || 'base';

  createApp(projectPath, template);
} else {
  console.log(`
Snice CLI

Usage:
  snice create-app [options] <project-name>
  snice create-app [options] .                          Initialize in current directory

Options:
  --template=<name>                                     Template to use (default: base)

Templates:
  base    - Minimal starter with counter example (default)
  pwa     - Progressive Web App with auth, middleware, and live notifications

Examples:
  snice create-app my-app
  snice create-app my-app --template=pwa
  npx snice create-app my-app --template=pwa
`);
}

function createApp(projectPath, template = 'base') {
  const targetDir = resolve(process.cwd(), projectPath);
  const projectName = projectPath === '.' ? basename(process.cwd()) : basename(targetDir);

  console.log(`\n🚀 Creating Snice app in ${targetDir}...\n`);
  console.log(`📦 Using template: ${template}\n`);

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
    console.error(`Available templates: base, pwa`);
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