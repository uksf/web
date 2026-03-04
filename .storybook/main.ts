import type { StorybookConfig } from '@analogjs/storybook-angular';
import type { Plugin } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const srcPath = resolve(currentDir, '../src');

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|mdx)'],
    addons: ['@storybook/addon-docs'],
    staticDirs: [{ from: '../src/assets', to: '/assets' }],
    framework: {
        name: '@analogjs/storybook-angular',
        options: {
            inlineStylesExtension: 'scss'
        }
    },
    viteFinal: async (viteConfig) => {
        viteConfig.resolve = viteConfig.resolve ?? {};
        viteConfig.resolve.alias = {
            ...(typeof viteConfig.resolve.alias === 'object' && !Array.isArray(viteConfig.resolve.alias) ? viteConfig.resolve.alias : {}),
            '@app': resolve(srcPath, 'app'),
            '@core': resolve(srcPath, 'app/core'),
            '@shared': resolve(srcPath, 'app/shared'),
            '@env': resolve(srcPath, 'environments')
        };

        // Fix Windows case-sensitivity bug in @analogjs/vite-plugin-angular.
        // On Windows, process.cwd() can return different casing than the
        // filesystem (e.g., "uksf" vs "UKSF"), causing case-sensitive Map
        // lookup misses in the plugin's fileEmitter.
        if (process.platform === 'win32') {
            const angularPlugin = (viteConfig.plugins ?? []).flat().find(
                (p): p is Plugin => !!(p && typeof p === 'object' && 'name' in p && p.name === '@analogjs/vite-plugin-angular')
            );
            if (angularPlugin?.transform) {
                const cwd = process.cwd().replace(/\\/g, '/');
                const cwdLower = cwd.toLowerCase();
                const originalHandler = typeof angularPlugin.transform === 'function'
                    ? angularPlugin.transform
                    : angularPlugin.transform.handler;
                const patchedHandler = function (this: any, code: string, id: string) {
                    const idLowerPrefix = id.substring(0, cwd.length).toLowerCase();
                    if (idLowerPrefix === cwdLower) {
                        id = cwd + id.substring(cwd.length);
                    }
                    return originalHandler.call(this, code, id);
                };
                if (typeof angularPlugin.transform === 'function') {
                    angularPlugin.transform = patchedHandler;
                } else {
                    angularPlugin.transform.handler = patchedHandler;
                }
            }
        }

        return viteConfig;
    }
};
export default config;
