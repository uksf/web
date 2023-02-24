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

export const collapseAnimations: {
    readonly indicatorRotate: AnimationTriggerMetadata;
    readonly buttonExpansion: AnimationTriggerMetadata;
    readonly buttonTranslate: AnimationTriggerMetadata;
    readonly collapsed: AnimationTriggerMetadata;
} = {
    /** Animation that rotates the indicator arrow. */
    indicatorRotate: trigger('indicatorRotate', [
        state('collapsed', style({ transform: 'rotate(270deg)' })),
        state('expanded', style({ transform: 'rotate(90deg)' })),
        transition('expanded <=> collapsed', animate('100ms cubic-bezier(0.4,0.0,0.2,1)'))
    ]),

    /** Animation that expands and collapses the button. */
    buttonExpansion: trigger('buttonExpansion', [
        state(
            'expanded',
            style({
                width: '48px'
            })
        ),
        state(
            'collapsed',
            style({
                width: '24px'
            })
        ),
        transition('expanded <=> collapsed', [animate('0.1s')])
    ]),
    buttonTranslate: trigger('buttonTranslate', [
        state(
            'expanded',
            style({
                transform: 'translateX(300px)'
            })
        ),
        state(
            'collapsed',
            style({
                transform: 'translateX(0px)'
            })
        ),
        transition('expanded <=> collapsed', [animate('500ms cubic-bezier(0,0.2,0.0,1)')])
    ]),
    collapsed: trigger('collapsed', [
        state(
            'expanded',
            style({
                width: '300px',
                visibility: 'visible'
            })
        ),
        state(
            'collapsed',
            style({
                width: '0',
                visibility: 'hidden'
            })
        ),
        transition('expanded <=> collapsed', [animate('500ms cubic-bezier(0,0.2,0,1)')])
    ])
};
