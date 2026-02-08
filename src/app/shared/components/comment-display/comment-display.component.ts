import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { first, takeUntil } from 'rxjs/operators';
import { AccountService } from '@app/core/services/account.service';
import { FormBuilder, Validators } from '@angular/forms';
import { SignalRService, ConnectionContainer } from '@app/core/services/signalr.service';
import { TimeAgoPipe } from '@app/shared/pipes/time.pipe';
import { ObjectId } from '@app/shared/models/object-id';
import { CommentThreadService } from '@app/shared/services/comment-thread.service';
import type { Comment } from '@app/shared/services/comment-thread.service';
import { DestroyableComponent } from '@app/shared/components';

@Component({
    selector: 'app-comment-display',
    templateUrl: './comment-display.component.html',
    styleUrls: ['./comment-display.component.scss'],
    providers: [TimeAgoPipe]
})
export class CommentDisplayComponent extends DestroyableComponent implements OnInit, OnDestroy {
    @Input() threadId: string;
    private canPostComment;
    private previousResponse;
    private hubConnection: ConnectionContainer;
    private onReceiveComment = (comment) => {
        this.comments.unshift(comment);
    };
    private onDeleteComment = (id) => {
        this.comments.splice(
            this.comments.findIndex((x) => x.id === id),
            1
        );
    };
    comments: Comment[] = [];
    commentForm = this.formBuilder.group({
        commentContent: ['', Validators.maxLength(1000)]
    });

    constructor(private commentThreadService: CommentThreadService, private formBuilder: FormBuilder, private accountService: AccountService, private signalrService: SignalRService) {
        super();
    }

    ngOnInit() {
        this.getComments();
        this.getCanPostComment();
        this.hubConnection = this.signalrService.connect(`commentThread?threadId=${this.threadId}`);
        this.hubConnection.connection.on('ReceiveComment', this.onReceiveComment);
        this.hubConnection.connection.on('DeleteComment', this.onDeleteComment);
        this.hubConnection.reconnectEvent.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.getComments();
                this.getCanPostComment();
            }
        });
    }

    override ngOnDestroy() {
        super.ngOnDestroy();
        this.hubConnection.connection.off('ReceiveComment', this.onReceiveComment);
        this.hubConnection.connection.off('DeleteComment', this.onDeleteComment);
        this.hubConnection.connection.stop();
    }

    private getComments() {
        this.commentThreadService.getComments(this.threadId).pipe(first()).subscribe({
            next: (response) => {
                if (this.previousResponse !== JSON.stringify(response)) {
                    this.comments = response.comments;
                    this.previousResponse = JSON.stringify(response);
                }
            }
        });
    }

    getCanPostComment() {
        this.commentThreadService.canPost(this.threadId).pipe(first()).subscribe({
            next: (canPost: boolean) => {
                this.canPostComment = canPost;
            }
        });
    }

    hasText() {
        return this.commentForm.controls.commentContent.value != null && this.commentForm.controls.commentContent.value !== '';
    }

    get canPost() {
        return this.canPostComment;
    }

    postComment() {
        if (!this.hasText()) {
            return;
        }

        this.commentThreadService.postComment(this.threadId, this.commentForm.controls.commentContent.value).pipe(first()).subscribe({
            next: (_) => {
                this.commentForm.controls.commentContent.setValue('');
            }
        });
    }

    canDelete(comment) {
        return comment.author === this.accountService.account.id;
    }

    deleteComment(comment) {
        this.commentThreadService.deleteComment(this.threadId, comment.id).pipe(first()).subscribe({
            next: () => {
                this.commentForm.controls.commentContent.setValue('');
            }
        });
    }

    trackById(index: number, item: { id: string }): string {
        return item.id;
    }

    getAuthorDisplayName(displayName: string) {
        return displayName === ObjectId.EmptyId ? 'Totally Not A Bot' : displayName;
    }
}
