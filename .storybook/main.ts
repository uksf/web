import type { StorybookConfig } from '@analogjs/storybook-angular';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|mdx)'],
    addons: ['@storybook/addon-docs'],
    staticDirs: [{ from: '../src/assets', to: '/assets' }],
    framework: {
        name: '@analogjs/storybook-angular',
        options: {}
    }
};
export default config;
