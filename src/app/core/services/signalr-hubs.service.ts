import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { ConnectionContainer, SignalRService } from './signalr.service';
import { AccountService } from './account.service';

@Injectable()
export class SignalRHubsService implements OnInit, OnDestroy {
    public allHubConnection: ConnectionContainer;
    public accountGroupedHubConnection: ConnectionContainer;

    constructor(private signalrService: SignalRService, private accountService: AccountService) {}

    ngOnInit(): void {}

    ngOnDestroy(): void {
        if (this.allHubConnection) {
            this.allHubConnection.connection.stop().then(() => {
                this.allHubConnection = undefined;
            });
        }

        if (this.accountGroupedHubConnection) {
            this.accountGroupedHubConnection.connection.stop().then(() => {
                this.accountGroupedHubConnection = undefined;
            });
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

            this.accountService.getAccount(
                (account) => {
                    this.accountGroupedHubConnection = this.signalrService.connect(`accountGrouped?userId=${account.id}`);
                    resolve(this.accountGroupedHubConnection);
                },
                () => {
                    reject();
                }
            );
        });
    }
}
