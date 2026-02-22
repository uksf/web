import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const meta: Meta = {
    title: 'Layout/AppLayout',
    decorators: [
        moduleMetadata({
            imports: [MatIconModule, MatButtonModule]
        })
    ],
    parameters: {
        layout: 'fullscreen'
    }
};
export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// Theme colors (from palettes.scss dark theme)
// ---------------------------------------------------------------------------
const colors = {
    background: '#121212',
    sideBar: '#1c1c1c',
    appBar: '#242424',
    selected: '#303030',
    hover: '#484848',
    gold: '#fec400',
    footerBar: '#000000',
    scrollThumb: '#484848',
    text: '#ffffff'
};

// ---------------------------------------------------------------------------
// Shared inline styles replicating app.component.scss + child component SCSS
// ---------------------------------------------------------------------------
const layoutStyles = [
    `/* ---- wrapper / grid layout (mirrors app.component.scss) ---- */
    .dark-theme { background: ${colors.background}; color: ${colors.text}; height: 100vh; }
    #wrapper-parent { height: 100%; }
    .wrapper {
        display: grid; height: 100%; min-width: fit-content;
        grid-template-areas: "header header" "sideboard board" "sideboard board";
        grid-template-columns: 225px auto;
        grid-template-rows: 75px 5fr auto;
    }
    .header {
        grid-area: header / header; height: auto;
        box-shadow: 0 2px 2px 0 rgba(0,0,0,0.25);
        z-index: 10; width: 100%; position: fixed;
        background-color: ${colors.appBar};
    }
    .sideboard {
        grid-area: sideboard; position: fixed; z-index: 2;
        width: 225px; height: 100%; padding-top: 75px;
        display: flex; flex-direction: column;
        box-shadow: 0 0 5px 0px #000;
        background-color: ${colors.sideBar};
    }
    .sideboard .side-bar-area { flex: 1; overflow-y: auto; }
    .sideboard .footer { width: 225px; padding-top: 5px; }
    .board {
        grid-area: board; padding: 0;
        display: flex; flex-direction: column; overflow: auto;
        background-color: ${colors.background};
    }
    .small-footer { display: none; background-color: ${colors.footerBar}; }

    /* ---- scrollbar (mirrors styles.scss global) ---- */
    ::-webkit-scrollbar { width: 9px; height: 9px; }
    ::-webkit-scrollbar-track { border-radius: 4px; background-color: ${colors.sideBar}; }
    ::-webkit-scrollbar-thumb { border-radius: 4px; background-color: ${colors.scrollThumb}; }

    /* ---- header-bar ---- */
    .header-wrapper {
        display: flex; flex-direction: row; align-items: center; height: 100%;
    }
    .logo-wrapper {
        font-size: 28px; padding: 0; height: 100%;
        align-items: center; display: flex; flex-direction: row; cursor: pointer;
    }
    .logo { width: 65px; margin-left: 10px; margin-top: 6px; margin-bottom: 4px; }
    .logo-wrapper span { margin-left: 8px; }
    .name-wrapper { height: 75px; line-height: 75px; text-align: center; }
    .name-wrapper span {
        display: inline-block; vertical-align: middle; line-height: normal;
        margin-right: 20px; cursor: pointer;
    }
    .flex-filler { flex: 1 1 auto; }
    .button-wrapper { display: flex; flex-direction: row; align-items: center; height: 100%; }
    .header-button {
        flex: 1; padding: 0 10px 0 5px; margin-right: 10px; min-width: fit-content;
        background-color: ${colors.gold}; color: black; border: none; border-radius: 4px;
        font-size: 14px; height: 36px; cursor: pointer;
        display: flex; align-items: center; gap: 4px;
    }

    /* ---- sidebar nav items ---- */
    .sideNav .sideNavItem {
        padding-left: 30px; display: flex; flex-direction: row;
        line-height: 48px; font-size: large; align-items: center; cursor: pointer;
        color: ${colors.text};
    }
    .sideNav .sideNavItem.selected {
        color: ${colors.gold};
        background-color: ${colors.selected};
        box-shadow: inset 3px 0 0 0 ${colors.gold};
    }
    .sideNav .sideNavItem:hover { background-color: ${colors.hover}; }
    .sideNav .sideNavItem .mat-icon { margin-right: 20px; }
    .sideNav .sideNavItem span { height: 100%; }

    /* ---- footer-bar ---- */
    .footer-flex {
        display: flex; flex-direction: column; margin: 0; padding: 0;
    }
    .footer-buttons {
        display: flex; flex-direction: row; justify-content: space-evenly;
    }
    .footer-buttons a { color: white; text-decoration: none; font-size: 20px; }
    .footer-copyright {
        margin: 0; padding: 0; text-align: center; font-size: 10px;
        line-height: 28px; height: 28px; color: ${colors.text};
    }

    /* ---- board content (filler) ---- */
    .content-filler {
        padding: 24px; min-height: 150vh;
    }
    .content-filler h2 { margin: 0 0 16px; color: ${colors.gold}; }
    .content-block {
        background: ${colors.sideBar}; border-radius: 8px;
        padding: 16px; margin-bottom: 16px;
    }
    .content-block p { margin: 4px 0; opacity: 0.7; }

    /* ======== 1360px ======== */
    @media screen and (max-width: 1360px) {
        .wrapper { grid-template-columns: 200px auto; }
        .sideboard { width: 200px; }
        .sideboard .footer { width: 200px; }
    }

    /* ======== 1024px — sidebar becomes top bar ======== */
    @media screen and (max-width: 1024px) {
        .wrapper {
            grid-template-areas: "header" "sideboard" "board" "small-footer";
            grid-template-columns: 1fr;
            grid-template-rows: auto auto 100% auto;
        }
        .sideboard {
            position: fixed; width: 100%; height: 127px;
        }
        .sideboard .side-bar-area { overflow-y: unset; }
        .sideboard .footer { display: none; }
        .board {
            margin-top: 127px; padding-bottom: 30px;
        }
        .small-footer {
            grid-area: small-footer; display: block;
            padding: 5px 10px; position: fixed;
            bottom: 0; left: 0; width: 100%; z-index: 100;
        }

        /* sidebar horizontal mode */
        .sideNav {
            display: flex; overflow-x: auto; justify-content: center;
        }
        .sideNav::-webkit-scrollbar { height: 4px; }
        .sideNav .sideNavItem {
            padding: 5px 8px; font-size: small;
            flex-direction: column; line-height: unset;
        }
        .sideNav .sideNavItem.selected { box-shadow: unset; }
        .sideNav .sideNavItem .mat-icon { margin: 0; }
        .sideNav .sideNavItem:first-of-type { padding-left: 10px; }
        .sideNav .sideNavItem:last-of-type { padding-right: 10px; }

        /* footer (small) responsive */
        .small-footer .footer-buttons { justify-content: center; }
        .small-footer .footer-buttons a { margin: 0 5px; font-size: 18px; }
        .small-footer .footer-copyright {
            text-align: right; height: 20px; line-height: 20px;
            margin-top: -20px; width: fit-content; margin-left: auto;
        }
    }

    /* ======== 768px ======== */
    @media only screen and (max-width: 768px) {
        .sideboard { padding-top: 46px; height: 90px; }
        .board { margin-top: 90px; }

        /* header stacks */
        .header-wrapper { flex-direction: column; }
        .name-wrapper { display: none; }
        .logo-wrapper {
            position: absolute; left: 0; top: 0;
        }
        .logo-wrapper span { display: none; }
        .logo-wrapper .logo { height: 40px; width: auto; margin: auto; }
        .button-wrapper { height: 100%; margin: 5px 0; }

        /* sidebar items shrink */
        .sideNav .sideNavItem .mat-icon {
            margin: 0; font-size: 20px; height: 20px; width: 20px;
        }
        .sideNav .sideNavItem span { font-size: 10px; }
    }

    /* ======== 600px ======== */
    @media screen and (max-width: 600px) {
        .sideNav { justify-content: flex-start; }
    }

    /* ======== 375px ======== */
    @media screen and (max-width: 375px) {
        .wrapper { grid-template-rows: auto auto 100%; }
        .sideboard { padding-top: 40px; height: 76px; }
        .board { margin-top: 76px; }
        .sideNav .sideNavItem { padding: 8px; }
        .sideNav .sideNavItem span { display: none; }
        .logo-wrapper .logo { height: 36px; }
        .button-wrapper { margin: 0; }
        .small-footer .footer-buttons { justify-content: left; margin: 0 auto 0 0; }
    }`
];

