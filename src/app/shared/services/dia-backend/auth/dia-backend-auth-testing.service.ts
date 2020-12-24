import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PreferenceManager } from '../../preference-manager/preference-manager.service';
import { DiaBackendAuthService } from './dia-backend-auth.service';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendAuthTestingService extends DiaBackendAuthService {
  constructor(httpClient: HttpClient, preferenceManager: PreferenceManager) {
    super(httpClient, preferenceManager);
  }

  async getAuthHeaders() {
    return { authorization: `token test-token-string` };
  }
}
