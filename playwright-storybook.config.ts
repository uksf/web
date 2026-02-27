import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './src',
    testMatch: '**/*.stories.spec.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html', { outputFolder: 'playwright-report-storybook' }],
        ['junit', { outputFile: 'test-results/storybook-junit.xml' }]
    ],
    use: {
        baseURL: 'http://localhost:6007',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure'
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ],
    webServer: {
        command: 'bunx http-server storybook-static --port 6007 --silent',
        url: 'http://localhost:6007',
        reuseExistingServer: !process.env.CI,
        timeout: 30000
    },
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.01
        }
    }
});
