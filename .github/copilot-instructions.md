# DoGoods App - AI Coding Agent Instructions

## Project Overview
React-based community food sharing platform with Supabase backend, AI-powered matching (DeepSeek), and comprehensive admin management. Built with Vite, Tailwind CSS, React Router v6, and modern React patterns (Context API + useReducer).

## Core Architecture Patterns

### Authentication & Authorization Flow
- **Context provider**: `AuthProvider` from `utils/AuthContext.jsx` wraps app in `app.jsx`
- **Hook access**: `useAuthContext()` returns `{ user, isAuthenticated, isAdmin, loading, signIn, signUp, signOut }`
- **Service layer**: `utils/authService.js` manages Supabase auth + localStorage persistence + profile sync
- **Auto-profile creation**: On signup, trigger creates user record in `users` table; service manually creates if trigger fails
- **Admin flag**: `is_admin` boolean column in `users` table (not JWT claim in client)
- **Route protection**: 
  - `AdminRoute` component checks `isAdmin` from context, redirects to `/login?redirect=/admin` or `/` 
  - Inline `ProtectedRoute` wrapper in `app.jsx` for general auth checks

### State Management Pattern
- **Context + useReducer**: Example in `utils/stores/goodsStore.jsx` (claimed/requested goods)
  - Actions: `SET_LOADING`, `SET_ERROR`, `ADD_CLAIMED_GOOD`, etc.
  - Export provider component and hook: `GoodsProvider`, `useGoods()`
- **Custom hooks**: Stored in `utils/hooks/` for domain logic (auth, AI, Supabase operations)
- **Service layer**: Standalone services (`authService.js`, `dataService.js`, `utils/services/goodsService.js`)

### AI Integration Architecture
- **Primary API**: DeepSeek (configured in `utils/config.js` with `DEEPSEEK_API_KEY`)
- **Matching engine**: `utils/MatchingEngine.js` class with circuit breaker pattern for AI failures
- **Chat interface**: `components/assistant/AIAssistant.jsx` - floating widget via `AssistantButton` in `MainLayout`
- **Streaming support**: `streamDeepseekChat()` in `utils/deepseekChat.js` for real-time responses
- **Graceful degradation**: API key validation on init; features disable when key missing/invalid

## Critical Development Workflows

### Environment Setup & First Run
```bash
cp config/env.example .env.local
# Edit .env.local: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev                    # Starts on port 3001, auto-opens browser
```

### Supabase Local Development (Optional)
```bash
npm run supabase:start         # Starts local Supabase (requires Docker)
npm run supabase:studio        # Opens Studio at http://localhost:54323
npm run supabase:reset         # Resets DB and runs all migrations in order
npm run dev:local              # Starts both Supabase and Vite dev server
```

### Database Migrations
- Migration files in `supabase/migrations/` (numbered: `001_initial_schema.sql`, `002_create_profile_trigger.sql`, etc.)
- **Run order matters**: Migrations execute sequentially by filename
- **RLS policies**: Defined in migrations (e.g., `fix_permissions_safe.sql`, `013_community_posts_likes_system.sql`)
- **Setting admin**: Use `supabase/migrations/set_admin.sql` to promote user via SQL

### Testing & Build
```bash
npm test                       # Jest + React Testing Library (jsdom env)
npm run build                  # Vite build → dist/
./deploy.sh                    # Runs tests, builds, optionally deploys to Vercel/Netlify
```

## File Organization & Conventions

### Component Structure
- **Pages** (`pages/`): Route components matching React Router paths in `app.jsx`
  - Admin pages: `pages/admin/AdminDashboard.jsx`, `ContentModeration.jsx`, etc.
- **Domain components** (`components/[domain]/`): `admin/`, `food/`, `user/`, `assistant/`, `profile/`
- **Layout** (`components/layout/`): `MainLayout.jsx` wraps pages, includes AI assistant + chat widget
- **Common** (`components/common/`): Reusable UI (`Header`, `Footer`, `ErrorBoundary`, `UserChatWidget`)