// ---------------------------------------------------------------------------
// Template builders
// ---------------------------------------------------------------------------
function renderHeader(loggedIn: boolean, name?: string) {
    const nameHtml = loggedIn && name
        ? `<div class="name-wrapper"><span>${name}</span></div>`
        : '';
    const buttonHtml = loggedIn
        ? `<button class="header-button"><mat-icon>account_circle</mat-icon></button>`
        : `<button class="header-button"><mat-icon>person</mat-icon> Login</button>`;

    return `
        <div class="header-wrapper">
            <div class="logo-wrapper">
                <img src="assets/dist/images/logolight.png" class="logo" alt="Logo" />
                <span>United Kingdom Special Forces</span>
            </div>
            <div class="flex-filler"></div>
            ${nameHtml}
            <div class="button-wrapper">${buttonHtml}</div>
        </div>`;
}

interface NavItem { icon: string; text: string; selected?: boolean }

function renderSideBar(items: NavItem[]) {
    const itemsHtml = items.map(item =>
        `<div class="sideNavItem ${item.selected ? 'selected' : ''}">
            <mat-icon>${item.icon}</mat-icon>
            <span>${item.text}</span>
        </div>`
    ).join('\n');
    return `<div class="sideNav">${itemsHtml}</div>`;
}

function renderFooter() {
    return `
        <div class="footer-flex">
            <div class="footer-buttons">
                <a href="#">TS</a>
                <a href="#">DC</a>
                <a href="#">FB</a>
                <a href="#">IG</a>
                <a href="#">YT</a>
            </div>
            <p class="footer-copyright">&copy; Copyright UKSF 2011-2026</p>
        </div>`;
}

