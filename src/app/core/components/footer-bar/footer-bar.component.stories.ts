import type { Meta, StoryObj } from '@storybook/angular';

const meta: Meta = {
    title: 'Layout/FooterBar'
};
export default meta;
type Story = StoryObj;

const styles = [
    `.flex-container { display: flex; flex-direction: column; margin: 0; padding: 0; }
    .buttons-container { display: flex; flex-direction: row; justify-content: space-evenly; }
    .buttons-container a i { height: 25px; font-size: 25px; text-align: center; }
    .copyright { min-height: unset; }
    .copyright p { margin: 0; padding: 0; text-align: center; font-size: 10px; line-height: 28px; height: 28px; }
    a { color: white; text-decoration: none; }`
];

export const Default: Story = {
    render: () => ({
        styles,
        template: `
            <div class="flex-container">
                <div class="buttons-container">
                    <a href="#"><i class="fab fa-teamspeak"></i></a>
                    <a href="#"><i class="fab fa-discord"></i></a>
                    <a href="#"><i class="fab fa-facebook"></i></a>
                    <a href="#"><i class="fab fa-instagram"></i></a>
                    <a href="#"><i class="fab fa-youtube"></i></a>
                </div>
                <div class="copyright">
                    <p>&copy; Copyright UKSF 2011-2026</p>
                </div>
            </div>
        `
    })
};
