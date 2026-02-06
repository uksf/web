import { Component, Input } from '@angular/core';
import { AppSettingsService } from '@app/Services/appSettingsService.service';
import { NgForm } from '@angular/forms';

@Component({
    selector: 'app-form-value-debug-reactive',
    template: '<pre *ngIf="debugForms" style="margin-top: 10px;">{{ form.value | json }}</pre>',
})
export class ReactiveFormValueDebugComponent {
    @Input('form') form;
    debugForms: boolean = false;

    constructor(appSettings: AppSettingsService) {
        const debugFormsSetting = appSettings.appSetting('debugForms');
        this.debugForms = debugFormsSetting ?? false;
    }
}

@Component({
    selector: 'app-form-value-debug-template',
    template: '<pre *ngIf="debugForms" style="margin-top: 10px;">{{ form.value | json }}</pre>',
})
export class TemplateFormValueDebugComponent {
    debugForms: boolean = false;

    constructor(public form: NgForm, appSettings: AppSettingsService) {
        const debugFormsSetting = appSettings.appSetting('debugForms');
        this.debugForms = debugFormsSetting ?? false;
    }
}

@Component({
    selector: 'app-model-value-debug',
    template: '<pre *ngIf="debugForms" style="margin-top: 10px;">{{ model | json }}</pre>',
})
export class ModelValueDebugComponent {
    @Input('model') model;
    debugForms: boolean = false;

    constructor(appSettings: AppSettingsService) {
        const debugFormsSetting = appSettings.appSetting('debugForms');
        this.debugForms = debugFormsSetting ?? false;
    }
}
