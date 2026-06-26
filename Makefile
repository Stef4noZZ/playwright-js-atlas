.PHONY: help install browsers test smoke ui api e2e headed report lint format type check clean

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n"} /^[a-zA-Z_-]+:.*?##/ {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install npm dependencies
	npm install

browsers: ## Install Playwright browsers and OS deps
	npx playwright install --with-deps

test: ## Run the full test suite
	npm test

smoke: ## Run smoke suite
	npm run test:smoke

ui: ## Run UI tests only
	npm run test:ui

api: ## Run API tests only
	npm run test:api

e2e: ## Run end-to-end tests only
	npm run test:e2e

headed: ## Run UI tests with a visible browser
	npm run test:headed

report: ## Open the last HTML report
	npm run report

lint: ## Lint with ESLint
	npm run lint

format: ## Format with Prettier
	npm run format

type: ## Type-check with tsc
	npm run typecheck

check: ## Run lint, format check, and type check
	npm run check

clean: ## Remove report artifacts and caches
	rm -rf reports/* playwright-report test-results .cache
