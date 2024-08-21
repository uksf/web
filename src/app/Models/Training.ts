export interface Training {
    id: string;
    name: string;
    shortName: string;
    teamspeakGroup: string;
}

export interface EditMemberTrainingModalData {
    accountId: string;
    name: string;
    trainings: Training[];
}

export interface EditTrainingItem extends Training {
    selected: boolean;
}
