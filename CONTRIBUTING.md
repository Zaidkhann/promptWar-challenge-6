# Contributing to SaansAI

Thank you for your interest in improving SaansAI! This project is dedicated to providing scientifically grounded, zero-hallucination air quality intelligence for Indian families.

---

## 1. Development Prerequisites

- **Node.js**: v20.x or v22.x LTS
- **Package Manager**: npm v10+
- **Environment Variables**: Copy `.env.example` to `.env.local`

```bash
cp .env.example .env.local
npm install
npm run dev
```

---

## 2. Engineering Standards & Quality Checklist

Before submitting code, ensure all quality gates pass:

1. **Linting**:
   ```bash
   npm run lint
   ```
   Must complete with 0 errors and 0 warnings.

2. **TypeScript Compilation**:
   ```bash
   npm run typecheck
   ```
   No `any` types permitted. All domain models and API contracts must be strictly typed using Zod and TypeScript interfaces.

3. **Test Suite**:
   ```bash
   npm test
   ```
   All 143+ unit, integration, and security tests must pass. When adding new features or rules, include corresponding test specifications under `tests/`.

4. **Production Build**:
   ```bash
   npm run build
   ```
   All routes must build and prerender cleanly without server-side execution errors.

---

## 3. Architecture Guidelines

- **Domain Separation**: Keep business logic in `src/lib/` purely functional and deterministic where possible.
- **Explainability**: Every recommendation or simulation output must include clear human-readable explanations, underlying data sources, and scientific citations.
- **Accessibility**: Use semantic HTML, ARIA landmarks, explicit labels (`htmlFor` + `id`), and ensure high contrast across both light and dark themes.
