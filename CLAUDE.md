# UKSF Web Frontend

## Quick Start

```bash
bun install           # Install dependencies
bun start             # Development server (localhost:4200)
npx ng build          # Production build
npx ng lint           # Lint check
bun test              # Run unit tests (Vitest)
bun test:e2e          # Run E2E tests (Playwright)
```

## Architecture

- **Framework:** Angular 14 with Angular Material and PrimeNG
- **Structure:** Feature-based folder organization (transitioning from centralized)
- **State:** Services with RxJS observables
- **Auth:** JWT tokens via `@auth0/angular-jwt`
- **Real-time:** SignalR for live updates

## File Organization

### Structure (Feature-Based)

```
src/app/
  features/
    {feature}/
      index.ts                    # Barrel exports
      {feature}.module.ts         # Lazy-loaded NgModule
      {feature}-routing.module.ts # Feature routes with permissions
      components/                 # Feature components
      services/                   # Feature-specific services
      models/                     # Feature-specific interfaces
      modals/                     # Feature-specific dialogs
  shared/
    shared.module.ts              # Reusable components/pipes/directives
    components/
    pipes/
    directives/
  core/                           # Singleton services, guards, interceptors
```

### Shared Module

`src/app/shared/` contains reusable primitives used across features:
- **Components:** flex-filler, loading-placeholder, button-pending, content areas, etc.
- **Pipes:** displayName, time, country, AnsiToHtml
- **Directives:** character-block, dropdown-validator, must-match

Import via: `import { SharedModule } from '@shared/shared.module';`

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | kebab-case | `loading-placeholder.component.ts` |
| Services | camelCase prefix | `modpack.service.ts` |
| Models | PascalCase | `ModpackRelease.ts` |
| SCSS classes | kebab-case | `.mod-card`, `.button-wrapper` |
| Feature modules | kebab-case | `modpack.module.ts` |

## Styling

### Variables

Import: `@use 'styles/variables' as v;`

**Spacing (self-describing names):**
- `v.$spacing-4px` through `v.$spacing-40px`

**Layout breakpoints:**
```scss
@include v.below(v.$layout-medium) {
  // Styles for 768px and below
}
```

Breakpoints are for layout shifts (sidebar → top), not device targeting.
Custom breakpoints are OK when documented.

### Theme System

The app uses Angular Material theming with custom palettes:
- `src/darkTheme.scss` - Dark theme (active)
- `src/lightTheme.scss` - Light theme (available)
- `src/palettes.scss` - Custom color palettes

**Rules:**
- Never hardcode colors - use theme palette functions
- `::ng-deep` is deprecated but has no replacement - use sparingly
- Document any custom breakpoint values with comments

### SCSS Component Themes

Components with theming support have a `*.scss-theme.scss` file alongside their `*.scss` file. These are imported in `styles.scss` and included in the theme mixin.

## Component Patterns

### Subscribe Pattern (Modern)

```typescript
// OLD - Don't use
this.service.getData().subscribe(data => { ... });

// NEW - Use observer object
this.service.getData().subscribe({
  next: (data) => { ... },
  error: (err) => { ... },
  complete: () => { ... }
});
```

### Subscription Cleanup

```typescript
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.data$
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => { ... }
    });
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### Modal Pattern

Return data via `dialogRef.close(result)`, not EventEmitters.
Caller subscribes to `afterClosed()`.

```typescript
// Opening a modal
const dialogRef = this.dialog.open(MyModalComponent, { data: myData });
dialogRef.afterClosed().subscribe({
  next: (result) => {
    if (result) { /* handle result */ }
  }
});

// Inside modal
this.dialogRef.close(resultData);
```

### Forms

Prefer typed `FormBuilder` over `UntypedFormBuilder` for new code.
Migration of existing `UntypedForm*` is optional - some complexity requires untyped forms.

```typescript
// Typed form (preferred for new code)
form = this.fb.group({
  name: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]]
});
```

## Routing & Permissions

**CRITICAL:** All routes with permissions must use NgxPermissionsGuard:

```typescript
{
  path: 'admin',
  loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
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

When migrating features, copy permission configurations exactly from `app-routing.module.ts`.

### Permission Levels

Defined in `Services/permissions.ts`:
- `UNLOGGED` - Not authenticated
- `UNCONFIRMED` - Authenticated but email not confirmed
- `MEMBER` - Confirmed member
- `RECRUITER` - Can manage recruitment
- `COMMAND` - Command staff
- `ADMIN` - Full admin access
- `SERVERS` - Server management
- `DISCHARGES` - Discharge management

## Testing

### Unit Tests (Vitest)

Location: `*.spec.ts` files alongside source files

```bash
bun test              # Run once
bun test:watch        # Watch mode
```

Test pure functions in Services and Pipes.

### E2E Tests (Playwright)

Location: `e2e/` directory

```bash
bun test:e2e                      # Run all E2E tests
bun test:e2e:ui                   # Playwright UI mode
bun test:e2e:update-snapshots     # Update visual baselines
```

**Test credentials:** Stored in `.env.test` (gitignored). Create manually:
```env
TEST_EMAIL=your-test-email
TEST_PASSWORD=your-test-password
```

## API Communication

### HTTP Services

Use `HttpClient` with the base URL from `UrlService`:

```typescript
constructor(private http: HttpClient, private urls: UrlService) {}

getData() {
  return this.http.get(`${this.urls.apiUrl}/endpoint`);
}
```

### SignalR

Real-time updates via `SignalRService`:

```typescript
constructor(private signalr: SignalRService) {}

ngOnInit() {
  this.signalr.hub('modpack').on('BuildUpdated', (build) => {
    // Handle update
  });
}
```

## Path Aliases

Configured in `tsconfig.json`:

```typescript
import { Something } from '@app/Services/something.service';
import { SharedModule } from '@shared/shared.module';
import { environment } from '@env/environment';
```

## Build Configuration

- Development: `npx ng serve` or `bun start`
- Production: `npx ng build --configuration production`

Production builds include:
- Tree shaking and minification
- AOT compilation
- Source maps disabled
- License extraction
