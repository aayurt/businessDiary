.PHONY: dev build test test:all test:components test:e2e lint typecheck \
        docker:build docker:up docker:down docker:logs docker:reset docker:prod \
        clean setup db:migrate db:push db:seed audit audit:security

# Development
dev:
	npm run dev

build:
	npm run build

start:
	npm start

setup:
	npm install
	npx prisma generate
	npx prisma migrate deploy

# Testing
test:
	npm test

test:components:
	npm run test:components

test:all:
	npm run test:all

test:e2e:
	npm run test:e2e

test:coverage:
	npm run test:coverage

test:watch:
	npm run test:watch

test:components:watch:
	npm run test:components:watch

# Linting & type checking
lint:
	npm run lint

typecheck:
	npm run typecheck

# Database
db:migrate:
	npx prisma migrate dev

db:push:
	npx prisma db push

db:seed:
	npx prisma db seed

db:studio:
	npx prisma studio

# Docker
docker:build:
	docker compose build

docker:up:
	docker compose up -d

docker:down:
	docker compose down

docker:logs:
	docker compose logs -f

docker:reset:
	docker compose down -v
	docker compose up -d

docker:prod:
	docker compose -f docker-compose.yml up -d --build

# Audit
audit:
	npm run audit

audit:security:
	npm run audit:security

audit:json:
	npm run audit:json

audit:md:
	npm run audit:md

# Utility
clean:
	rm -rf .next coverage node_modules playwright-report test-results
	rm -f tsconfig.tsbuildinfo
	npm install

prune:
	npx depcheck
