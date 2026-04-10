import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-toc-list',
    template: `
        <ul>
            @for (node of listData; track node) {
            <li>
                <h4>
                    <a [routerLink]="'/docs/' + node.name">{{ node.name }}</a>
                </h4>
                <app-toc-list [listData]="node.children"></app-toc-list>
            </li>
            }
        </ul>
    `,
    imports: [RouterLink]
})
export class TocList {
    @Input() listData;
}
