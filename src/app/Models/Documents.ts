export class FolderMetadata {
    id: string;
    parent: string;
    name: string;
    fullPath: string;
    created: Date;
    creator: string;
    
    // NEW: Role-based permissions
    owner: string;
    roleBasedPermissions: RoleBasedDocumentPermissions = new RoleBasedDocumentPermissions();
    effectivePermissions: RoleBasedDocumentPermissions = new RoleBasedDocumentPermissions();
    inheritedPermissions: RoleBasedDocumentPermissions = new RoleBasedDocumentPermissions();
    
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
    
    // NEW: Role-based permissions
    owner: string;
    roleBasedPermissions: RoleBasedDocumentPermissions = new RoleBasedDocumentPermissions();
    effectivePermissions: RoleBasedDocumentPermissions = new RoleBasedDocumentPermissions();
    inheritedPermissions: RoleBasedDocumentPermissions = new RoleBasedDocumentPermissions();
    
    canWrite: boolean;
}

export class RoleBasedDocumentPermissions {
    viewers: PermissionRole = new PermissionRole();
    collaborators: PermissionRole = new PermissionRole();
}

export class PermissionRole {
    units: string[] = [];
    rank: string = '';
    expandToSubUnits: boolean = true;
}

export class CreateDocumentRequest {
    name: string;
    owner: string;
    roleBasedPermissions: RoleBasedDocumentPermissions;
}

export class CreateFolderRequest {
    parent: string;
    name: string;
    owner: string;
    roleBasedPermissions: RoleBasedDocumentPermissions;
}

export class DocumentContent {
    text: string;
    lastUpdated: Date;
}

export class UpdateDocumentContentRequest {
    newText: string;
    lastKnownUpdated: Date;
}
