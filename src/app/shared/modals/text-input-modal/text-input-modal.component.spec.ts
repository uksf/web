import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { TextInputModalComponent, TextInputModalData } from './text-input-modal.component';

describe('TextInputModalComponent', () => {
    let component: TextInputModalComponent;
    let mockDialogRef: any;
    const formBuilder = new FormBuilder();

    beforeEach(() => {
        mockDialogRef = {
            close: vi.fn()
        };
    });

    function createComponent(data: TextInputModalData): TextInputModalComponent {
        return new TextInputModalComponent(formBuilder, mockDialogRef, data);
    }

    describe('constructor', () => {
        it('sets title and message from data', () => {
            component = createComponent({ title: 'Test Title' });

            expect(component.title).toBe('Test Title');
        });
    });

    describe('submit', () => {
        it('closes dialog with the form input value', () => {
            component = createComponent({ title: 'Input' });
            component.form.get('input').setValue('user input text');

            component.submit();

            expect(mockDialogRef.close).toHaveBeenCalledWith('user input text');
        });

        it('closes dialog with empty string when input is empty', () => {
            component = createComponent({ title: 'Input' });

            component.submit();

            expect(mockDialogRef.close).toHaveBeenCalledWith('');
        });
    });

    describe('cancel', () => {
        it('closes dialog without a result', () => {
            component = createComponent({ title: 'Input' });

            component.cancel();

            expect(mockDialogRef.close).toHaveBeenCalledWith();
        });
    });

    describe('form validation', () => {
        it('is invalid when input is empty', () => {
            component = createComponent({ title: 'Input' });

            expect(component.form.valid).toBe(false);
        });

        it('is valid when input has a value', () => {
            component = createComponent({ title: 'Input' });
            component.form.get('input').setValue('some text');

            expect(component.form.valid).toBe(true);
        });
    });
});
