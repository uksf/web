import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '@app/core/services/url.service';
import { MatDialog } from '@angular/material/dialog';
import { CreateOperationOrderComponent } from '../../modals/create-operation-order/create-operation-order.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-operations-orders',
    templateUrl: './operations-orders.component.html',
    styleUrls: ['../operations-page/operations-page.component.scss', './operations-orders.component.scss']
})
export class OperationsOrdersComponent implements OnInit {
    opordData;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private router: Router) { }

    ngOnInit() {
        this.getOrders();
    }

    getOrders() {
        this.httpClient.get(this.urls.apiUrl + '/OperationOrder').subscribe({
            next: (response) => {
                this.opordData = response;
            }
        });
    }

    createOpord() {
        this.dialog.open(CreateOperationOrderComponent, {}).afterClosed().subscribe({
            next: () => {
                this.getOrders();
            }
        });
    }

    openOpord(id) {
        this.router.navigate(['/operations/opords/' + id]);
    }
}
