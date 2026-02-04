import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthenticationService } from '../../Services/Authentication/authentication.service';
import { UrlService } from '../../Services/url.service';
import { UntypedFormBuilder, Validators } from '@angular/forms';

@Component({
    selector: 'app-live-page',
    templateUrl: './live-page.component.html',
    styleUrls: ['./live-page.component.scss']
})
export class LivePageComponent implements OnInit, OnDestroy {
    terminalForm: any;
    subscription: Subscription;
    messages: string[];

    ngOnInit() {}

    constructor(private httpClient: HttpClient, private auth: AuthenticationService, private urls: UrlService, private formbuilder: UntypedFormBuilder) {
        this.terminalForm = this.formbuilder.group(
            {
                terminalInput: ['', Validators.required]
            },
            {}
        );
        this.messages = new Array();
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    sendTerminal() {
        this.httpClient.post(this.urls.apiUrl + '/terminaljobs', this.terminalForm.controls.terminalInput.value.split(' ')).subscribe({
            next: (response) => {
                this.messages.push('Command complete, response was : \n' + response['result']);
            },
            error: () => {
                const commandResponse = 'server did not accept command';
                this.messages.push('Command complete, response was : \n' + commandResponse);
            }
        });
        this.terminalForm.controls.terminalInput.setValue('');
    }
}
