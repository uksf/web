import { animate, AnimationTriggerMetadata, state, style, transition, trigger } from '@angular/animations';

export const expansionAnimations: {
    readonly indicatorRotate: AnimationTriggerMetadata;
    readonly bodyExpansion: AnimationTriggerMetadata;
} = {
    /** Animation that rotates the indicator arrow. */
    indicatorRotate: trigger('indicatorRotate', [
        state('collapsed, void', style({ transform: 'rotate(0deg)' })),
        state('expanded', style({ transform: 'rotate(180deg)' })),
        transition('expanded <=> collapsed, void => collapsed', animate('200ms cubic-bezier(0.4,0.0,0.2,1)'))
    ]),

    /** Animation that expands and collapses the panel content. */
    bodyExpansion: trigger('bodyExpansion', [
        transition(':enter', [
            style({
                height: '0',
                visibility: 'hidden'
            }),
            animate('150ms cubic-bezier(0.4,0.0,0.2,1)', style({ height: '*', visibility: 'visible' }))
        ]),
        transition(':leave', [
            style({
                height: '*',
                visibility: 'visible'
            }),
            animate('150ms cubic-bezier(0.4,0.0,0.2,1)', style({ height: '0', visibility: 'hidden' }))
        ])
    ])
};

export const folderAnimations: {
    readonly indicatorRotate: AnimationTriggerMetadata;
    readonly folderExpansion: AnimationTriggerMetadata;
} = {
    /** Animation that rotates the indicator arrow. */
    indicatorRotate: trigger('indicatorRotate', [
        state('collapsed, void', style({ transform: 'rotate(-90deg)' })),
        state('expanded', style({ transform: 'rotate(0deg)' })),
        transition('expanded <=> collapsed, void => collapsed', animate('100ms cubic-bezier(0.4,0.0,0.2,1)'))
    ]),

    /** Animation that expands and collapses the panel content. */
    folderExpansion: trigger('folderExpansion', [
        transition(':enter', [
            style({
                height: '0',
                visibility: 'hidden'
            }),
            animate('0ms cubic-bezier(0.4,0.0,0.2,1)', style({ height: '*', visibility: 'visible' }))
        ]),
        transition(':leave', [
            style({
                height: '*',
                visibility: 'visible'
            }),
            animate('0ms cubic-bezier(0.4,0.0,0.2,1)', style({ height: '0', visibility: 'hidden' }))
        ])
    ])
};
