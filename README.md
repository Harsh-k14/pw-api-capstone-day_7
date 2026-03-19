# Playwright API Automation Framework — DummyJSON

## Prerequisites

- Node.js 18 or higher
- npm
- Internet connection (tests hit the live DummyJSON API)

---

## Setup

```bash
# install dependencies
npm ci

# install playwright browsers
npx playwright install

# copy the env template
cp .env.example .env

# open .env and fill in your credentials if you want auth tests to run
# USER=your_username
# PASS=your_password
```

---

## Running Tests

```bash
# run everything
npm test

# only smoke tests (fast, happy path)
npm run test:smoke

# full regression suite
npm run test:regression

# open the html report after a run
npm run report
```

---

## Project Structure

```
pw-api-capstoneNew/
├── tests/
│   └── api/
│       ├── product.spec.ts       # all product tests
│       └── user.spec.ts          # all user tests
├── fixtures/
│   └── api-fixture.ts            # custom productApi and userApi fixtures
├── utils/
│   ├── apiClient.ts              # http client wrapper (get/post/put/patch/delete)
│   ├── dataFactory.ts            # builds test data (users, products)
│   ├── schemas.ts                # json schemas for response validation
│   └── schemaValidator.ts        # ajv-based schema assertion helper
├── .auth/
│   └── token.json                # jwt token saved by global setup (gitignored)
├── .github/
│   └── workflows/
│       └── ci.yml                # github actions pipeline
├── global.setup.ts               # logs in once before all tests, saves token
├── playwright.config.ts          # playwright configuration
├── .env                          # your local env variables (gitignored)
├── .env.example                  # template showing what env vars are needed
├── package.json
└── tsconfig.json
```

## Test Coverage

### Products (`product.spec.ts`)

| Test | Tag |
|---|---|
| GET /products returns 200 and valid schema | @smoke @api |
| GET /products/{id} returns correct product | @smoke @api |
| GET /products/{id} responds within perf budget (800ms) | @smoke @api |
| GET /products respects the limit param | @api |
| GET /products includes pagination metadata | @api |
| GET /products pages do not overlap | @api |
| GET /products IDs are unique within a page | @api |
| GET /products all items have required fields | @api |
| GET /products/{id} core fields are present and non-null | @api |
| GET /products/search returns relevant results | @api |
| GET /products/search with no match returns empty list | @api |
| GET /products/search?q=apple returns apple products | @api |
| GET /products/categories filters by category correctly | @api |
| Negative: GET /products/{id} with invalid id returns 404 | @api |

### Users (`user.spec.ts`)

| Test | Tag |
|---|---|
| Create → Update → Delete user flow | @smoke @api |
| GET /users/{id} returns correct user | @smoke @api |
| GET /users/{id} responds within perf budget (800ms) | @smoke @api |
| GET /users list returns users with valid schema | @api |
| GET /users pages do not overlap | @api |
| GET /users IDs are unique within a page | @api |
| GET /users/search returns relevant results | @api |
| Negative: GET /users/{id} with invalid id returns 404 | @api |

---

## CI/CD

The project includes a GitHub Actions workflow at `.github/workflows/ci.yml`. It runs on every push and pull request:

1. Checks out the code
2. Sets up Node.js 20
3. Runs `npm ci` to install dependencies
4. Runs `npx playwright install --with-deps` to install browsers
5. Runs `npm run test:api` to execute all API tests
6. Uploads the HTML report as a build artifact

Credentials (`API_USER`, `API_PASS`, `AUTH_TOKEN`) are stored as GitHub Secrets and injected as environment variables during the run.
