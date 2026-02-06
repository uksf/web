import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AccountService } from '@app/core/services/account.service';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { SignalRService, ConnectionContainer } from '@app/core/services/signalr.service';
import { TimeAgoPipe } from '@app/shared/pipes/time.pipe';
import { ObjectId } from '@app/shared/models/object-id';
import { UksfError } from '@app/shared/models/response';

@Component({
    selector: 'app-comment-display',
    templateUrl: './comment-display.component.html',
    styleUrls: ['./comment-display.component.scss'],
    providers: [TimeAgoPipe]
})
export class CommentDisplayComponent implements OnInit, OnDestroy {
    @Input() threadId: string;
    private canPostComment;
    private previousResponse;
    private hubConnection: ConnectionContainer;
    private destroy$ = new Subject<void>();
    comments = [];
    commentForm;

    constructor(private httpClient: HttpClient, private urls: UrlService, private formbuilder: UntypedFormBuilder, private accountService: AccountService, private signalrService: SignalRService) {
        this.commentForm = this.formbuilder.group(
            {
                commentContent: ['', Validators.maxLength(1000)]
            },
            {}
        );
    }

    ngOnInit() {
        this.getComments();
        this.getCanPostComment();
        this.hubConnection = this.signalrService.connect(`commentThread?threadId=${this.threadId}`);
        this.hubConnection.connection.on('ReceiveComment', (comment) => {
            this.comments.unshift(comment);
        });
        this.hubConnection.connection.on('DeleteComment', (id) => {
            this.comments.splice(
                this.comments.findIndex((x) => x.id === id),
                1
            );
        });
        this.hubConnection.reconnectEvent.pipe(takeUntil(this.destroy$)).subscribe({
            next: () => {
                this.getComments();
                this.getCanPostComment();
            }
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        this.hubConnection.connection.stop();
    }

    private getComments() {
        this.httpClient.get(this.urls.apiUrl + '/commentthread/' + this.threadId).subscribe({
            next: (response) => {
                if (this.previousResponse !== JSON.stringify(response)) {
                    this.comments = response['comments'];
                    this.previousResponse = JSON.stringify(response);
                }
            }
        });
    }

    getCanPostComment() {
        this.httpClient.get(this.urls.apiUrl + '/commentthread/canpost/' + this.threadId).subscribe({
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

        this.httpClient.put(this.urls.apiUrl + '/commentthread/' + this.threadId, { content: this.commentForm.controls.commentContent.value }).subscribe({
            next: (_) => {
                this.commentForm.controls.commentContent.setValue('');
            }
        });
    }

    canDelete(comment) {
        return comment.author === this.accountService.account.id;
    }

    deleteComment(comment) {
        this.httpClient.post(this.urls.apiUrl + '/commentthread/' + this.threadId + '/' + comment.id, { content: this.commentForm.controls.commentContent.value }).subscribe({
            next: () => {
                this.commentForm.controls.commentContent.setValue('');
            }
        });
    }

    getAuthorDisplayName(displayName: string) {
        return displayName === ObjectId.EmptyId ? 'Totally Not A Bot' : displayName;
    }
}
