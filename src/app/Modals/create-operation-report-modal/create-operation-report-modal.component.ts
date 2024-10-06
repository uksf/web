import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../Services/url.service';

@Component({
    selector: 'app-create-operation-report-modal',
    templateUrl: './create-operation-report-modal.component.html',
    styleUrls: ['./create-operation-report-modal.component.css']
})
export class CreateOperationReportModalComponent implements OnInit {
    oprepform;

    constructor(private formbuilder: UntypedFormBuilder, private httpClient: HttpClient, private urlService: UrlService) {
        this.oprepform = this.formbuilder.group(
            {
                name: ['', Validators.required],
                map: ['', Validators.required],
                type: ['', Validators.required],
                result: ['', Validators.required],
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
        this.httpClient.post(`${this.urlService.apiUrl}/operationreport`, this.oprepform.value).subscribe();
    }
}
