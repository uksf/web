import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ValidationReportModalComponent, ValidationReportModalData } from './validation-report-modal.component';
import { SharedModule } from '@shared/shared.module';
import { modalProviders, modalImports } from '../../../../../.storybook/utils/mock-providers';

const meta: Meta<ValidationReportModalComponent> = {
    title: 'Modals/ValidationReport',
    component: ValidationReportModalComponent,
    decorators: [
        moduleMetadata({
            imports: [...modalImports, SharedModule],
            providers: modalProviders({
                title: 'Validation Report',
                messages: [
                    {
                        title: 'Missing Required Fields',
                        detail: 'The following fields are required but were not provided:\n\n- First Name\n- Last Name\n- Date of Birth',
                        error: false
                    }
                ]
            } as ValidationReportModalData)
        })
    ]
};
export default meta;
type Story = StoryObj<ValidationReportModalComponent>;

export const SingleMessage: Story = {};

export const ErrorMessage: Story = {
    decorators: [
        moduleMetadata({
            providers: modalProviders({
                title: 'Build Validation Failed',
                messages: [
                    {
                        title: '<strong>Critical Error</strong>',
                        detail: 'Failed to compile mission file:\n\nError on line 42: Undefined variable "player_count"\nExpected: integer\nGot: undefined\n\nPlease fix this error and try again.',
                        error: true
                    }
                ]
            } as ValidationReportModalData)
        })
    ]
};

export const MultipleMessages: Story = {
    decorators: [
        moduleMetadata({
            providers: modalProviders({
                title: 'Modpack Validation',
                messages: [
                    {
                        title: 'Warning 1 of 3',
                        detail: 'Mod "@ace" has an outdated version. Current: 3.14.0, Latest: 3.15.1\n\nThis may cause compatibility issues with the latest mission files.',
                        error: false
                    },
                    {
                        title: 'Warning 2 of 3',
                        detail: 'Mod "@tfar" configuration file is missing optional parameter "terrain_interception_coefficient".\n\nDefault value will be used.',
                        error: false
                    },
                    {
                        title: '<strong>Error 3 of 3</strong>',
                        detail: 'Mod "@cba_a3" failed integrity check.\n\nExpected hash: 4a8f2b...\nActual hash: 9c3d1e...\n\nPlease redownload this mod.',
                        error: true
                    }
                ]
            } as ValidationReportModalData)
        })
    ]
};
