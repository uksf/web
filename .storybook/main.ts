import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|mdx)'],
    addons: ['@storybook/addon-docs', '@storybook/addon-webpack5-compiler-swc'],
    staticDirs: [{ from: '../src/assets', to: '/assets' }],
    framework: '@storybook/angular'
};
export default config;
