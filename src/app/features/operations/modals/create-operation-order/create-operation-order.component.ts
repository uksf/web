import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/Services/url.service';

@Component({
    selector: 'app-create-operation-order',
    templateUrl: './create-operation-order.component.html',
    styleUrls: ['./create-operation-order.component.scss']
})
export class CreateOperationOrderComponent implements OnInit {
    opordform;

    constructor(private formbuilder: UntypedFormBuilder, private httpClient: HttpClient, private urlService: UrlService) {
        this.opordform = this.formbuilder.group(
            {
                name: ['', Validators.required],
                map: ['', Validators.required],
                type: ['', Validators.required],
                end: ['', Validators.required],
                start: ['', Validators.required],
                endtime: ['', [Validators.required, Validators.pattern('([0-9][0-9][0-5][0-9])|([0-9][0-9]60)'), Validators.max(2400)]],
                starttime: ['', [Validators.required, Validators.pattern('([0-9][0-9][0-5][0-9])|([0-9][0-9]60)'), Validators.max(2400)]]
            },
            {}
        );
    }

    ngOnInit() {}

    submit() {
        this.httpClient.post(`${this.urlService.apiUrl}/operationorder`, this.opordform.value).subscribe();
    }
}
