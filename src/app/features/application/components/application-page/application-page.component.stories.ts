import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { MatCardModule } from '@angular/material/card';

const meta: Meta = {
    title: 'Application/ProgressBar',
    decorators: [moduleMetadata({ imports: [MatCardModule] })]
};
export default meta;
type Story = StoryObj;

const styles = [
    `.mat-mdc-card { h2 { margin-top: 0; } }
    .progress-container {
        display: flex; flex-direction: row;
        height: 50px; margin: 5px 0;
        text-align: center; word-break: break-word;
    }
    .box {
        flex: 1; margin-right: 10px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 4px; cursor: default; padding: 5px;
        background-color: #424242; color: white;
    }
    .box:last-child { margin-right: 0; }
    .enabled { background-color: #fec400 !important; color: white !important; }
    .complete { background-color: #202020 !important; }
    a { color: #fec400; }
    @media screen and (max-width: 450px) {
        .progress-container { font-size: 12px; }
    }`
];

function renderProgressBar(step: number) {
    return `
        <mat-card>
            <h2>Application to join UKSF</h2>
            <p>You can edit the Details section after submitting. If you need help, contact an SR1 (red R tag) on our <a href="#">TeamSpeak (uk-sf.co.uk)</a> or chat with us on <a href="#">Discord</a></p>
        </mat-card>
        <div class="progress-container">
            <div class="box ${step === 1 ? 'enabled' : step > 1 ? 'complete' : ''}"><span>Information</span></div>
            <div class="box ${step === 2 ? 'enabled' : step > 2 ? 'complete' : ''}"><span>Identity</span></div>
            <div class="box ${step === 3 ? 'enabled' : step > 3 ? 'complete' : ''}"><span>Email Confirmation</span></div>
            <div class="box ${step === 4 ? 'enabled' : step > 4 ? 'complete' : ''}"><span>Communications</span></div>
            <div class="box ${step === 5 ? 'enabled' : ''}"><span>Details</span></div>
        </div>
    `;
}

export const Step1Information: Story = {
    render: () => ({ styles, template: renderProgressBar(1) })
};

export const Step2Identity: Story = {
    render: () => ({ styles, template: renderProgressBar(2) })
};

export const Step3EmailConfirmation: Story = {
    render: () => ({ styles, template: renderProgressBar(3) })
};

export const Step4Communications: Story = {
    render: () => ({ styles, template: renderProgressBar(4) })
};

export const Step5Details: Story = {
    render: () => ({ styles, template: renderProgressBar(5) })
};
