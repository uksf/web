import { describe, it, expect, vi } from 'vitest';
import { DestroyableComponent } from './destroyable.component';

class TestComponent extends DestroyableComponent {
  getDestroy$() {
    return this.destroy$;
  }
}

describe('DestroyableComponent', () => {
  it('should emit on destroy$ when ngOnDestroy is called', () => {
    const component = new TestComponent();
    const nextSpy = vi.fn();
    component.getDestroy$().subscribe({ next: nextSpy });

    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalledOnce();
  });

  it('should complete destroy$ when ngOnDestroy is called', () => {
    const component = new TestComponent();
    const completeSpy = vi.fn();
    component.getDestroy$().subscribe({ complete: completeSpy });

    component.ngOnDestroy();

    expect(completeSpy).toHaveBeenCalledOnce();
  });

  it('should not emit again after ngOnDestroy is called twice', () => {
    const component = new TestComponent();
    const nextSpy = vi.fn();
    component.getDestroy$().subscribe({ next: nextSpy });

    component.ngOnDestroy();
    component.ngOnDestroy();

    expect(nextSpy).toHaveBeenCalledOnce();
  });
});
