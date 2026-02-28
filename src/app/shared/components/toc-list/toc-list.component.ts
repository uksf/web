import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'toc-list',
    template: `
        <ul>
            @for (node of listData; track node) {
            <li>
                <h4>
                    <a [routerLink]="'/docs/' + node.name">{{ node.name }}</a>
                </h4>
                <toc-list [listData]="node.children"></toc-list>
            </li>
            }
        </ul>
    `,
    imports: [RouterLink]
})
export class TocList {
    @Input() listData;
}
