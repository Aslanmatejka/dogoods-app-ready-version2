# DoGoods App - AI Coding Agent Instructions

## Project Overview
A React-based community food sharing platform with Supabase backend, AI-powered matching, and admin management features. Built with Vite, Tailwind CSS, and modern React patterns.

## Core Architecture Patterns

### Authentication & Authorization
- **Context-based auth**: `utils/AuthContext.jsx` provides `useAuthContext()` hook
- **Service layer**: `utils/authService.js` handles Supabase auth with localStorage persistence
- **Admin routes**: Use `AdminRoute` wrapper component, checks `isAdmin` flag from user profile
- **Protected routes**: Use inline `ProtectedRoute` wrapper in `app.jsx`

### State Management
- **Context + useReducer**: See `utils/stores/goodsStore.jsx` for goods state management pattern
- **Custom hooks**: Auth, goods, and other domain-specific hooks in `utils/hooks/`
- **Service layer**: Business logic separated into `utils/services/` and standalone service files

### AI Integration
- **Matching Engine**: `utils/MatchingEngine.js` - AI-powered food matching with DeepSeek integration
- **Circuit breaker**: Built-in failure handling for AI API calls
- **Rate limiting**: Configurable limits per client in `utils/aiAgent.js`
- **Assistant**: Floating AI chat widget via `components/assistant/AIAssistant`

## Development Workflows

### Environment Setup
```bash
cp config/env.example .env.local
npm run dev                    # Start dev server on :3001
npm run supabase:start        # Local Supabase (optional)
npm run dev:local             # Both together
```

### Database Operations
```bash
npm run supabase:reset        # Reset local DB with migrations
npm run supabase:studio       # Open Supabase Studio
```

### Testing & Build
```bash
npm test                      # Jest with jsdom
npm run build                 # Vite build
./deploy.sh                   # Full CI pipeline
```

## File Organization Conventions

### Component Structure
- `pages/` - Route components, direct mapping to React Router routes
- `components/[domain]/` - Feature-specific components (admin, food, user, etc.)
- `components/layout/` - Layout wrappers (`MainLayout` with AI assistant integration)
- `components/common/` - Shared UI components

### Utility Organization
- `utils/[serviceName].js` - Single-responsibility services (authService, dataService)
- `utils/stores/` - Context-based state management
- `utils/hooks/` - Custom React hooks
- `utils/services/` - Domain business logic

### Configuration
- `config/env.*` - Environment-specific configs
- `utils/config.js` - Centralized config with environment handling
- `public/config.*.js` - Client-side config injection

## Key Integration Points

### Supabase Integration
- Client: `utils/supabaseClient.js` with auto-refresh and realtime config
- RLS policies: Migrations in `supabase/migrations/` handle permissions
- Storage: User avatars and food images with bucket policies

### AI Services
- **Primary**: DeepSeek API for matching and chat
- **Fallback**: OpenAI client in `utils/openaiClient.js`
- **Configuration**: API keys via environment, graceful degradation when missing

### Admin System
- Role-based: `is_admin` column in users table
- Route protection: `AdminRoute` component
- Comprehensive dashboard: `pages/admin/` with moderation, reports, and settings

## Common Patterns

### Error Handling
```javascript
import { reportError } from './utils/helpers.js';
// Use reportError() for consistent error logging
```

### Data Fetching
- Service layer pattern: Import specific service, use async/await
- Loading states: Context-based loading flags in stores
- Error boundaries: `ErrorBoundary` component for React error catching

### Styling
- Tailwind CSS with custom component classes in `styles/components.css`
- Consistent design: Green theme, glassmorphism effects via backdrop-blur
- Responsive: Mobile-first approach

## Development Notes

### Local vs Production
- Environment detection via `import.meta.env.MODE`
- Supabase: Can run local instance or connect to remote project
- AI APIs: Graceful degradation when keys missing in development

### Testing Strategy
- Jest + React Testing Library setup in `jest.config.js`
- Test files in `tests/` directory
- Component-specific test patterns in `tests/setup.js`

### Deployment
- Multi-stage Docker build with Nginx
- Static hosting ready (Vercel, Netlify compatible)
- Environment variables injected via `public/config.*.js` pattern