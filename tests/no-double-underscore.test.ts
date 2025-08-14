import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('Code Quality - No Double Underscore Properties', () => {
  it('should not use __ properties in src/ directory - ONLY USE SYMBOLS', async () => {
    // IMPORTANT: Never use .__property pattern in our codebase!
    // Always use symbols instead for internal properties.
    // This pattern is error-prone and can lead to property name collisions.
    // Symbols provide a much cleaner and safer way to store internal state.
    
    const srcDir = path.join(process.cwd(), 'src');
    const files = await getAllTypeScriptFiles(srcDir);
    
    const violations: string[] = [];
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Check for .__property pattern (property access with double underscore)
        // This regex matches things like: obj.__property, this.__something, (x as any).__thing
        const doubleUnderscorePattern = /\.\s*__[a-zA-Z_][a-zA-Z0-9_]*/g;
        const matches = line.match(doubleUnderscorePattern);
        
        if (matches) {
          violations.push(
            `${file}:${index + 1} - Found "${matches.join(', ')}" - Use symbols instead!`
          );
        }
        
        // Also check for property definitions with double underscore
        // Like: __property: value or __property = value
        const propertyDefPattern = /^\s*__[a-zA-Z_][a-zA-Z0-9_]*\s*[:=]/g;
        const defMatches = line.match(propertyDefPattern);
        
        if (defMatches) {
          violations.push(
            `${file}:${index + 1} - Found property definition "${defMatches.join(', ')}" - Use symbols instead!`
          );
        }
      });
    }
    
    if (violations.length > 0) {
      const message = [
        'Found double underscore properties in the codebase:',
        '',
        ...violations,
        '',
        'NEVER use .__property pattern! Always use symbols for internal properties.',
        'Symbols are type-safe, prevent collisions, and are the correct way to handle internal state.',
        'Example:',
        '  BAD:  (element as any).__transition = value;',
        '  GOOD: (element as any)[TRANSITION_SYMBOL] = value;'
      ].join('\n');
      
      throw new Error(message);
    }
    
    // If we get here, the test passes
    expect(violations).toHaveLength(0);
  });
});

async function getAllTypeScriptFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively get files from subdirectories
      const subFiles = await getAllTypeScriptFiles(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}