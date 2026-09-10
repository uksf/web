import { defineConfig, devices } from '@playwright/test';

const chromePath = process.env.PLAYWRIGHT_CHROME_PATH;

export default defineConfig({
    testDir: './e2e-hierarchy',
    testMatch: '**/*.spec.ts',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: [['list']],
    use: {
        baseURL: 'http://127.0.0.1:4201',
        trace: 'off',
        screenshot: 'only-on-failure',
        serviceWorkers: 'block',
        storageState: { cookies: [], origins: [] },
        launchOptions: {
            ...(chromePath ? { executablePath: chromePath } : {}),
            args: ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check']
        }
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['Pixel 5'] } }
    ],
    webServer: {
        command: 'node e2e-hierarchy/static-server.mjs',
        url: 'http://127.0.0.1:4201',
        reuseExistingServer: false,
        timeout: 30000
    }
});
