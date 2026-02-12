import type { Meta, StoryObj } from '@storybook/angular';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { moduleMetadata } from '@storybook/angular';
import { TextInputComponent } from './text-input.component';

const meta: Meta<TextInputComponent> = {
    title: 'Shared/TextInput',
    component: TextInputComponent,
    decorators: [
        moduleMetadata({
            imports: [ReactiveFormsModule]
        })
    ]
};
export default meta;

type Story = StoryObj<TextInputComponent>;

export const Default: Story = {
    render: () => {
        const form = new FormGroup({ name: new FormControl('') });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Name" formControlName="name"
                        [validationMessages]="[{ type: 'required', message: 'Name is required' }]">
                    </app-text-input>
                </form>
            `
        };
    }
};

export const Filled: Story = {
    render: () => {
        const form = new FormGroup({ name: new FormControl('Sgt. Smith') });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Name" formControlName="name"></app-text-input>
                </form>
            `
        };
    }
};

export const Disabled: Story = {
    render: () => {
        const form = new FormGroup({ name: new FormControl({ value: 'Sgt. Smith', disabled: true }) });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Name" formControlName="name"></app-text-input>
                </form>
            `
        };
    }
};

export const WithPlaceholder: Story = {
    render: () => {
        const form = new FormGroup({ email: new FormControl('') });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input placeholder="Enter your email" type="email" formControlName="email"></app-text-input>
                </form>
            `
        };
    }
};

export const Password: Story = {
    render: () => {
        const form = new FormGroup({ password: new FormControl('') });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Password" type="password" formControlName="password"></app-text-input>
                </form>
            `
        };
    }
};

export const ErrorState: Story = {
    render: () => {
        const form = new FormGroup({ name: new FormControl('', Validators.required) });
        // Pre-touch to trigger error display
        form.get('name').markAsTouched();
        form.get('name').markAsDirty();
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Name" [required]="true" formControlName="name"
                        [validationMessages]="[{ type: 'required', message: 'Name is required' }]">
                    </app-text-input>
                </form>
            `
        };
    }
};

export const ErrorWithReservedSpace: Story = {
    render: () => {
        const form = new FormGroup({ name: new FormControl('Valid input') });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="With reserved space" formControlName="name"
                        [reserveErrorSpace]="true"
                        [validationMessages]="[{ type: 'required', message: 'Name is required' }]">
                    </app-text-input>
                    <p style="margin-top: 0;">Content below (stable position)</p>
                </form>
            `
        };
    }
};

export const ErrorWithoutReservedSpace: Story = {
    render: () => {
        const form = new FormGroup({ name: new FormControl('Valid input') });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Without reserved space" formControlName="name"
                        [reserveErrorSpace]="false"
                        [validationMessages]="[{ type: 'required', message: 'Name is required' }]">
                    </app-text-input>
                    <p style="margin-top: 0;">Content below (moves when error appears)</p>
                </form>
            `
        };
    }
};

export const Textarea: Story = {
    render: () => {
        const form = new FormGroup({ notes: new FormControl('Line 1\nLine 2\nLine 3') });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Notes" [multiline]="true" formControlName="notes"></app-text-input>
                </form>
            `
        };
    }
};

export const Clearable: Story = {
    render: () => {
        const form = new FormGroup({ filter: new FormControl('Some filter text') });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Filter" formControlName="filter"
                        [clearable]="true" [reserveErrorSpace]="false">
                    </app-text-input>
                </form>
            `
        };
    }
};

export const ClearableEmpty: Story = {
    render: () => {
        const form = new FormGroup({ filter: new FormControl('') });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Filter" formControlName="filter"
                        [clearable]="true" [reserveErrorSpace]="false">
                    </app-text-input>
                </form>
            `
        };
    }
};

export const ClearableDisabled: Story = {
    render: () => {
        const form = new FormGroup({ filter: new FormControl({ value: 'Disabled text', disabled: true }) });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Filter" formControlName="filter"
                        [clearable]="true" [reserveErrorSpace]="false">
                    </app-text-input>
                </form>
            `
        };
    }
};

export const InlineWithButton: Story = {
    render: () => {
        const form = new FormGroup({ search: new FormControl('') });
        return {
            props: { form },
            template: `
                <div style="display: flex; align-items: flex-end; gap: 8px;">
                    <form [formGroup]="form" style="flex: 1;">
                        <app-text-input placeholder="Search..." formControlName="search"
                            [reserveErrorSpace]="false">
                        </app-text-input>
                    </form>
                    <button mat-raised-button color="primary" style="height: 36px;">Search</button>
                </div>
            `
        };
    }
};
