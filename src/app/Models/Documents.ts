export class FolderMetadata {
    id: string;
    parent: string;
    name: string;
    fullPath: string;
    created: Date;
    creator: string;
    readPermissions: DocumentPermissions = new DocumentPermissions();
    writePermissions: DocumentPermissions = new DocumentPermissions();
    documents: DocumentMetadata[] = [];
    canWrite: boolean;
    children: FolderMetadata[] = [];
}

export class DocumentMetadata {
    id: string;
    folder: string;
    name: string;
    fullPath: string;
    created: Date;
    lastUpdated: Date;
    creator: string;
    readPermissions: DocumentPermissions = new DocumentPermissions();
    writePermissions: DocumentPermissions = new DocumentPermissions();
    canWrite: boolean;
}

export class DocumentPermissions {
    units: string[] = [];
    rank: string;
    selectedUnitsOnly: boolean;
}

export class CreateDocumentRequest {
    name: string;
    readPermissions: DocumentPermissions;
    writePermissions: DocumentPermissions;
}

export class CreateFolderRequest {
    parent: string;
    name: string;
    readPermissions: DocumentPermissions;
    writePermissions: DocumentPermissions;
}

export class DocumentContent {
    text: string;
    lastUpdated: Date;
}

export class UpdateDocumentContentRequest {
    newText: string;
    lastKnownUpdated: Date;
}
