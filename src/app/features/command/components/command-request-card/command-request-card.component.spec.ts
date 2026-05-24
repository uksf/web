import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CommandRequestCardComponent } from './command-request-card.component';
import { ReviewState, CommandRequestItem, CommandReviewEvent } from '@app/features/command/models/command-request';
import { AccountService } from '@app/core/services/account.service';

const buildItem = (overrides: Partial<CommandRequestItem> = {}): CommandRequestItem => ({
    data: {
        id: 'req1',
        type: 'Loa',
        value: '',
        secondaryValue: '',
        displayValue: '2026-05-22',
        displayFrom: '2026-05-15',
        displayRequester: 'SSgt Tim',
        displayRecipient: 'Cpl Bridg',
        reason: 'holiday',
        requester: 'tim',
        recipient: 'bridg',
        dateCreated: '2026-04-25T00:00:00Z',
        reviews: {}
    },
    displayReason: 'holiday',
    displayType: 'Loa',
    iconKey: 'event_busy',
    colorKey: 'loa',
    canOverride: false,
    reviews: [
        { id: 'me', name: 'Tim', state: ReviewState.PENDING },
        { id: 'other', name: 'Stoff', state: ReviewState.APPROVED }
    ],
    ...overrides
});

describe('CommandRequestCardComponent', () => {
    let component: CommandRequestCardComponent;
    let accountServiceMock: { account: { id: string } };

    beforeEach(() => {
        accountServiceMock = { account: { id: 'me' } };
        TestBed.configureTestingModule({
            providers: [CommandRequestCardComponent, { provide: AccountService, useValue: accountServiceMock }]
        });
        component = TestBed.inject(CommandRequestCardComponent);
    });

    it('exposes request data for header / body / foot rendering', () => {
        component.request = buildItem();

        // Header bindings
        expect(component.request.displayType).toBe('Loa');
        expect(component.request.iconKey).toBe('event_busy');
        expect(component.request.data.displayRecipient).toBe('Cpl Bridg');
        expect(component.request.data.displayRequester).toBe('SSgt Tim');
        // Body bindings
        expect(component.isLoa()).toBe(true);
        expect(component.request.displayReason).toBe('holiday');
        // Foot bindings
        expect(component.request.reviews.length).toBe(2);
    });

    it('applies type colour class on host', () => {
        component.request = buildItem({ colorKey: 'discharge' });
        expect(component.hostClass).toBe('t-discharge');
    });

    it('falls back to t-default colour class when colorKey is missing', () => {
        component.request = buildItem({ colorKey: undefined as unknown as string });
        expect(component.hostClass).toBe('t-default');
    });

    it('canReview is true when current user has a pending review', () => {
        component.request = buildItem();
        expect(component.canReview()).toBe(true);
    });

    it('canReview is false when current user is not a reviewer', () => {
        accountServiceMock.account.id = 'someone-else';
        component.request = buildItem();
        expect(component.canReview()).toBe(false);
    });

    it('canReview is false when current user has already reviewed (non-pending)', () => {
        accountServiceMock.account.id = 'other'; // 'other' is APPROVED in fixture
        component.request = buildItem();
        expect(component.canReview()).toBe(false);
    });

    it('canOverride is false when request.canOverride flag is false', () => {
        component.request = buildItem({ canOverride: false });
        expect(component.canOverride()).toBe(false);
    });

    it('canOverride is true when flag is set and another reviewer exists', () => {
        component.request = buildItem({ canOverride: true });
        expect(component.canOverride()).toBe(true);
    });

    it('canOverride is false when current user is the only reviewer', () => {
        component.request = buildItem({
            canOverride: true,
            reviews: [{ id: 'me', name: 'Tim', state: ReviewState.PENDING }]
        });
        expect(component.canOverride()).toBe(false);
    });

    it('emits review event with state + overridden flag when onReview is called', () => {
        component.request = buildItem({ canOverride: true });
        const events: CommandReviewEvent[] = [];
        component.review.subscribe((e) => events.push(e));

        component.onReview(ReviewState.APPROVED, false);
        component.onReview(ReviewState.REJECTED, false);
        component.onReview(ReviewState.APPROVED, true);
        component.onReview(ReviewState.REJECTED, true);

        expect(events).toEqual([
            { state: ReviewState.APPROVED, overridden: false },
            { state: ReviewState.REJECTED, overridden: false },
            { state: ReviewState.APPROVED, overridden: true },
            { state: ReviewState.REJECTED, overridden: true }
        ]);
    });

    describe('pillClass', () => {
        it('returns "pill approved" for APPROVED state', () => {
            expect(component.pillClass(ReviewState.APPROVED)).toBe('pill approved');
        });

        it('returns "pill rejected" for REJECTED state', () => {
            expect(component.pillClass(ReviewState.REJECTED)).toBe('pill rejected');
        });

        it('returns "pill pending" for PENDING state', () => {
            expect(component.pillClass(ReviewState.PENDING)).toBe('pill pending');
        });

        it('returns "pill pending" for unknown / ERROR state', () => {
            expect(component.pillClass(ReviewState.ERROR)).toBe('pill pending');
        });
    });

    describe('isLoa', () => {
        it('returns true when request type is Loa', () => {
            component.request = buildItem();
            expect(component.isLoa()).toBe(true);
        });

        it('returns false when request type is something else', () => {
            component.request = buildItem({ data: { ...buildItem().data, type: 'Discharge' } });
            expect(component.isLoa()).toBe(false);
        });
    });
});
