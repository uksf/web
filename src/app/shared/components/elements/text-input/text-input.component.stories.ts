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

export const EmailType: Story = {
    render: () => {
        const form = new FormGroup({ email: new FormControl('bad-email', [Validators.required, Validators.email]) });
        form.get('email').markAsTouched();
        form.get('email').markAsDirty();
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Email" type="email" [required]="true" formControlName="email"
                        autocomplete="email"
                        [validationMessages]="[
                            { type: 'required', message: 'Email is required' },
                            { type: 'email', message: 'Must be a valid email address' }
                        ]">
                    </app-text-input>
                </form>
            `
        };
    }
};

export const NumberType: Story = {
    render: () => {
        const form = new FormGroup({ port: new FormControl('') });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Port" type="number" formControlName="port"
                        placeholder="e.g. 2302">
                    </app-text-input>
                </form>
            `
        };
    }
};

export const FullWidth: Story = {
    render: () => {
        const form = new FormGroup({
            email: new FormControl('', [Validators.required, Validators.email]),
            password: new FormControl('', Validators.required)
        });
        return {
            props: { form },
            template: `
                <form [formGroup]="form" style="width: 400px;">
                    <app-text-input label="Email" type="email" [required]="true" formControlName="email"
                        style="display: block; width: 100%;"
                        [validationMessages]="[
                            { type: 'required', message: 'Email is required' },
                            { type: 'email', message: 'Must be a valid email address' }
                        ]">
                    </app-text-input>
                    <app-text-input label="Password" type="password" [required]="true" formControlName="password"
                        style="display: block; width: 100%; margin-top: 16px;"
                        [validationMessages]="[{ type: 'required', message: 'Password is required' }]">
                    </app-text-input>
                </form>
            `
        };
    }
};

export const InlineMultipleInputsWithButton: Story = {
    render: () => {
        const form = new FormGroup({
            key: new FormControl(''),
            item: new FormControl('')
        });
        return {
            props: { form },
            template: `
                <div style="display: flex; align-items: flex-end; gap: 8px;">
                    <form [formGroup]="form" style="display: flex; gap: 8px; flex: 1;">
                        <app-text-input label="Key" formControlName="key" [reserveErrorSpace]="false"
                            style="flex: 1;">
                        </app-text-input>
                        <app-text-input label="Item" formControlName="item" [reserveErrorSpace]="false"
                            style="flex: 1;">
                        </app-text-input>
                    </form>
                    <button mat-raised-button color="primary" style="height: 36px;">Add</button>
                </div>
            `
        };
    }
};

export const WithTooltip: Story = {
    render: () => {
        const form = new FormGroup({ filter: new FormControl('') });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Filter" formControlName="filter"
                        tooltip="Search by name, rank, or unit"
                        [clearable]="true" [reserveErrorSpace]="false">
                    </app-text-input>
                </form>
            `
        };
    }
};

export const WithHint: Story = {
    render: () => {
        const form = new FormGroup({ folder: new FormControl({ value: '', disabled: false }) });
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Custom folder name" formControlName="folder"
                        hint="Leave blank to use the mod name with @ prefix">
                    </app-text-input>
                </form>
            `
        };
    }
};

export const WithHintAndError: Story = {
    render: () => {
        const form = new FormGroup({ name: new FormControl('', Validators.required) });
        form.get('name').markAsTouched();
        form.get('name').markAsDirty();
        return {
            props: { form },
            template: `
                <form [formGroup]="form">
                    <app-text-input label="Name" [required]="true" formControlName="name"
                        hint="This hint is hidden when error shows"
                        [validationMessages]="[{ type: 'required', message: 'Name is required' }]">
                    </app-text-input>
                </form>
            `
        };
    }
};

export const RequiredEmpty: Story = {
    render: () => {
        const form = new FormGroup({ name: new FormControl('', Validators.required) });
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