function renderContent() {
    // Tall content to force scrollbar visibility
    const blocks = Array.from({ length: 8 }, (_, i) =>
        `<div class="content-block">
            <p>Content section ${i + 1}</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        </div>`
    ).join('\n');
    return `<div class="content-filler"><h2>Page Content</h2>${blocks}</div>`;
}

function renderLayout(headerHtml: string, sidebarHtml: string) {
    return `
        <div class="dark-theme" id="wrapper-parent">
            <div class="wrapper">
                <div class="header">${headerHtml}</div>
                <div class="sideboard">
                    <div class="side-bar-area">${sidebarHtml}</div>
                    <div class="footer">${renderFooter()}</div>
                </div>
                <div class="board">${renderContent()}</div>
                <div class="small-footer">${renderFooter()}</div>
            </div>
        </div>`;
}

// ---------------------------------------------------------------------------
// Nav item sets
// ---------------------------------------------------------------------------
const notLoggedInItems: NavItem[] = [
    { icon: 'home', text: 'Home', selected: true }
];

const memberItems: NavItem[] = [
    { icon: 'home', text: 'Home', selected: true },
    { icon: 'assignment_ind', text: 'Profile' },
    { icon: 'extension', text: 'Modpack' },
    { icon: 'people', text: 'Command' },
    { icon: 'all_inbox', text: 'Operations' },
    { icon: 'description', text: 'Docs' },
    { icon: 'person_add', text: 'Recruitment' }
];

const adminItems: NavItem[] = [
    ...memberItems,
    { icon: 'build', text: 'Admin' }
];

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------
export const NotLoggedIn: Story = {
    render: () => ({
        styles: layoutStyles,
        template: renderLayout(
            renderHeader(false),
            renderSideBar(notLoggedInItems)
        )
    })
};

export const Member: Story = {
    render: () => ({
        styles: layoutStyles,
        template: renderLayout(
            renderHeader(true, 'Sgt.Miller.B'),
            renderSideBar(memberItems)
        )
    })
};

export const Admin: Story = {
    render: () => ({
        styles: layoutStyles,
        template: renderLayout(
            renderHeader(true, 'Maj.Admin.A'),
            renderSideBar(adminItems)
        )
    })
};
