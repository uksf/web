import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { first } from 'rxjs/operators';
import { GameServersService } from '../../services/game-servers.service';
import { ServerMod } from '../../models/game-server';

@Component({
    selector: 'app-edit-server-mods-modal',
    templateUrl: './edit-server-mods-modal.component.html',
    styleUrls: ['./edit-server-mods-modal.component.scss'],
    standalone: false
})
export class EditServerModsModalComponent implements OnInit {
    server;
    before: string;
    availableMods;

    constructor(private gameServersService: GameServersService, private dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: EditServerModsData) {
        this.server = data.server;
    }

    get changes() {
        return JSON.stringify(this.availableMods) !== this.before;
    }

    ngOnInit() {
        this.getAvailableMods();
    }

    getAvailableMods() {
        this.gameServersService.getServerMods(this.server.id).pipe(first()).subscribe({
            next: (response) => {
                this.populateServerMods(response);
                this.before = JSON.stringify(this.availableMods);
            }
        });
    }

    populateServerMods(mods) {
        mods.forEach((mod) => {
            mod.selected = !!this.server.mods.find((x) => x.path === mod.path);
            mod.serverMod = !!this.server.serverMods.find((x) => x.path === mod.path);
        });
        this.availableMods = mods;
    }

    duplicateSelected(mod): boolean {
        return this.availableMods.findIndex((x) => x !== mod && x.name === mod.name && (x.selected || x.serverMod)) !== -1;
    }

    submit() {
        const mods = [];
        const serverMods = [];
        this.availableMods.forEach((mod) => {
            if (mod.selected) {
                mods.push(mod);
            } else if (mod.serverMod) {
                serverMods.push(mod);
            }
        });
        this.server.mods = mods;
        this.server.serverMods = serverMods;

        this.gameServersService.updateServerMods(this.server.id, this.server)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.dialog.closeAll();
                }
            });
    }

    reset() {
        this.gameServersService.resetServerMods(this.server.id)
            .pipe(first())
            .subscribe({
                next: ({ availableMods, mods, serverMods }) => {
                    this.server.mods = mods;
                    this.server.serverMods = serverMods;
                    this.populateServerMods(availableMods);
                }
            });
    }
}

interface EditServerModsData {
    server: { id: string; mods: ServerMod[]; serverMods: ServerMod[] };
}
