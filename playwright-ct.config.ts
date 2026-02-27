import { defineConfig, devices } from '@sand4rt/experimental-ct-angular';

export default defineConfig({
    testDir: './ct',
    testMatch: '**/*.ct.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html', { outputFolder: 'playwright-report-ct' }]],
    use: {
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        ctTemplateDir: './ct',
        ctViteConfig: {
            resolve: {
                alias: {
                    '@app': 'src/app',
                    '@shared': 'src/app/shared',
                    '@core': 'src/app/core',
                    '@env': 'src/environments'
                }
            }
        }
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] }
        }
    ]
});
