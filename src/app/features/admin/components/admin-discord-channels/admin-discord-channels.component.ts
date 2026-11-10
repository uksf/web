import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { MessageModalComponent } from '@app/shared/modals/message-modal/message-modal.component';
import { UksfError } from '@app/shared/models/response';
import { DefaultContentAreasComponent } from '@app/shared/components/content-areas/default-content-areas/default-content-areas.component';
import { MainContentAreaComponent } from '@app/shared/components/content-areas/main-content-area/main-content-area.component';
import { ButtonComponent } from '@app/shared/components/elements/button-pending/button.component';
import { TextInputComponent } from '@app/shared/components/elements/text-input/text-input.component';
import { DiscordChannelContent, DiscordChannelContentRequest } from '../../models/discord-channel-content';
import { DiscordChannelContentsService } from '../../services/discord-channel-contents.service';

@Component({
    selector: 'app-admin-discord-channels',
    templateUrl: './admin-discord-channels.component.html',
    styleUrls: ['./admin-discord-channels.component.scss'],
    imports: [DefaultContentAreasComponent, MainContentAreaComponent, ButtonComponent, TextInputComponent, FormsModule, DatePipe]
})
export class AdminDiscordChannelsComponent implements OnInit {
    private service = inject(DiscordChannelContentsService);
    private dialog = inject(MatDialog);

    items: DiscordChannelContent[] = [];
    pendingId: string | null = null;
    newItem: DiscordChannelContentRequest = { channelId: '', name: '', content: '' };

    ngOnInit(): void {
        this.service
            .getAll()
            .pipe(first())
            .subscribe({ next: (items) => (this.items = items), error: (error: UksfError) => this.showError(error, 'Failed to load channel content') });
    }

    save(item: DiscordChannelContent): void {
        this.run(item.id, this.service.update(item.id, this.toRequest(item)), 'Saved');
    }

    saveAndPublish(item: DiscordChannelContent): void {
        this.run(item.id, this.service.update(item.id, this.toRequest(item)).pipe(switchMap(() => this.service.publish(item.id))), 'Published to Discord');
    }

    create(): void {
        this.pendingId = 'new';
        this.service
            .create(this.newItem)
            .pipe(first())
            .subscribe({
                next: (created) => {
                    this.items = [...this.items, created];
                    this.newItem = { channelId: '', name: '', content: '' };
                    this.pendingId = null;
                },
                error: (error: UksfError) => this.showError(error, 'Failed to add channel content')
            });
    }

    private run(id: string, request: Observable<DiscordChannelContent>, successMessage: string): void {
        this.pendingId = id;
        request.pipe(first()).subscribe({
            next: (updated) => {
                this.items = this.items.map((x) => (x.id === updated.id ? updated : x));
                this.pendingId = null;
                this.dialog.open(MessageModalComponent, { data: { message: successMessage } });
            },
            error: (error: UksfError) => this.showError(error, 'Failed to update channel content')
        });
    }

    private toRequest(item: DiscordChannelContent): DiscordChannelContentRequest {
        return { channelId: item.channelId, name: item.name, content: item.content };
    }

    private showError(error: UksfError, fallback: string): void {
        this.pendingId = null;
        this.dialog.open(MessageModalComponent, { data: { message: error?.error || fallback } });
    }
}
