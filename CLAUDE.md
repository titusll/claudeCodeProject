# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Salesforce DX (SFDX) project** using Lightning Web Components (LWC) and Apex. Salesforce metadata is deployed to orgs rather than built locally.

## Common Commands

```bash
# Linting
npm run lint                  # Lint Aura and LWC JavaScript files

# Testing
npm test                      # Run LWC Jest unit tests
npm run test:unit:watch       # Run tests in watch mode
npm run test:unit:debug       # Run tests in debug mode
npm run test:unit:coverage    # Run tests with coverage report

# Formatting
npm run prettier              # Format all code files
npm run prettier:verify       # Verify formatting without writing
```

## Architecture

All Salesforce metadata lives under `force-app/main/default/`:

- `lwc/` — Lightning Web Components (modern UI components)
- `aura/` — Legacy Aura components
- `classes/` — Apex classes (server-side logic)
- `triggers/` — Apex triggers
- `objects/` — Custom object definitions
- `flexipages/` — Lightning App Builder pages
- `staticresources/` / `contentassets/` — Static files

Scripts for ad-hoc execution live in `scripts/apex/` and `scripts/soql/`.

## Tooling Notes

- **ESLint**: Configured via `eslint.config.js` with `@salesforce/eslint-config-lwc` and `@salesforce/eslint-plugin-aura`
- **Jest**: Configured via `jest.config.js` using `@salesforce/sfdx-lwc-jest` — tests live alongside components as `__tests__/` directories
- **Prettier**: Configured via `.prettierrc` with Apex and XML plugin support; LWC HTML uses a custom parser
- **Husky + lint-staged**: Pre-commit hook runs linting and formatting on staged files automatically
- **Salesforce API version**: 66.0 (see `sfdx-project.json`)
- **Scratch org definition**: `config/project-scratch-def.json` (Developer edition, Lightning Experience enabled)