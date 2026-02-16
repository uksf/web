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
    .progress-container-wrapper {
        display: flex; flex-direction: row; margin: 5px 0;
        text-align: center; word-break: break-word;
    }
    .progress-container {
        width: 100%; display: flex; flex-direction: row;
        height: 50px; margin: 5px 0;
    }
    .progress-container:last-child { margin-left: 10px; }
    .box {
        width: 100px; flex: 1; margin-right: 10px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 4px; cursor: default; padding: 5px;
        background-color: #424242; color: white;
    }
    .box:last-child { margin-right: 0; }
    .enabled { background-color: #7b1fa2 !important; color: white !important; }
    .complete { background-color: #616161 !important; }
    a { color: #7b1fa2; }
    @media screen and (max-width: 800px) {
        .progress-container-wrapper { flex-direction: column; }
        .progress-container:last-child { margin-left: 0; }
    }
    @media screen and (max-width: 450px) {
        .progress-container-wrapper { font-size: 12px; }
    }`
];

function renderProgressBar(step: number) {
    return `
        <mat-card>
            <h2>Application to join UKSF</h2>
            <p>You may edit the 'Details' part of your application after submitting</p>
            <p>If you require help, contact an SR1 (Red 'R' tag) on our <a href="#">TeamSpeak (uk-sf.co.uk)</a></p>
            <p>Or you can talk with us in the 'newcomers' channel on our <a href="#">Discord</a></p>
        </mat-card>
        <div class="progress-container-wrapper">
            <div class="progress-container">
                <div class="box ${step === 1 ? 'enabled' : step > 1 ? 'complete' : ''}"><span>Information</span></div>
                <div class="box ${step === 2 ? 'enabled' : step > 2 ? 'complete' : ''}"><span>Identity</span></div>
                <div class="box ${step === 3 ? 'enabled' : step > 3 ? 'complete' : ''}"><span>Email Confirmation</span></div>
            </div>
            <div class="progress-container">
                <div class="box ${step === 4 ? 'enabled' : step > 4 ? 'complete' : ''}"><span>Communications</span></div>
                <div class="box ${step === 5 ? 'enabled' : step > 5 ? 'complete' : ''}"><span>Details</span></div>
                <div class="box ${step === 6 ? 'enabled' : ''}"><span>Submit</span></div>
            </div>
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

export const Step6Submit: Story = {
    render: () => ({ styles, template: renderProgressBar(6) })
};
