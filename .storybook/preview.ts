import type { Preview } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { SharedModule } from '../src/app/shared/shared.module';

const preview: Preview = {
    decorators: [
        applicationConfig({
            providers: [importProvidersFrom(BrowserAnimationsModule)]
        }),
        moduleMetadata({
            imports: [SharedModule]
        }),
        (story) => ({
            ...story(),
            template: `<div class="dark-theme mat-app-background" style="padding: 24px; min-height: 100px; color: white;">${story().template || '<story />'}</div>`,
        })
    ],
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        }
    }
};

export default preview;
