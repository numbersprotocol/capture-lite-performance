import { TestBed } from '@angular/core/testing';
import { DiaBackendAuthTestingService } from '../../services/dia-backend/auth/dia-backend-auth-testing.service';
import { DiaBackendAuthService } from '../../services/dia-backend/auth/dia-backend-auth.service';
import { SharedTestingModule } from '../../shared-testing.module';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedTestingModule],
      providers: [
        {
          provide: DiaBackendAuthService,
          useClass: DiaBackendAuthTestingService,
        },
      ],
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
