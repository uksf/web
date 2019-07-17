import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../Services/Authentication/authentication.service';
import { UrlService } from '../../Services/url.service';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
    selector: 'app-live-page',
    templateUrl: './live-page.component.html',
    styleUrls: ['./live-page.component.css']
})
export class LivePageComponent implements OnInit, OnDestroy {
    terminalForm: any;
    subscription: Subscription;
    messages: string[];
    private processing: boolean;

    ngOnInit() { }

    constructor(
        private httpClient: HttpClient,
        private auth: AuthenticationService,
        private urls: UrlService,
        private formbuilder: FormBuilder) {
        this.terminalForm = this.formbuilder.group({
            terminalInput: ['', Validators.required]
        }, {});
        this.messages = new Array();
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    sendTerminal() {
        this.httpClient.post(
            this.urls.apiUrl + '/terminaljobs', this.terminalForm.controls.terminalInput.value.split(' ')
        ).subscribe(response => {
            this.messages.push('Command complete, response was : \n' + response['result']);
        }, () => {
            const commandResponse = 'server did not accept command';
            this.messages.push('Command complete, response was : \n' + commandResponse);
        });
        this.terminalForm.controls.terminalInput.setValue('');
    }
}
