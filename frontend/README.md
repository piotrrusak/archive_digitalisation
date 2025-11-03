# Frontend

This subproject contains the frontend of the application, built with React, TypeScript, Vite, and TailwindCSS.

## Getting Started

1. Install dependencies

```
npm install
```

2. Start the development server

```
npm run dev
```

This command runs the app in development mode using Vite.
You can open the app at `http://localhost:5173`
(default Vite port).

## Environment Variables

The frontend uses a gitignored `.env` file to store API keys and other secrets.

To set up your local environment file:

Duplicate the example file:

```
cp .env.example .env
```

Open `.env` and fill in your own values for each variable.

**Note: Never commit your `.env` file to version control.**

## Code Quality Tools

### Prettier — Code Formatter

This project uses Prettier to ensure consistent code style.

To format all files:

```
npm run format
```

To check formatting without applying changes:

```
npm run format:check
```

### ESLint — Linter

This project uses ESLint to catch code issues and enforce best practices.

To run linting:

```
npm run lint
```

To automatically fix some lint issues:

```
npx eslint . --fix
```

### Testing

This project uses Vitest and Testing Library for testing.

Run all tests once:

```
npm run test
```

Run tests in watch mode:

```
npm run test:watch
```

Run tests with coverage:

```
npm run test -- --coverage
```

### Type Checking

To run TypeScript type checks without building:

```
npm run typecheck
```

## Build & Preview

Build the project for production:

```
npm run build
```

Preview the built app locally:

```
npm run preview
```

## Tech Stack

- React 19
- TypeScript
- Vite
- TailwindCSS
- Framer Motion
- React Router DOM
- ESLint + Prettier
- Vitest + Testing Library

## Tips

- Commit only formatted and linted code to keep the repo clean (The CI will block you anyway :p).

- Configure your IDE (e.g., VS Code) to:
  - Use Prettier as the default formatter.

  - Run ESLint on save.
