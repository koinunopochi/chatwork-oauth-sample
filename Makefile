.PHONY: setup dev test lint lint-fix format clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: node_modules certs/.done .env ## Install dependencies, generate SSL certs, and create .env
	@echo ""
	@echo "====================================="
	@echo "  Setup complete!"
	@echo "====================================="
	@echo ""
	@echo "1. Edit .env with your Chatwork OAuth credentials"
	@echo "2. Run: make dev"
	@echo "3. Open: https://127.0.0.1:8000"
	@echo ""

node_modules: package.json pnpm-lock.yaml
	pnpm install
	@touch node_modules

certs/.done:
	@mkdir -p certs
	openssl req -x509 -newkey rsa:2048 -nodes \
		-keyout certs/server.key -out certs/server.crt \
		-days 365 -subj "/CN=127.0.0.1" \
		-addext "subjectAltName=IP:127.0.0.1"
	@touch certs/.done

.env:
	cp .env.example .env

dev: setup ## Start development server with watch mode
	pnpm dev

test: ## Run tests
	pnpm test

lint: ## Run linters (oxlint + biome)
	pnpm lint

lint-fix: ## Run linters with auto-fix
	pnpm lint:fix

format: ## Format code with biome
	pnpm format

clean: ## Remove generated files
	rm -rf node_modules certs dist .env