### Utility Organization
- **Services**: `utils/authService.js`, `dataService.js`, `utils/services/goodsService.js`
- **Stores**: `utils/stores/goodsStore.jsx` (Context providers with useReducer)
- **Hooks**: `utils/hooks/` (custom hooks for features)
- **Helpers**: `utils/helpers.js` exports `reportError()`, `formatDate()`, `timeAgo()`, `calculateDistance()`, etc.

### Configuration Hierarchy
1. `config/env.example` → Template for environment vars
2. `.env.local` → Local dev secrets (gitignored)
3. `utils/config.js` → Runtime config, reads from `window.__ENV__` or `import.meta.env`
4. `public/config.*.js` → Client-side config injection for deployments (loaded by `index.html`)

## Integration Points & External Dependencies

### Supabase Client Setup
- **Client**: `utils/supabaseClient.js` creates singleton with `autoRefreshToken: true`, `persistSession: true`
- **Environment vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (fallback to `process.env` for build scripts)
- **RLS enforcement**: All tables use Row Level Security; policies in migrations grant access based on `auth.uid()`
- **Storage buckets**: User avatars (`avatars`), food images (`food-images`) with public read policies

### DeepSeek API Integration
- **Config**: `utils/config.js` exports `API_CONFIG.DEEPSEEK` with key, endpoint, model, timeout, retries
- **Validation**: On init, checks if `DEEPSEEK_API_KEY` starts with `sk-` and isn't placeholder
- **Rate limiting**: Configured in `utils/aiAgent.js` (default: 50 req/min, premium: 100 req/min)
- **Fallback**: `utils/openaiClient.js` exists but DeepSeek is primary

### User Notifications
- **Library**: `react-toastify` (imported in select pages: `FindFoodPage.jsx`, `admin/AdminSettings.jsx`)
- **Usage**: `import { toast } from 'react-toastify'; toast.success('...')` or `toast.error('...')`
- **Pattern**: Use for user-facing success/error feedback (not console errors)

## Project-Specific Patterns & Conventions

### Error Handling Standard
```javascript
import { reportError } from './utils/helpers.js';

try {
  // risky operation
} catch (error) {
  reportError(error);  // Centralized error logging
  console.error('Context-specific message:', error);
}
```

### Data Fetching Pattern
1. Import service: `import authService from './utils/authService.js'`
2. Use async/await in component or hook
3. Manage loading state via Context or local state
4. Catch and report errors with `reportError()`

### Styling Approach
- **Tailwind utility classes**: Primary styling method
- **Custom components**: `styles/components.css` for reusable patterns (glassmorphism: `bg-white/80 backdrop-blur-md`)
- **Theme**: Green palette (`green-50`, `green-500`, `green-600`), gradients (`from-green-50 via-white to-green-100`)
- **Responsive**: Mobile-first breakpoints (`md:`, `lg:`)

### Admin Privilege Checks
- **Database**: `users.is_admin` boolean column
- **Component**: Render admin UI only when `const { isAdmin } = useAuthContext(); if (isAdmin) { ... }`
- **Route**: Wrap in `<AdminRoute>...</AdminRoute>` to enforce navigation guard

## Environment & Deployment Notes

### Development vs Production
- **Mode detection**: `import.meta.env.MODE` returns `'development'` or `'production'`
- **Supabase**: Local instance via `supabase start` or remote project URL
- **AI API keys**: Log warnings when missing; features gracefully disable

### Testing Configuration
- **Framework**: Jest 29 + React Testing Library + jsdom
- **Config**: `jest.config.js` with `testEnvironment: 'jsdom'`, `setupFilesAfterEnv: ['<rootDir>/tests/setup.js']`
- **Test location**: `tests/` directory (e.g., `AIAssistant.test.js`, `MatchingEngine.test.js`)

### Deployment Targets
- **Build output**: `npm run build` → `dist/` (Vite bundle)
- **Docker**: Multi-stage `Dockerfile` with Nginx for production serving
- **Static hosts**: Vercel/Netlify compatible via `netlify.toml` and history API fallback
- **Env injection**: Production reads config from `public/config.production.js` loaded in `index.html`