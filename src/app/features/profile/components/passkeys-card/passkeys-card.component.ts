import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { first } from 'rxjs/operators';
import { Passkey, PasskeyService, isPasskeyCancelled } from '@app/core/services/authentication/passkey.service';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { ConfirmationModalComponent } from '@app/shared/modals/confirmation-modal/confirmation-modal.component';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { UksfError } from '@app/shared/models/response';

@Component({
    selector: 'app-passkeys-card',
    templateUrl: './passkeys-card.component.html',
    styleUrls: ['./passkeys-card.component.scss'],
    imports: [MatCard, MatIcon, MatIconButton, MatTooltip, ButtonComponent, DatePipe]
})
export class PasskeysCardComponent implements OnInit {
    private passkeyService = inject(PasskeyService);
    private dialog = inject(MatDialog);

    supported = this.passkeyService.supported;
    passkeys: Passkey[] = [];
    pending = false;

    ngOnInit() {
        this.passkeyService
            .list()
            .pipe(first())
            .subscribe({ next: (response) => (this.passkeys = response.passkeys) });
    }

    async add() {
        this.pending = true;
        try {
            const passkey = await this.passkeyService.add();
            this.passkeys = [...this.passkeys, passkey];
        } catch (error) {
            if (error instanceof DOMException && error.name === 'InvalidStateError') {
                this.showError('This device or password manager already has a UKSF passkey');
            } else if (!isPasskeyCancelled(error)) {
                this.showError((error as UksfError)?.error || 'Passkey creation failed');
            }
        } finally {
            this.pending = false;
        }
    }

    remove(passkey: Passkey) {
        this.dialog
            .open(ConfirmationModalComponent, {
                data: {
                    message: `Remove the passkey '${passkey.name}'?\n\nAlso delete it from your device or password manager, because it will no longer sign you in.`,
                    button: 'Remove'
                }
            })
            .afterClosed()
            .pipe(first())
            .subscribe({
                next: (confirmed) => {
                    if (confirmed) {
                        this.passkeyService
                            .remove(passkey.id)
                            .pipe(first())
                            .subscribe({
                                next: () => (this.passkeys = this.passkeys.filter((x) => x.id !== passkey.id)),
                                error: (error: UksfError) => this.showError(error?.error || 'Failed to remove passkey')
                            });
                    }
                }
            });
    }

    private showError(message: string) {
        this.dialog.open(MessageModalComponent, { data: { message } });
    }
}
