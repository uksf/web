import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subject } from 'rxjs';
import { InlineDropdownComponent } from './inline-dropdown.component';

describe('InlineDropdownComponent', () => {
  let component: InlineDropdownComponent;
  let validatorSubject: Subject<boolean>;

  beforeEach(() => {
    vi.useFakeTimers();
    component = new InlineDropdownComponent();
    validatorSubject = new Subject<boolean>();
    component.validator = validatorSubject.asObservable();
    // Mock the ViewChild element ref that would be provided by Angular
    component.inlineDropdownControl = { nativeElement: { focus: vi.fn() } };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('value getter/setter', () => {
    it('updates internal value', () => {
      component.value = 'test';
      expect(component.value).toBe('test');
    });

    it('calls onChange when value changes', () => {
      const onChangeSpy = vi.fn();
      component.onChange = onChangeSpy;
      component.value = 'new';
      expect(onChangeSpy).toHaveBeenCalledWith('new');
    });

    it('sets invalid flag from validator', () => {
      component.value = 'test';
      validatorSubject.next(true);
      expect(component.invalid).toBe(true);

      validatorSubject.next(false);
      expect(component.invalid).toBe(false);
    });

    it('resets invalid to false when value set to same value', () => {
      component.value = 'test';
      validatorSubject.next(true);
      expect(component.invalid).toBe(true);

      component.value = 'test';
      expect(component.invalid).toBe(false);
    });

    it('does not accumulate subscriptions on repeated value changes', () => {
      const countingSubject = new Subject<boolean>();
      component.validator = countingSubject.asObservable();

      component.value = 'a';
      component.value = 'b';
      component.value = 'c';

      let setCount = 0;
      Object.defineProperty(component, 'invalid', {
        get() { return this._testInvalid; },
        set(v) { this._testInvalid = v; setCount++; },
        configurable: true,
      });

      countingSubject.next(true);

      // After fix: only 1 active subscription, so invalid is set once
      // Before fix: 3 accumulated subscriptions, so invalid is set 3 times
      expect(setCount).toBe(1);
    });
  });

  describe('writeValue', () => {
    it('sets internal value without triggering onChange', () => {
      const onChangeSpy = vi.fn();
      component.onChange = onChangeSpy;
      component.writeValue('test');
      expect(component.value).toBe('test');
      expect(onChangeSpy).not.toHaveBeenCalled();
    });
  });

  describe('edit', () => {
    it('stores preValue and sets editing to true', () => {
      component.edit('current');
      vi.advanceTimersByTime(0);
      expect(component.editing).toBe(true);
    });

    it('does nothing when disabled', () => {
      component.disabled = true;
      component.edit('current');
      expect(component.editing).toBe(false);
    });
  });

  describe('unfocus', () => {
    it('resets editing to false', () => {
      component.edit('original');
      vi.advanceTimersByTime(0);
      component.unfocus();
      expect(component.editing).toBe(false);
    });

    it('restores preValue when invalid', () => {
      const onChangeSpy = vi.fn();
      component.onChange = onChangeSpy;

      component.edit('original');
      vi.advanceTimersByTime(0);
      component.value = 'changed';
      component.invalid = true;
      component.unfocus();

      expect(component.value).toBe('original');
      expect(component.invalid).toBe(false);
    });

    it('emits finishedEvent when value changed and valid', () => {
      const emitSpy = vi.spyOn(component.finishedEvent, 'emit');

      component.edit('original');
      vi.advanceTimersByTime(0);
      component.value = 'changed';
      component.unfocus();

      expect(emitSpy).toHaveBeenCalledWith('changed');
    });
  });

  describe('keyEvent', () => {
    it('calls unfocus on Enter when editing', () => {
      const unfocusSpy = vi.spyOn(component, 'unfocus');
      component.editing = true;
      component.keyEvent({ key: 'Enter' } as KeyboardEvent);
      expect(unfocusSpy).toHaveBeenCalledWith();
    });

    it('calls unfocus with reset on Escape when editing', () => {
      const unfocusSpy = vi.spyOn(component, 'unfocus');
      component.editing = true;
      component.keyEvent({ key: 'Escape' } as KeyboardEvent);
      expect(unfocusSpy).toHaveBeenCalledWith(true);
    });

    it('does nothing when not editing', () => {
      const unfocusSpy = vi.spyOn(component, 'unfocus');
      component.editing = false;
      component.keyEvent({ key: 'Enter' } as KeyboardEvent);
      expect(unfocusSpy).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy cleanup', () => {
    it('cleans up validator subscription on destroy', () => {
      component.value = 'test';

      component.ngOnDestroy();
      component.invalid = false;
      validatorSubject.next(true);
      expect(component.invalid).toBe(false);
    });
  });
});
