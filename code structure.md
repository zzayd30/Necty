# Necty - Code Structure and Conventions

This document outlines the architecture, coding patterns, and standards used throughout the Necty application.

---

## 1. Core Architecture Pattern
Our client-side architecture follows a clean separation of concerns:
```mermaid
graph TD
    UI[Components & Pages] --> Hooks[React Hooks /src/hooks]
    UI --> Stores[Zustand Stores /src/stores]
    Hooks --> API[Axios Client /src/lib/api.ts]
    API --> Backend[API Routes /src/app/api]
```

---

## 2. API Calling Layer

### A. Raw Client Definition (`/src/lib/api.ts`)
- All backend requests use a pre-configured `axios` client instance `apiClient` targeting `/api`.
- API endpoints are organized under namespace exports (e.g., `authApi`, `onboardingApi`, `billingApi`).
- All payload and response bodies are strictly typed (e.g., `SignupPayload`, `MessageResponse`).
- Error messages are extracted and normalized to ensure user-friendly error messages are propagated.

### B. API Hooks Wrapper (`/src/hooks/`)
- Components **never** call the API client directly. Instead, they use wrapper hooks (e.g., `useAuthApi`, `useOnboardingApi`).
- Every endpoint call is wrapped in `useCallback` to prevent unnecessary component re-renders.
- Example structure of an API hook:
```typescript
import { useCallback } from "react";
import { authApi, type LoginPayload } from "@/lib/api";

export function useAuthApi() {
  const login = useCallback((payload: LoginPayload) => authApi.login(payload), []);
  return { login };
}
```

---

## 3. State Management

### A. Zustand Stores (`/src/stores/`)
- Global state, multi-step forms, and cached local states are managed using **Zustand**.
- **Rule:** Stores are kept in-memory to prevent state leakages and ensure a clean, session-based user flow. We do not use `localStorage` for store persistence.

### B. Client-Side Mounting Check
When using Zustand stores in components that run during Server-Side Rendering (SSR), ensure the component has mounted on the client before rendering or referencing client-only state:
```typescript
const [mounted, setMounted] = React.useState(false);

React.useEffect(() => {
  setMounted(true);
}, []);
```

---

## 4. Directory Layout

- `/src/app`: Page routing structure (using Next.js App Router).
  - `/src/app/api`: Server-side Route Handlers (`route.ts`).
- `/src/components`: UI components, organized by domain (e.g., `components/onboarding`, `components/ui`).
- `/src/hooks`: Custom React hooks, including API call abstractions.
- `/src/lib`: Core utility files (e.g., Supabase client/server initializers, helper utilities, and `api.ts`).
- `/src/stores`: Zustand state stores.
- `/src/types`: Global TypeScript declarations and interfaces.
