import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { AccountService } from '../../Services/account.service';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';
import { FormBuilder, Validators } from '@angular/forms';
import { SignalRService, ConnectionContainer } from 'app/Services/signalr.service';
import { TimeAgoPipe } from '../../Pipes/time.pipe';
import { ObjectId } from '../../Models/ObjectId';

@Component({
    selector: 'app-comment-display',
    templateUrl: './comment-display.component.html',
    styleUrls: ['./comment-display.component.scss'],
    providers: [TimeAgoPipe],
})
export class CommentDisplayComponent implements OnInit, OnDestroy {
    @Input() threadId: string;
    private canPostComment;
    private previousResponse;
    private hubConnection: ConnectionContainer;
    comments = [];
    commentForm;

    constructor(private httpClient: HttpClient, private urls: UrlService, private formbuilder: FormBuilder, private accountService: AccountService, private signalrService: SignalRService) {
        this.commentForm = this.formbuilder.group(
            {
                commentContent: ['', Validators.maxLength(1000)],
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
        this.hubConnection.reconnectEvent.subscribe(() => {
            this.getComments();
            this.getCanPostComment();
        });
    }

    ngOnDestroy() {
        this.hubConnection.connection.stop();
    }

    private getComments() {
        this.httpClient.get(this.urls.apiUrl + '/commentthread/' + this.threadId).subscribe(
            (response) => {
                if (this.previousResponse !== JSON.stringify(response)) {
                    this.comments = response['comments'];
                    this.previousResponse = JSON.stringify(response);
                }
            },
            (error) => this.urls.errorWrapper('Failed to get comments', error)
        );
    }

    getCanPostComment() {
        this.httpClient.get(this.urls.apiUrl + '/commentthread/canpost/' + this.threadId).subscribe(
            (response) => {
                this.canPostComment = response['canPost'];
            },
            (error) => this.urls.errorWrapper('Failed to update comments', error)
        );
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
        this.httpClient.put(this.urls.apiUrl + '/commentthread/' + this.threadId, { content: this.commentForm.controls.commentContent.value }).subscribe(
            (_) => {
                this.commentForm.controls.commentContent.setValue('');
            },
            (error) => this.urls.errorWrapper('Failed to apply comment', error)
        );
    }

    canDelete(comment) {
        return comment.author === this.accountService.account.id;
    }

    deleteComment(comment) {
        this.httpClient.post(this.urls.apiUrl + '/commentthread/' + this.threadId + '/' + comment.id, { content: this.commentForm.controls.commentContent.value }).subscribe(
            () => {
                this.commentForm.controls.commentContent.setValue('');
            },
            (error) => this.urls.errorWrapper('Failed to apply comment', error)
        );
    }

    getAuthorDisplayName(displayName: string) {
        return displayName === ObjectId.EmptyId ? 'Totally Not A Bot' : displayName;
    }
}
