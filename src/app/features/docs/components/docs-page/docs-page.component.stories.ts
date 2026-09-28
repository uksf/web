import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { DocsPageComponent } from './docs-page.component';
import { DocsService } from '../../services/docs.service';

const root = '000000000000000000000000';
const document = { id: 'doc-1', folder: 'folder-1', name: 'Operational Restructure', canWrite: true };
const folders = [
    { id: 'folder-1', parent: root, name: 'Sabre', documents: [document, { id: 'doc-2', folder: 'folder-1', name: 'Troop Structure' }], children: [] },
    { id: 'folder-2', parent: root, name: 'JSFAW', documents: [{ id: 'doc-3', folder: 'folder-2', name: 'IR Missile Tactics' }], children: [] }
];

const row = (id: string, cells: string[], bold = false) =>
    cells.flatMap((text, index) => [{ insert: text, ...(bold || index === 0 ? { attributes: { bold: true } } : {}) }, { insert: '\n', attributes: { table: id } }]);

const content = {
    ops: [
        { insert: '4. Baseline vs Advanced Skills', attributes: { color: '#ffff00' } },
        { insert: '\n', attributes: { header: 2 } },
        { insert: 'Everyone will be cross-trained to a ' },
        { insert: 'baseline standard', attributes: { bold: true } },
        { insert: ' across the three main capabilities. Advanced tasks remain specialist.' },
        { insert: '\n', attributes: { list: 'bullet' } },
        { insert: '\n' },
        ...row('row-0', ['Capability', 'Basic / Baseline', 'Advanced / Specialist'], true),
        ...row('row-1', ['Airborne', 'Air assault, HALO, Standard helicopter procedures', 'Eagle VCP, HAHO, Fast roping, Specialist insertion techniques']),
        ...row('row-2', ['Waterborne', 'Boat movement, Boat insertion / extraction', 'Diving, Beach reconnaissance, Maritime sabotage']),
        { insert: '\n' },
        { insert: '┌──────────┬────────────────────────────┐' },
        { insert: '\n', attributes: { 'code-block': 'plain' } },
        { insert: '│ Diagram  │ Preformatted text must not wrap │' },
        { insert: '\n', attributes: { 'code-block': 'plain' } },
        { insert: '└──────────┴────────────────────────────┘' },
        { insert: '\n', attributes: { 'code-block': 'plain' } }
    ]
};

const docsService = {
    getFolders: () => of(folders),
    getDocumentMetadata: () => of(document),
    getDocumentContent: () => of({ text: JSON.stringify(content), lastUpdated: new Date() })
};

function routeWith(queryParams: Record<string, string>) {
    return { queryParams: of(queryParams), snapshot: { queryParams } };
}

const meta: Meta<DocsPageComponent> = {
    title: 'Docs/Page',
    component: DocsPageComponent,
    decorators: [
        applicationConfig({
            providers: [
                provideAnimations(),
                { provide: DocsService, useValue: docsService },
                { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
                { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(undefined) }) } }
            ]
        })
    ],
    render: (args) => ({ props: args, template: '<div style="display: flex; height: 100vh"><app-docs-page></app-docs-page></div>' })
};
export default meta;
type Story = StoryObj<DocsPageComponent>;

export const WithDocument: Story = {
    decorators: [applicationConfig({ providers: [{ provide: ActivatedRoute, useValue: routeWith({ folder: 'folder-1', document: 'doc-1' }) }] })]
};

export const NoDocument: Story = {
    decorators: [applicationConfig({ providers: [{ provide: ActivatedRoute, useValue: routeWith({}) }] })]
};
