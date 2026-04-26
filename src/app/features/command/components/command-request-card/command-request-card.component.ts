import { Component, EventEmitter, HostBinding, Input, Output, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCard } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { CommandRequestItem, CommandReviewEvent, ReviewState } from '@app/features/command/models/command-request';
import { AccountService } from '@app/core/services/account.service';
import { FlexFillerComponent } from '@app/shared/components/elements/flex-filler/flex-filler.component';

@Component({
    selector: 'app-command-request-card',
    templateUrl: './command-request-card.component.html',
    styleUrls: ['./command-request-card.component.scss'],
    imports: [MatCard, MatIcon, MatButton, MatTooltip, DatePipe, FlexFillerComponent]
})
export class CommandRequestCardComponent {
    private accountService = inject(AccountService);

    @Input({ required: true }) request!: CommandRequestItem;
    @Output() review = new EventEmitter<CommandReviewEvent>();

    reviewState = ReviewState;

    @HostBinding('class')
    get hostClass(): string {
        return `t-${this.request?.colorKey ?? 'default'}`;
    }

    isLoa(): boolean {
        return this.request.data.type === 'Loa';
    }

    canReview(): boolean {
        return this.request.reviews.some(
            (r) => r.id === this.accountService.account.id && r.state === ReviewState.PENDING
        );
    }

    pillClass(state: ReviewState): string {
        switch (state) {
            case ReviewState.APPROVED:
                return 'pill approved';
            case ReviewState.REJECTED:
                return 'pill rejected';
            default:
                return 'pill pending';
        }
    }

    onReview(state: ReviewState, overridden: boolean) {
        this.review.emit({ state, overridden });
    }
}
