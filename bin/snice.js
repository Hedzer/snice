#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join, resolve, basename } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, cpSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

if (command === 'create-app') {
  const projectPath = args[1] || '.';
  createApp(projectPath);
} else {
  console.log(`
Snice CLI

Usage:
  snice create-app <project-name>  Create a new Snice application
  snice create-app .               Initialize in current directory

Examples:
  snice create-app my-app
  npx snice create-app my-app
`);
}

function createApp(projectPath) {
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
  const templateDir = join(__dirname, 'templates', 'base');
  
  // Copy template files
  copyTemplateFiles(templateDir, targetDir, projectName);

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