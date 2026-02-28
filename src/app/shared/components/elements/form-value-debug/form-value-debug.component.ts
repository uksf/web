import { Component, Input } from '@angular/core';
import { AppSettingsService } from '@app/core/services/app-settings.service';
import { NgForm } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
    selector: 'app-form-value-debug-reactive',
    template: '@if (debugForms) {<pre style="margin-top: 10px;">{{ form.value | json }}</pre>}',
    imports: [JsonPipe]
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
    template: '@if (debugForms) {<pre style="margin-top: 10px;">{{ form.value | json }}</pre>}',
    imports: [JsonPipe]
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
    template: '@if (debugForms) {<pre style="margin-top: 10px;">{{ model | json }}</pre>}',
    imports: [JsonPipe]
})
export class ModelValueDebugComponent {
    @Input('model') model;
    debugForms: boolean = false;

    constructor(appSettings: AppSettingsService) {
        const debugFormsSetting = appSettings.appSetting('debugForms');
        this.debugForms = debugFormsSetting ?? false;
    }
}
