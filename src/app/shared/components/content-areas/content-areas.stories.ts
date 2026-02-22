import type { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
    title: 'Shared/ContentAreas'
};
export default meta;

type Story = StoryObj;

export const DefaultLayout: Story = {
    render: () => ({
        template: `
            <app-default-content-areas style="width: 100%;">
                <app-main-content-area>
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 4px; min-height: 200px;">
                        <h3 style="margin: 0 0 8px;">Main Content Area</h3>
                        <p style="margin: 0; opacity: 0.7;">This is the primary content area, taking up the larger portion of the grid layout.</p>
                    </div>
                </app-main-content-area>
                <app-side-content-area>
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 4px; min-height: 200px;">
                        <h3 style="margin: 0 0 8px;">Side Content Area</h3>
                        <p style="margin: 0; opacity: 0.7;">This is the sidebar area, taking up the smaller portion.</p>
                    </div>
                </app-side-content-area>
            </app-default-content-areas>
        `
    })
};

export const WithFullContentArea: Story = {
    render: () => ({
        template: `
            <div style="display: grid; grid-template-columns: 1fr 0.45fr; grid-template-rows: auto auto; gap: 0; width: 100%;">
                <app-main-content-area>
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 4px; min-height: 150px;">
                        <h3 style="margin: 0 0 8px;">Main Content</h3>
                        <p style="margin: 0; opacity: 0.7;">Primary content area</p>
                    </div>
                </app-main-content-area>
                <app-side-content-area>
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 4px; min-height: 150px;">
                        <h3 style="margin: 0 0 8px;">Side Content</h3>
                        <p style="margin: 0; opacity: 0.7;">Sidebar area</p>
                    </div>
                </app-side-content-area>
                <app-full-content-area>
                    <div style="background: rgba(255,255,255,0.08); padding: 20px; border-radius: 4px; margin-top: 16px;">
                        <h3 style="margin: 0 0 8px;">Full Width Content Area</h3>
                        <p style="margin: 0; opacity: 0.7;">This spans the full width below both main and side areas.</p>
                    </div>
                </app-full-content-area>
            </div>
        `
    })
};
