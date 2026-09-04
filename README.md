# Playwright Automation Template

A Playwright starter project. It has no Azure DevOps connection, no external reporting service, and no saved credentials.

## Purpose
Reusable Playwright TypeScript automation framework.

## Prerequisites
- Node.js
- npm

### Installation

npm install

### Install Playwright browsers

npx playwright install

## Start Playwright here

1. Set `baseURL` in `config/default.json`, or provide `BASE_URL` when running a test.
2. Copy `src/pageObjects/pages/pages-template.ts` for each page or feature.
3. Copy `src/tests/spec-template.spec.ts`, rename it, and replace the example selectors and assertions.

## Commands

- `npm test` — run all tests headlessly.
- `npm run test:ui` — open Playwright's interactive test runner.
- `npm run test:headed` — run with a visible browser.
- `npm run test:debug` — pause tests for debugging.
- `npm run test:report` — view the latest local HTML report.

Failure screenshots, traces, videos, and the HTML report remain on this computer.
