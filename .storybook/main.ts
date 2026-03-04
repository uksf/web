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
        // On Windows, process.cwd() can return a path with different casing than
        // the actual filesystem directory (e.g., "uksf" vs "UKSF"). Vite resolves
        // paths using the real filesystem casing, while the Angular plugin's
        // TypeScript compiler resolves paths relative to cwd (lowercase). This
        // causes a case-sensitive Map lookup miss in the plugin's fileEmitter.
        // Fix: normalize the Vite id to match the cwd-based casing that
        // TypeScript will use when storing compiled output.
        if (process.platform === 'win32') {
            const angularPlugin = (viteConfig.plugins ?? []).flat().find(
                (p): p is Plugin => !!(p && typeof p === 'object' && 'name' in p && p.name === '@analogjs/vite-plugin-angular')
            );
            if (angularPlugin?.transform) {
                const cwd = process.cwd().replace(/\\/g, '/');
                const cwdLower = cwd.toLowerCase();
                console.log('[storybook-debug] cwd:', cwd);
                const originalHandler = typeof angularPlugin.transform === 'function'
                    ? angularPlugin.transform
                    : angularPlugin.transform.handler;
                const patchedHandler = async function (this: any, code: string, id: string) {
                    const originalId = id;
                    const idLowerPrefix = id.substring(0, cwd.length).toLowerCase();
                    if (idLowerPrefix === cwdLower) {
                        id = cwd + id.substring(cwd.length);
                    }
                    const result = await originalHandler.call(this, code, id);
                    if (id.includes('preview') || id.includes('.stories.')) {
                        const output = typeof result === 'string' ? result : result?.code;
                        console.log(`[storybook-debug] transform ${id} (was ${originalId}) => output length: ${output?.length ?? 'null'}, first 200: ${output?.substring(0, 200)}`);
                    }
                    return result;
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
