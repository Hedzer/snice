import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

// Find all demo.html files
function findDemoFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and hidden directories
      if (!file.startsWith('.') && file !== 'node_modules') {
        findDemoFiles(filePath, fileList);
      }
    } else if (file === 'demo.html') {
      fileList.push(filePath.replace(process.cwd() + '/', ''));
    }
  });

  return fileList;
}

const demoFiles = findDemoFiles('./components');
const errors: Array<{ file: string; type: string; message: string }> = [];

test.describe('Demo Pages', () => {
  for (const demoFile of demoFiles) {
    test(`should load ${demoFile} without errors`, async ({ page }) => {
      const consoleMessages: string[] = [];
      const pageErrors: string[] = [];

      // Listen for console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleMessages.push(msg.text());
        }
      });

      // Listen for page errors
      page.on('pageerror', error => {
        pageErrors.push(error.message);
      });

      // Navigate to demo page
      const url = `http://localhost:5566/${demoFile}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });

        // Wait a bit for any lazy-loaded errors
        await page.waitForTimeout(1000);

        // Check for errors
        if (consoleMessages.length > 0) {
          consoleMessages.forEach(msg => {
            errors.push({ file: demoFile, type: 'console', message: msg });
          });
        }

        if (pageErrors.length > 0) {
          pageErrors.forEach(msg => {
            errors.push({ file: demoFile, type: 'exception', message: msg });
          });
        }

        // Take screenshot if errors occurred
        if (consoleMessages.length > 0 || pageErrors.length > 0) {
          await page.screenshot({
            path: `test-results/${demoFile.replace(/\//g, '-')}.png`,
            fullPage: true
          });
        }

      } catch (error: any) {
        errors.push({
          file: demoFile,
          type: 'navigation',
          message: error.message
        });
      }
    });
  }
});

test.afterAll(() => {
  // Output all errors at the end
  if (errors.length > 0) {
    console.log('\n=== DEMO ERRORS SUMMARY ===\n');
    errors.forEach(err => {
      console.log(`${err.file}`);
      console.log(`  Type: ${err.type}`);
      console.log(`  Message: ${err.message}\n`);
    });
  } else {
    console.log('\n=== ALL DEMOS LOADED SUCCESSFULLY ===\n');
  }
});
