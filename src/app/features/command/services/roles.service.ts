import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlService } from '@app/core/services/url.service';
import { Role, RolesDataset } from '@app/shared/models/role';

const jsonHeaders = new HttpHeaders({ 'Content-Type': 'application/json' });

@Injectable()
export class RolesService {
    constructor(private httpClient: HttpClient, private urls: UrlService) {}

    getRoles(): Observable<RolesDataset> {
        return this.httpClient.get<RolesDataset>(`${this.urls.apiUrl}/roles`);
    }

    checkRoleName(name: string, body: object = {}): Observable<Role | null> {
        return this.httpClient.post<Role | null>(`${this.urls.apiUrl}/roles/${name}`, body);
    }

    addRole(formJson: string): Observable<RolesDataset> {
        return this.httpClient.put<RolesDataset>(`${this.urls.apiUrl}/roles`, formJson, { headers: jsonHeaders });
    }

    editRole(role: Role): Observable<RolesDataset> {
        return this.httpClient.patch<RolesDataset>(`${this.urls.apiUrl}/roles`, role, { headers: jsonHeaders });
    }

    deleteRole(roleId: string): Observable<RolesDataset> {
        return this.httpClient.delete<RolesDataset>(`${this.urls.apiUrl}/roles/${roleId}`);
    }
}
