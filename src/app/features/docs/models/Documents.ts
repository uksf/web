export class FolderMetadata {
    id: string;
    parent: string;
    name: string;
    fullPath: string;
    created: Date;
    creator: string;

    owner: string;
    permissions: DocumentPermissions = new DocumentPermissions();
    effectivePermissions: DocumentPermissions = new DocumentPermissions();
    inheritedPermissions: DocumentPermissions = new DocumentPermissions();

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

    owner: string;
    permissions: DocumentPermissions = new DocumentPermissions();
    effectivePermissions: DocumentPermissions = new DocumentPermissions();
    inheritedPermissions: DocumentPermissions = new DocumentPermissions();

    canWrite: boolean;
}

export class DocumentPermissions {
    viewers: DocumentPermission = new DocumentPermission();
    collaborators: DocumentPermission = new DocumentPermission();
}

export class DocumentPermission {
    members: string[] = [];
    units: string[] = [];
    rank: string = '';
    expandToSubUnits: boolean = true;
}

export class CreateDocumentRequest {
    name: string;
    owner: string;
    permissions: DocumentPermissions;
}

export class CreateFolderRequest {
    parent: string;
    name: string;
    owner: string;
    permissions: DocumentPermissions;
}

export class DocumentContent {
    text: string;
    lastUpdated: Date;
}

export class UpdateDocumentContentRequest {
    newText: string;
    lastKnownUpdated: Date;
}
