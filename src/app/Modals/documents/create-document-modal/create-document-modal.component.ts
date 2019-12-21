import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { InstantErrorStateMatcher } from '../../../Pages/registration-page/registration-page.component';
import { Observable, of, timer } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'app-create-document-modal',
    templateUrl: './create-document-modal.component.html',
    styleUrls: ['./create-document-modal.component.scss']
})
export class CreateDocumentModalComponent implements OnInit {
    instantErrorStateMatcher = new InstantErrorStateMatcher();
    form: FormGroup;
    validationMessages = {
        'name': [
            { type: 'required', message: 'Name is required' },
            { type: 'documentTaken', message: 'That name is already in use in that directory' }
        ]
    };
    directory;

    constructor(formbuilder: FormBuilder, private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any) {
        this.directory = data;
        this.form = formbuilder.group({
            name: ['', Validators.required, this.validateName.bind(this)],
            directory: [this.directory]
        });
    }

    ngOnInit() { }

    private validateName(control: AbstractControl): Observable<ValidationErrors> {
        return timer(200).pipe(
            switchMap(() => {
                if (control.pristine || !control.value) { return of(null); }
                return this.httpClient.post(`${this.urls.apiUrl}/documents/check?directory=${this.directory}&name=${control.value}`, {}).pipe(
                    map(response => (response ? { documentTaken: true } : null))
                );
            })
        );
    }

    submit() {
        console.log(this.form);
        const formString = JSON.stringify(this.form.getRawValue()).replace(/\n|\r/g, '');
        this.httpClient.put(`${this.urls.apiUrl}/documents`, formString, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json'
            })
        }).subscribe(_ => {
            this.dialog.closeAll();
        });
    }
}
