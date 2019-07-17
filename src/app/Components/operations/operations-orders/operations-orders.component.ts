import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UrlService } from '../../../Services/url.service';
import { MatDialog } from '@angular/material';
import { CreateOperationOrderComponent } from '../../../Modals/create-operation-order/create-operation-order.component';
import { Router } from '@angular/router';

@Component({
    selector: 'app-operations-orders',
    templateUrl: './operations-orders.component.html',
    styleUrls: ['../../../Pages/operations-page/operations-page.component.scss', './operations-orders.component.css']
})
export class OperationsOrdersComponent implements OnInit {
    opordData;

    constructor(private httpClient: HttpClient, private urls: UrlService, private dialog: MatDialog, private router: Router) { }

    ngOnInit() {
        this.getOrders();
    }

    getOrders() {
        this.httpClient.get(this.urls.apiUrl + '/OperationOrder').subscribe(response => {
            this.opordData = response;
        });
    }

    createOpord() {
        this.dialog.open(CreateOperationOrderComponent, {}).afterClosed().subscribe(_ => {
            this.getOrders();
        });
    }

    openOpord(id) {
        this.router.navigate(['/operations/opords/' + id]);
    }
}
