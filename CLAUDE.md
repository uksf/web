# UKSF Web Frontend

## Quick Start

```bash
bun install           # Install dependencies
bun start             # Development server (localhost:4200)
ng build              # Production build (use ./node_modules/.bin/ng or npx)
ng lint               # Lint check (ESLint via angular-eslint)
bun run test          # Run unit tests (Vitest)
bun run test:e2e      # Run E2E tests (Playwright)
```

## Architecture

- **Framework:** Angular 21 (standalone components, `@if`/`@for` control flow, `inject()` function)
- **Build:** `@angular/build:application` builder
- **Structure:** Feature-based folder organization with standalone components
- **State:** Services with RxJS observables
- **Auth:** JWT tokens via `@auth0/angular-jwt`, functional HTTP interceptor
- **Real-time:** SignalR for live updates
- **Styling:** Angular Material + PrimeNG (org charts only), SCSS with theme system

## File Organization

### Structure (Feature-Based, Standalone)

```
src/app/
  app.config.ts               # Application providers (replaces AppModule)
  app.routes.ts               # Root route configuration
  login-redirect.ts           # NgxPermissionsGuard redirect helper
  features/
    {feature}/
      index.ts                # Barrel exports
      {feature}.routes.ts     # Lazy-loaded route array (exported as FEATURE_ROUTES)
      components/             # Feature components (standalone)
      services/               # Feature-specific services
      models/                 # Feature-specific interfaces
      modals/                 # Feature-specific dialogs
  shared/
    shared.module.ts          # NgModule wrapper (Storybook only)
    components/               # Reusable standalone components
    pipes/                    # Standalone pipes
    directives/               # Standalone directives
    modals/                   # Shared dialog components
    services/                 # Shared services
  core/                       # Singleton services, interceptors
```

### Key Patterns

- **All components, pipes, and directives are standalone** (Angular 21 default)
- Components declare their own `imports` in `@Component({ imports: [...] })`
- No NgModules for feature routing — use plain `Routes` arrays
- `SharedModule` exists only for Storybook story compatibility

## Component Patterns

### Dependency Injection

Use `inject()` function instead of constructor injection:

```typescript
// Standard pattern
export class MyComponent {
    private http = inject(HttpClient);
    private urls = inject(UrlService);
}
```

### Control Flow

Use built-in control flow (not `*ngIf`/`*ngFor`):

```typescript
// Template
@if (isLoading) {
    <app-loading-placeholder>
} @else {
    @for (item of items; track item.id) {
        <div>{{ item.name }}</div>
    }
}
```

### Subscribe Pattern

```typescript
// Use observer object
this.service.getData().subscribe({
    next: (data) => { ... },
    error: (err) => { ... }
});
```

### Subscription Cleanup

```typescript
// Extend DestroyableComponent for ongoing subscriptions
export class MyComponent extends DestroyableComponent {
    ngOnInit() {
        this.service.data$
            .pipe(takeUntil(this.destroy$))
            .subscribe({ next: (data) => { ... } });
    }
}

// Use first() for one-shot observables (HTTP, afterClosed)
this.http.get(url).pipe(first()).subscribe({ next: (data) => { ... } });
```

- **One-shot observables** (HTTP, `afterClosed()`): use `pipe(first())` — no destroy$ needed
- **Ongoing observables** (route params, `valueChanges`, Subject subscriptions): use `pipe(takeUntil(this.destroy$))` via `extends DestroyableComponent`
- `DestroyableComponent` base class is in `shared/components/destroyable/`

### Modal Pattern

Return data via `dialogRef.close(result)`, not EventEmitters.
Caller subscribes to `afterClosed()`.

### Forms

Prefer typed `FormBuilder` over `UntypedFormBuilder`. Initialize at property declaration for type inference:

```typescript
form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
});
```

### Form Debug Components

All forms include debug components that display form values when `debugForms` app setting is enabled:
- **Reactive forms:** `<app-form-value-debug-reactive [form]="formGroup">` before `</form>`
- **Template-driven forms:** `<app-form-value-debug-template>` before `</form>` (injects NgForm automatically)
- Import from `@app/shared/components/elements/form-value-debug/form-value-debug.component`

## Routing & Permissions

All routes with permissions use `NgxPermissionsGuard`. Routes are configured in `app.routes.ts` with lazy-loaded feature routes:

```typescript
{
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [NgxPermissionsGuard],
    data: {
        permissions: {
            only: Permissions.ADMIN,
            except: Permissions.UNLOGGED,
            redirectTo: {
                ADMIN: '/home',
                UNLOGGED: loginRedirect,
                default: '/home'
            }
        }
    }
}
```

### Permission Levels

