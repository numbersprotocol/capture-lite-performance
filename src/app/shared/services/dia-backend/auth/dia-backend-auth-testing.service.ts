import { Injectable } from '@angular/core';
import { DiaBackendAuthService } from './dia-backend-auth.service';

@Injectable({
  providedIn: 'root',
})
export class DiaBackendAuthTestingService extends DiaBackendAuthService {
  async getAuthHeaders() {
    return { authorization: `token test-token-string` };
  }
}
