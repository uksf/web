import { IDropdownElement } from '../Components/elements/dropdown/dropdown.component';

export class Rank {
    name: string;
    abbreviation: string;
    discordRoleId: string;
    order: number;
    teamspeakGroup: string;

    public constructor(element: IDropdownElement) {
        this.name = element.value;
    }

    public static mapToElement(rank: Rank): IDropdownElement {
        return {
            value: rank.name,
            displayValue: rank.name,
        };
    }
}