Defined in `core/services/permissions.ts`:
- `UNLOGGED` - Not authenticated
- `UNCONFIRMED` - Authenticated but email not confirmed
- `MEMBER` - Confirmed member
- `RECRUITER` - Can manage recruitment
- `COMMAND` - Command staff
- `ADMIN` - Full admin access
- `SERVERS` - Server management
- `DISCHARGES` - Discharge management

## HTTP Services

Extracted services handle all HTTP communication. Components should NOT inject `HttpClient` directly:

```typescript
// Service pattern
@Injectable({ providedIn: 'root' })  // or feature-scoped
export class GameServersService {
    private http = inject(HttpClient);
    private urls = inject(UrlService);

    getServers() {
        return this.http.get<GameServer[]>(`${this.urls.apiUrl}/gameservers`);
    }
}
```

### Auth Interceptor

Functional interceptor in `core/services/authentication/auth-http-interceptor.ts`:
- 401 → stores redirect URL, revokes session, navigates to login
- 403 → shows permission denied message modal
- Status 0 → wraps as `UksfError` with network error message

### SignalR

Real-time updates via `SignalRService`:

```typescript
private signalrService = inject(SignalRService);

ngOnInit() {
    this.hubConnection = this.signalrService.connect(`notifications?userId=${id}`);
    this.hubConnection.connection.on('ReceiveNotification', this.onReceive);
}
```

## Styling

### Variables

Import: `@use 'styles/variables' as v;`

**Spacing:** `v.$spacing-4px` through `v.$spacing-40px`

**Layout breakpoints:**
```scss
@include v.below(v.$layout-medium) {
    // Styles for 768px and below
}
```

### Theme System

Angular Material theming with custom palettes:
- `src/darkTheme.scss` - Dark theme (active)
- `src/lightTheme.scss` - Light theme (available)
- `src/palettes.scss` - Custom color palettes

**Rules:**
- Never hardcode colors - use theme palette functions
- `::ng-deep` is deprecated but has no replacement - use sparingly for third-party components
- Components with theming support have a `*.scss-theme.scss` file imported in `styles.scss`

### Shared Form Field Styles

`src/styles/_form-field.scss` (structural) and `src/styles/_form-field-theme.scss` (parameterized theme) provide shared SCSS mixins for custom form controls (text-input, dropdown, selection-list).

## Testing

### Unit Tests (Vitest)

```bash
bun run test          # Run once
bun run test:watch    # Watch mode
```

**IMPORTANT:** Use `bun run test` NOT `bun test`. `bun test` invokes bun's built-in test runner which picks up e2e files and fails.

### Storybook Visual Regression

```bash
bun run storybook                 # Dev server (port 6006)
bun run build-storybook           # Build static
bun run test:storybook            # Run visual regression tests
bun run test:storybook -- --update-snapshots  # Regenerate baselines
```

Stories mount real components via `Meta.component`. Shared mock utilities in `.storybook/utils/mock-providers.ts`. Spec files contain ONLY `toHaveScreenshot()` visual regression tests.

**Note:** Storybook builder `styles` option REPLACES build target styles, does NOT append.

### E2E Tests (Playwright)

```bash
bun run test:e2e                  # Run all E2E tests
bun run test:e2e:ui               # Playwright UI mode
```

### Test Safety

**CRITICAL: Tests run on a CI agent that shares the live production environment.** Unit tests (Vitest) run in Node.js — they have no browser and must not interact with any real services.

**All external dependencies MUST be mocked in unit tests.**

- Mock all service methods that return Observables — never let `HttpClient` make real requests
- Mock `SignalRService` and all hub connections — **never establish real WebSocket connections**
- Mock `window`, `document`, `localStorage`, `sessionStorage` — unit tests run in Node.js
- Mock `File`, `FileReader`, `FormData` for upload-related tests
- Use `vi.useFakeTimers()` for setTimeout/setInterval-dependent code
- **Never call real `postMessage`** — on the production box this could interact with other running processes

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `loading-placeholder.component.ts` |
| Services | camelCase prefix | `modpack.service.ts` |
| Models | PascalCase | `ModpackRelease.ts` |
| SCSS classes | kebab-case | `.mod-card`, `.button-wrapper` |
| Route files | kebab-case | `modpack.routes.ts` |

## Path Aliases

Configured in `tsconfig.json`:

```typescript
import { Something } from '@app/core/services/something.service';
import { SharedComponent } from '@app/shared/components/shared.component';
```

## Build Configuration

- **Builder:** `@angular/build:application`
- **Development:** `ng serve` or `bun start`
- **Production:** `ng build --configuration production`
- **Linting:** `ng lint` (angular-eslint)
- PrimeNG CSS bundled locally via `angular.json` styles array
- Bootstrap replaced with `src/styles/_bootstrap-reset.scss` (extracted element-level resets)
