import type { Meta, StoryObj } from '@storybook/angular';
import { FileDropComponent } from './file-drop.component';

const meta: Meta<FileDropComponent> = {
    title: 'Shared/FileDrop',
    component: FileDropComponent
};
export default meta;

type Story = StoryObj<FileDropComponent>;

export const Default: Story = {
    render: (args) => ({
        props: args,
        template: `
            <app-file-drop [headertext]="headertext">
                <div style="border: 2px dashed rgba(255,255,255,0.3); padding: 40px; text-align: center; border-radius: 8px;">
                    <p style="margin: 0; color: rgba(255,255,255,0.7);">{{ headertext }}</p>
                </div>
            </app-file-drop>
        `
    }),
    args: {
        headertext: 'Drop files here'
    }
};

export const Disabled: Story = {
    render: (args) => ({
        props: args,
        template: `
            <app-file-drop [headertext]="headertext" [disableIf]="disableIf">
                <div style="border: 2px dashed rgba(255,255,255,0.15); padding: 40px; text-align: center; border-radius: 8px; opacity: 0.5;">
                    <p style="margin: 0; color: rgba(255,255,255,0.4);">{{ headertext }}</p>
                </div>
            </app-file-drop>
        `
    }),
    args: {
        headertext: 'File upload disabled',
        disableIf: true
    }
};

export const CustomContent: Story = {
    render: (args) => ({
        props: args,
        template: `
            <app-file-drop headertext="Upload mission file">
                <div style="border: 2px dashed rgba(255,255,255,0.3); padding: 60px 40px; text-align: center; border-radius: 8px;">
                    <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: rgba(255,255,255,0.5);">cloud_upload</mat-icon>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.7);">Drag & drop your .pbo file here</p>
                </div>
            </app-file-drop>
        `
    })
};
