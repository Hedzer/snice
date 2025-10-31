import { test, expect } from '@playwright/test';

test('bar chart alignment check', async ({ page }) => {
  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('BROWSER CONSOLE:', msg.text());
    }
  });
  await page.goto('http://localhost:5566/components/chart/demo.html');
  await page.waitForLoadState('networkidle');

  // Wait for chart to render
  await page.waitForTimeout(1000);

  // Get bar chart data
  const chartData = await page.evaluate(() => {
    const chart = document.getElementById('bar-chart');
    if (!chart) return null;

    const canvas = chart.shadowRoot?.querySelector('canvas');
    const ctx = canvas?.getContext('2d');

    return {
      type: chart.type,
      labels: chart.labels,
      datasets: chart.datasets,
      canvas: {
        width: canvas?.width,
        height: canvas?.height
      }
    };
  });

  console.log('Chart type:', chartData?.type);
  console.log('Labels:', chartData?.labels);
  console.log('Canvas size:', chartData?.canvas);

  // Check visual alignment
  const barChart = page.locator('#bar-chart');
  const screenshot = await barChart.screenshot();
  console.log('Screenshot captured, size:', screenshot.length, 'bytes');

  // Analyze the canvas pixels to detect bar positions
  const barAnalysis = await page.evaluate(() => {
    const chart = document.getElementById('bar-chart');
    const canvas = chart?.shadowRoot?.querySelector('canvas');
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Find colored pixels (bars) - scan whole width to find all bars
    const barRegions = [];
    let inBar = false;
    let barStart = 0;

    // Scan horizontally at middle height
    const scanY = Math.floor(canvas.height * 0.7);
    for (let x = 0; x < canvas.width; x++) {
      const idx = (scanY * canvas.width + x) * 4;
      const hasColor = data[idx + 3] > 0 && (data[idx] > 0 || data[idx + 1] > 0 || data[idx + 2] > 0);

      if (hasColor && !inBar) {
        inBar = true;
        barStart = x;
      } else if (!hasColor && inBar) {
        inBar = false;
        barRegions.push({ start: barStart, end: x - 1, width: x - barStart });
      }
    }
    if (inBar) {
      barRegions.push({ start: barStart, end: canvas.width - 1, width: canvas.width - barStart });
    }

    return {
      bars: barRegions,
      totalWidth: canvas.width,
      scanY: scanY
    };
  });

  console.log('Bar positions detected:', barAnalysis);

  // The bars should be centered in their segments
  // With 5 labels, each segment should be width/5
  const expectedSegmentWidth = barAnalysis?.totalWidth / 5;
  console.log('Expected segment width:', expectedSegmentWidth);
});