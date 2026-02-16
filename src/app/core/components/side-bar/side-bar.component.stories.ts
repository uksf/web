import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { MatIconModule } from '@angular/material/icon';

const meta: Meta = {
    title: 'Layout/SideBar',
    decorators: [
        moduleMetadata({
            imports: [MatIconModule]
        })
    ]
};
export default meta;
type Story = StoryObj;

const styles = [
    `.sideNav { width: 250px; }
    .sideNavItem {
        padding-left: 30px; display: flex; flex-direction: row;
        line-height: 48px; font-size: large; align-items: center; cursor: pointer;
    }
    .sideNavItem .mat-icon { margin-right: 20px; transform: rotate(0.03deg); }
    .sideNavItem span { height: 100%; }
    .sideNavItem.selected { background-color: rgba(255,255,255,0.05); }
    .sideNavItem:hover { background-color: rgba(255,255,255,0.08); }`
];

const notLoggedInItems = [
    { icon: 'home', text: 'Home', link: '/home' }
];

const memberItems = [
    { icon: 'home', text: 'Home', link: '/home' },
    { icon: 'assignment_ind', text: 'Profile', link: '/profile' },
    { icon: 'extension', text: 'Modpack', link: '/modpack' },
    { icon: 'people', text: 'Command', link: '/command' },
    { icon: 'all_inbox', text: 'Operations', link: '/operations' },
    { icon: 'description', text: 'Docs', link: '/docs' },
    { icon: 'person_add', text: 'Recruitment', link: '/recruitment' }
];

const adminItems = [
    { icon: 'home', text: 'Home', link: '/home' },
    { icon: 'assignment_ind', text: 'Profile', link: '/profile' },
    { icon: 'extension', text: 'Modpack', link: '/modpack' },
    { icon: 'people', text: 'Command', link: '/command' },
    { icon: 'all_inbox', text: 'Operations', link: '/operations' },
    { icon: 'description', text: 'Docs', link: '/docs' },
    { icon: 'person_add', text: 'Recruitment', link: '/recruitment' },
    { icon: 'build', text: 'Admin', link: '/admin' }
];

function renderSideBar(items: { icon: string; text: string; link: string }[], selectedLink = '/home') {
    const itemsHtml = items.map(item =>
        `<div class="sideNavItem ${item.link === selectedLink ? 'selected' : ''}">
            <mat-icon>${item.icon}</mat-icon>
            <span>${item.text}</span>
        </div>`
    ).join('\n');

    return `<div class="sideNav">${itemsHtml}</div>`;
}

export const NotLoggedIn: Story = {
    render: () => ({
        styles,
        template: renderSideBar(notLoggedInItems)
    })
};

export const Member: Story = {
    render: () => ({
        styles,
        template: renderSideBar(memberItems, '/command')
    })
};

export const Admin: Story = {
    render: () => ({
        styles,
        template: renderSideBar(adminItems, '/admin')
    })
};
