import { Injectable } from '@angular/core';
import { first } from 'rxjs/operators';
import { ConnectionContainer, SignalRService } from './signalr.service';
import { AccountService } from './account.service';

@Injectable()
export class SignalRHubsService {
    public allHubConnection: ConnectionContainer;
    public accountGroupedHubConnection: ConnectionContainer;

    constructor(private signalrService: SignalRService, private accountService: AccountService) {}

    public async disconnect(): Promise<void> {
        if (this.allHubConnection) {
            this.allHubConnection.dispose();
            await this.allHubConnection.connection.stop();
            this.allHubConnection = undefined;
        }

        if (this.accountGroupedHubConnection) {
            this.accountGroupedHubConnection.dispose();
            await this.accountGroupedHubConnection.connection.stop();
            this.accountGroupedHubConnection = undefined;
        }
    }

    public getAllHub(): Promise<ConnectionContainer> {
        return new Promise<ConnectionContainer>((resolve) => {
            if (this.allHubConnection) {
                resolve(this.allHubConnection);
                return;
            }

            this.allHubConnection = this.signalrService.connect(`all`);
            resolve(this.allHubConnection);
        });
    }

    public getAccountGroupedHub(): Promise<ConnectionContainer> {
        return new Promise<ConnectionContainer>((resolve, reject) => {
            if (this.accountGroupedHubConnection) {
                resolve(this.accountGroupedHubConnection);
                return;
            }

            this.accountService.getAccount()?.pipe(first()).subscribe({
                next: (account) => {
                    this.accountGroupedHubConnection = this.signalrService.connect(`accountGrouped?userId=${account.id}`);
                    resolve(this.accountGroupedHubConnection);
                },
                error: () => {
                    reject();
                }
            });
        });
    }
}
