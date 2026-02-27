import { Component, OnInit, Input } from '@angular/core';


@Component({
    selector: 'toc-list',
    template: `
  <ul>
    <li *ngFor="let node of listData">
      <h4><a [routerLink]="'/docs/'+node.name">{{node.name}}</a></h4>
      <toc-list [listData]="node.children"></toc-list>
    </li>
  </ul>
  `,
    standalone: false
})
export class TocList {
    @Input() listData;
}
