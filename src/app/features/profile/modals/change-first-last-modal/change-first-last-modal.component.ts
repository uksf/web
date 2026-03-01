import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AccountService } from '@app/core/services/account.service';
import { nameCase, titleCase } from '@app/shared/services/helper.service';
import { Rank } from '@app/shared/models/rank';
import { ProfileService } from '../../services/profile.service';
import { RanksService } from '@app/features/command/services/ranks.service';
import { first } from 'rxjs/operators';
import { CHARACTER_BLOCK_PATTERN } from '@app/shared/directives/character-block.directive';
import { AutofocusStopComponent } from '../../../../shared/components/elements/autofocus-stop/autofocus-stop.component';
import { MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { TextInputComponent } from '../../../../shared/components/elements/text-input/text-input.component';
import { MatError } from '@angular/material/form-field';
import { FlexFillerComponent } from '../../../../shared/components/elements/flex-filler/flex-filler.component';
import { MatButton } from '@angular/material/button';
import { ReactiveFormValueDebugComponent } from '../../../../shared/components/elements/form-value-debug/form-value-debug.component';

@Component({
    selector: 'app-change-first-last-modal',
    templateUrl: './change-first-last-modal.component.html',
    styleUrls: ['./change-first-last-modal.component.scss'],
    imports: [AutofocusStopComponent, MatDialogTitle, CdkScrollable, MatDialogContent, FormsModule, ReactiveFormsModule, TextInputComponent, MatError, MatDialogActions, FlexFillerComponent, MatButton, ReactiveFormValueDebugComponent]
})
export class ChangeFirstLastModalComponent implements OnInit {
    private formBuilder = inject(FormBuilder);
    private profileService = inject(ProfileService);
    private ranksService = inject(RanksService);
    private accountService = inject(AccountService);

    characterBlockPattern = CHARACTER_BLOCK_PATTERN;
    form = this.formBuilder.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required]
    });
    changed = false;
    original: string;
    rank: string;

    constructor() {
        this.form.controls.firstName.setValue(this.accountService.account.firstname);
        this.form.controls.lastName.setValue(this.accountService.account.lastname);
        this.ranksService
            .getRanks()
            .pipe(first())
            .subscribe({
                next: (ranks: Rank[]) => {
                    const rank = ranks.find((x) => x.name === this.accountService.account.rank);
                    this.rank = rank ? rank.abbreviation : null;
                }
            });
    }

    ngOnInit() {
        this.original = JSON.stringify(this.form.getRawValue());
    }

    changeName() {
        const formString = JSON.stringify(this.form.getRawValue()).replace(/[\n\r]/g, '');
        this.profileService
            .changeName(formString)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.accountService
                        .getAccount()
                        ?.pipe(first())
                        .subscribe({
                            next: () => {
                                this.changed = true;
                            }
                        });
                }
            });
    }

    get changesMade() {
        return this.original !== JSON.stringify(this.form.getRawValue());
    }

    get formErrors() {
        return this.form.errors?.error;
    }

    get displayName(): string {
        const firstName = titleCase(this.form.controls.firstName.value);
        const lastName = nameCase(this.form.controls.lastName.value);
        return `${this.rank ? `${this.rank}.` : ''}${lastName}.${firstName ? firstName[0] : '?'}`;
    }
}
