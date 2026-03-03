import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DateInputComponent } from './date-input.component';

const meta: Meta<DateInputComponent> = {
    title: 'Shared/DateInput',
    component: DateInputComponent,
    decorators: [
        moduleMetadata({
            imports: [ReactiveFormsModule],
            providers: [provideNativeDateAdapter()]
        })
    ]
};
export default meta;

type Story = StoryObj<DateInputComponent>;

export const Default: Story = {
    render: () => {
        const form = new FormGroup({ date: new FormControl<Date | null>(null) });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-date-input label="Date" formControlName="date"
                        [validationMessages]="[{ type: 'required', message: 'Date is required' }]">
                    </app-date-input>
                </form>
            `
        };
    }
};

export const Filled: Story = {
    render: () => {
        const form = new FormGroup({ date: new FormControl<Date | null>(new Date(2024, 2, 15)) });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-date-input label="Date" formControlName="date"></app-date-input>
                </form>
            `
        };
    }
};

export const NoLabel: Story = {
    render: () => {
        const form = new FormGroup({ date: new FormControl<Date | null>(null) });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-date-input formControlName="date"></app-date-input>
                </form>
            `
        };
    }
};

export const NoLabelFilled: Story = {
    render: () => {
        const form = new FormGroup({ date: new FormControl<Date | null>(new Date(2024, 2, 15)) });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-date-input formControlName="date"></app-date-input>
                </form>
            `
        };
    }
};

export const Disabled: Story = {
    render: () => {
        const form = new FormGroup({ date: new FormControl<Date | null>({ value: new Date(2024, 2, 15), disabled: true }) });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-date-input label="Date" formControlName="date"></app-date-input>
                </form>
            `
        };
    }
};

export const Required: Story = {
    render: () => {
        const form = new FormGroup({ date: new FormControl<Date | null>(null, Validators.required) });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-date-input label="Date" [required]="true" formControlName="date"
                        [validationMessages]="[{ type: 'required', message: 'Date is required' }]">
                    </app-date-input>
                </form>
            `
        };
    }
};

export const ErrorState: Story = {
    render: () => {
        const form = new FormGroup({ date: new FormControl<Date | null>(null, Validators.required) });
        form.get('date').markAsTouched();
        form.get('date').markAsDirty();
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-date-input label="Date" [required]="true" formControlName="date"
                        [validationMessages]="[{ type: 'required', message: 'Date is required' }]">
                    </app-date-input>
                </form>
            `
        };
    }
};

export const ErrorWithoutReservedSpace: Story = {
    render: () => {
        const form = new FormGroup({ date: new FormControl<Date | null>(null, Validators.required) });
        form.get('date').markAsTouched();
        form.get('date').markAsDirty();
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-date-input label="Date" [required]="true" formControlName="date"
                        [reserveErrorSpace]="false"
                        [validationMessages]="[{ type: 'required', message: 'Date is required' }]">
                    </app-date-input>
                    <p style="margin-top: 0;">Content below (moves when error appears)</p>
                </form>
            `
        };
    }
};

export const WithMinMax: Story = {
    render: () => {
        const form = new FormGroup({ date: new FormControl<Date | null>(null) });
        const min = new Date(2024, 0, 1);
        const max = new Date(2024, 11, 31);
        return {
            props: { form, min, max },
            template: `
                <form [formGroup]="form">
                    <app-date-input label="Date (2024 only)" formControlName="date"
                        [min]="min" [max]="max">
                    </app-date-input>
                </form>
            `
        };
    }
};

export const InlineWithOtherFields: Story = {
    render: () => {
        const form = new FormGroup({
            start: new FormControl<Date | null>(new Date(2024, 2, 1)),
            end: new FormControl<Date | null>(new Date(2024, 2, 15))
        });
        return {
            props: { form },
            template: `
                <form [formGroup]="form" style="display: flex; gap: 16px;">
                    <app-date-input label="Start date" formControlName="start" style="flex: 1;"></app-date-input>
                    <app-date-input label="End date" formControlName="end" style="flex: 1;"></app-date-input>
                </form>
            `
        };
    }
};
