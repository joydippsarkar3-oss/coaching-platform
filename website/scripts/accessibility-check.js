#!/usr/bin/env node
/**
 * WCAG 2.1 AA Accessibility Check
 * Uses axe-core via puppeteer to audit key pages.
 * Exits with code 1 if any critical or serious violations are found.
 *
 * Install deps before running:
 *   npm install --save-dev axe-core puppeteer
 */

'use strict';

const puppeteer = require('puppeteer');
const { default: axe } = require('axe-core');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const PAGES = [
  '/',
  '/courses',
  '/verify',
  '/legal/terms',
  '/legal/privacy',
];

// WCAG 2.1 AA tag set
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const CRITICAL_LEVELS = new Set(['critical', 'serious']);

function formatViolation(violation) {
  const lines = [
    `  [${violation.impact.toUpperCase()}] ${violation.id}: ${violation.description}`,
    `  Help: ${violation.helpUrl}`,
    `  Affected nodes (${violation.nodes.length}):`,
  ];
  violation.nodes.slice(0, 5).forEach((node) => {
    const selector = node.target.join(', ');
    lines.push(`    - ${selector}`);
    if (node.failureSummary) {
      node.failureSummary
        .split('\n')
        .slice(0, 3)
        .forEach((l) => lines.push(`      ${l.trim()}`));
    }
  });
  if (violation.nodes.length > 5) {
    lines.push(`    ... and ${violation.nodes.length - 5} more`);
  }
  return lines.join('\n');
}

async function checkPage(browser, url) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Inject axe-core from the installed package
    const axePath = require.resolve('axe-core');
    await page.addScriptTag({ path: axePath });

    const results = await page.evaluate((tags) => {
      return new Promise((resolve) => {
        window.axe.run(document, { runOnly: { type: 'tag', values: tags } }, (err, res) => {
          if (err) resolve({ error: err.message, violations: [] });
          else resolve(res);
        });
      });
    }, AXE_TAGS);

    return results.violations || [];
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('CompuTrain Accessibility Check — WCAG 2.1 AA\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Pages:    ${PAGES.join(', ')}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let totalViolations = 0;
  let criticalCount = 0;
  const summary = [];

  try {
    for (const pagePath of PAGES) {
      const url = `${BASE_URL}${pagePath}`;
      process.stdout.write(`Checking ${url} ... `);

      let violations;
      try {
        violations = await checkPage(browser, url);
      } catch (err) {
        console.error(`ERROR\n  Failed to check ${url}: ${err.message}`);
        summary.push({ url, violations: [], error: err.message });
        continue;
      }

      const criticalViolations = violations.filter((v) => CRITICAL_LEVELS.has(v.impact));
      const otherViolations = violations.filter((v) => !CRITICAL_LEVELS.has(v.impact));

      if (violations.length === 0) {
        console.log('PASS (0 violations)');
      } else {
        console.log(
          `FAIL — ${violations.length} violation(s): ` +
            `${criticalViolations.length} critical/serious, ${otherViolations.length} moderate/minor`
        );
      }

      totalViolations += violations.length;
      criticalCount += criticalViolations.length;
      summary.push({ url, violations });

      if (violations.length > 0) {
        console.log('\n  --- Violations ---');
        violations
          .sort((a, b) => {
            const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
            return (order[a.impact] ?? 9) - (order[b.impact] ?? 9);
          })
          .forEach((v) => console.log(formatViolation(v)));
        console.log();
      }
    }
  } finally {
    await browser.close();
  }

  // Final summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  summary.forEach(({ url, violations, error }) => {
    if (error) {
      console.log(`  ${url}: ERROR — ${error}`);
    } else {
      const critical = violations.filter((v) => CRITICAL_LEVELS.has(v.impact)).length;
      const status = violations.length === 0 ? 'PASS' : `FAIL (${violations.length} violations, ${critical} critical/serious)`;
      console.log(`  ${url}: ${status}`);
    }
  });
  console.log();
  console.log(`Total violations : ${totalViolations}`);
  console.log(`Critical/serious : ${criticalCount}`);

  if (criticalCount > 0) {
    console.error('\nFAILED: Critical or serious WCAG 2.1 AA violations found.');
    process.exit(1);
  } else if (totalViolations > 0) {
    console.warn('\nWARNING: Non-critical violations found. Please review.');
    process.exit(0);
  } else {
    console.log('\nAll pages passed WCAG 2.1 AA checks.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
