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

## Layout & Spacing

**Single source of truth for page structure.** Every routed page wraps in `<app-default-content-areas>` + exactly one content-area shell. Shells own the 16px edge padding — pages never set their own outer padding.

### Shells (own the padding)

```
<app-default-content-areas>     <!-- 2-column grid (collapses < 768px) -->
  <app-main-content-area>       <!-- grid-area: main; padding: 16px -->
  <app-side-content-area>       <!-- grid-area: side; padding: 16px -->
  <app-full-content-area>       <!-- full-width row 2; padding: 16px -->
</app-default-content-areas>
```

Located in `src/app/shared/components/content-areas/`. Pick `main`+`side` for two-column layouts, `full` for single column spanning full width.

### Rules (hard)

- **Never set `:host { padding }` or `.flex-container { padding: 0 16px 16px }` on a page component** — the shell owns it. Adding page-level padding creates double-padding bugs.
- **Spacing between sibling elements → `gap`** on a flex/grid parent. Never cascading `margin-bottom` down a list (bloats the last item's gap before the shell bottom).
- **Card lists inside `mat-accordion`**: style the accordion:
  ```scss
  mat-accordion {
      display: flex;
      flex-direction: column;
      gap: 5px;
  }
  ```
  Don't put `margin-bottom` on `.mat-mdc-card` or custom card components (like `<app-command-member-card>`). Accordion gap owns card spacing.
- **Custom card components** — never set margin on the component's root. Let the parent's gap own inter-item spacing.

### Tab-nav pages (admin / command / personnel / operations / modpack / units)

The route parent component owns the nav bar. Child routes render bare content inside `<mat-tab-nav-panel>`. Required scss pattern:

```scss
:host {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
}

.nav-bar {
    flex: 0 0 auto;
    padding: 0;
    position: relative;
    z-index: 1;
    box-shadow: 0 0 5px 0 #000;
}

mat-tab-nav-panel {
    display: block;
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
}
```

- Drop shadow on the nav bar
- Scroll is isolated to `mat-tab-nav-panel` — tabs stay fixed, body scrolls
- Child routes must not re-render `<app-*-page>` or the nav bar

### Full-height pages (kanban boards, dashboards)

When content must fill remaining viewport height (e.g. board columns), add a scoped chain override in the page component:

```scss
:host {
    display: flex;
    flex: 1;
    min-height: 0;

    ::ng-deep {
        app-default-content-areas {
            flex: 1;
            min-height: 0;
            grid-template-rows: auto 1fr;
        }

        app-full-content-area {
            display: flex;
            flex-direction: column;
            min-height: 0;
        }
    }
}
```

The shells stay pure (content-sized `auto` rows by default). Fill-height behaviour is opt-in per page.

### Checklist for a new page

- [ ] Root of template is `<app-default-content-areas>` + shell
- [ ] No `:host { padding }` or outer `.flex-container { padding }` on the page scss
- [ ] Siblings spaced via `gap` on their flex/grid parent
- [ ] Card lists use `mat-accordion { gap }`, no `margin-bottom` on cards
- [ ] Tab-nav pages follow the 3-block pattern above
- [ ] Don't add `padding-top: 16px` "to match the top" — the shell already has it

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

Single dark theme. No multi-theme scaffolding — one `.uksf-theme` class applied to the app root wrapper and CDK overlay container (in `app.component.ts`). Inside that scope we emit:
- `--mat-sys-*` via `mat.theme()` (M3 system tokens, overridden to match M2 look)
- `--uksf-*` via `custom-vars.uksf-theme-custom-vars()` (custom backgrounds, scrollbar, org chart, etc)
- All Material token / shape / typography overrides
- Global form-field theming for `app-text-input`, `app-dropdown`, `app-selection-list`, `app-date-input`

Everything else lives in `styles.scss` at module scope (MDC overrides, modal layout, scrollbar sizing, spotlight effect, drag previews).

**Component-owned theming.** Each component owns its theme rules in its own `.component.scss`. No sibling `*.scss-theme.scss` files, no cross-component mixin plumbing. When a component needs colour helpers, import them directly:

```scss
@use 'styles/theme-helpers' as th;

.foo { color: th.primary(); }  // no-arg helpers: primary, warn, fg-base, fg-divider, fg-secondary-text, fg-hint-text, fg-disabled-text, primary-contrast, warn-contrast
```

**Rules:**
- Never hardcode colours — use `th.*()` helpers, `--mat-sys-*` tokens, or `--uksf-*` custom properties
- `::ng-deep` is deprecated but has no replacement — use sparingly for third-party components
- Prefer `gap` (on flex/grid containers) or `padding` over `margin` for spacing between elements — see **Layout & Spacing** section for the full page-structure ruleset

### Shared Form Field Styles

`src/styles/_form-field.scss` (structural) and `src/styles/_form-field-theme.scss` (parameterized theme mixin) provide shared SCSS for custom form controls. The theme mixin is invoked once per host selector inside `.uksf-theme` in `styles.scss`.

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
