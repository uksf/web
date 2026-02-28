import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { beforeEach } from 'vitest';

// Provide minimal DOM polyfill for Angular's platform factory (tests run in Node without jsdom)
if (typeof globalThis.document === 'undefined') {
    (globalThis as any).document = {
        createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {} }),
        createComment: () => ({}),
        querySelector: () => null,
        querySelectorAll: () => [],
        body: { appendChild: () => {}, removeChild: () => {} },
        head: { appendChild: () => {}, querySelector: () => null },
        documentElement: { setAttribute: () => {} },
        createTextNode: () => ({}),
        addEventListener: () => {},
        removeEventListener: () => {},
        createDocumentFragment: () => ({ appendChild: () => {} }),
        implementation: { createHTMLDocument: () => (globalThis as any).document },
    };
}

TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false },
});

beforeEach(() => {
    TestBed.resetTestingModule();
});
