import { describe, it, expect } from 'vitest';
import { CharacterBlockDirective } from './character-block.directive';

describe('CharacterBlockDirective', () => {
    const directive = new CharacterBlockDirective();

    it('should allow alphanumeric characters', () => {
        expect(directive.onKeyPress({ key: 'a' })).toBe(true);
        expect(directive.onKeyPress({ key: 'Z' })).toBe(true);
        expect(directive.onKeyPress({ key: '5' })).toBe(true);
    });

    it('should allow spaces and hyphens', () => {
        expect(directive.onKeyPress({ key: ' ' })).toBe(true);
        expect(directive.onKeyPress({ key: '-' })).toBe(true);
    });

    it('should allow single quote and apostrophe', () => {
        expect(directive.onKeyPress({ key: "'" })).toBe(true);
    });

    it('should block special characters', () => {
        expect(directive.onKeyPress({ key: '!' })).toBe(false);
        expect(directive.onKeyPress({ key: '@' })).toBe(false);
        expect(directive.onKeyPress({ key: '#' })).toBe(false);
        expect(directive.onKeyPress({ key: '$' })).toBe(false);
        expect(directive.onKeyPress({ key: '%' })).toBe(false);
        expect(directive.onKeyPress({ key: '^' })).toBe(false);
        expect(directive.onKeyPress({ key: '&' })).toBe(false);
        expect(directive.onKeyPress({ key: '*' })).toBe(false);
    });

    it('should block brackets and braces', () => {
        expect(directive.onKeyPress({ key: '(' })).toBe(false);
        expect(directive.onKeyPress({ key: ')' })).toBe(false);
        expect(directive.onKeyPress({ key: '[' })).toBe(false);
        expect(directive.onKeyPress({ key: ']' })).toBe(false);
        expect(directive.onKeyPress({ key: '{' })).toBe(false);
        expect(directive.onKeyPress({ key: '}' })).toBe(false);
    });

    it('should block punctuation that is disallowed', () => {
        expect(directive.onKeyPress({ key: '`' })).toBe(false);
        expect(directive.onKeyPress({ key: '~' })).toBe(false);
        expect(directive.onKeyPress({ key: '\\' })).toBe(false);
        expect(directive.onKeyPress({ key: '|' })).toBe(false);
        expect(directive.onKeyPress({ key: ':' })).toBe(false);
        expect(directive.onKeyPress({ key: ';' })).toBe(false);
        expect(directive.onKeyPress({ key: '"' })).toBe(false);
        expect(directive.onKeyPress({ key: '<' })).toBe(false);
        expect(directive.onKeyPress({ key: '>' })).toBe(false);
        expect(directive.onKeyPress({ key: '?' })).toBe(false);
        expect(directive.onKeyPress({ key: ',' })).toBe(false);
        expect(directive.onKeyPress({ key: '.' })).toBe(false);
        expect(directive.onKeyPress({ key: '/' })).toBe(false);
    });
});
