// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
    {
        files: ['**/*.ts'],
        extends: [eslint.configs.recommended, tseslint.configs.recommended, tseslint.configs.stylistic, angular.configs.tsRecommended],
        processor: angular.processInlineTemplates,
        rules: {
            '@angular-eslint/directive-selector': [
                'error',
                {
                    type: 'attribute',
                    prefix: 'app',
                    style: 'camelCase'
                }
            ],
            '@angular-eslint/component-selector': [
                'error',
                {
                    type: 'element',
                    prefix: 'app',
                    style: 'kebab-case'
                }
            ],
            // Project uses aliased @Input() decorators extensively
            '@angular-eslint/no-input-rename': 'off',
            // Explicit type annotations on initialized properties improve readability
            '@typescript-eslint/no-inferrable-types': 'off',
            // Empty constructors, lifecycle hooks, and arrow functions are standard Angular patterns
            '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors', 'methods', 'arrowFunctions'] }],
            // Angular empty lifecycle methods are handled by angular-eslint, not this rule
            '@angular-eslint/no-empty-lifecycle-method': 'warn',
            // Allow _ as unused parameter name (throwaway variable convention)
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            // Warn on any but don't error - project has justified uses documented in CLAUDE.md
            '@typescript-eslint/no-explicit-any': 'warn'
        }
    },
    {
        files: ['**/*.html'],
        extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
        rules: {
            // Template == is used for null coalescing comparisons
            '@angular-eslint/template/eqeqeq': ['error', { allowNullOrUndefined: true }],
            // Accessibility: warn instead of error for interactive elements (incremental adoption)
            '@angular-eslint/template/click-events-have-key-events': 'warn',
            '@angular-eslint/template/interactive-supports-focus': 'warn'
        }
    },
    {
        files: ['**/*.spec.ts'],
        rules: {
            // Tests commonly use any for mocking
            '@typescript-eslint/no-explicit-any': 'off'
        }
    }
]);
