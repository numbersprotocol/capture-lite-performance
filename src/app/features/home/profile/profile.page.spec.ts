import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DiaBackendAuthTestingService } from '../../../shared/services/dia-backend/auth/dia-backend-auth-testing.service';
import { DiaBackendAuthService } from '../../../shared/services/dia-backend/auth/dia-backend-auth.service';
import { SharedTestingModule } from '../../../shared/shared-testing.module';
import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [ProfilePage],
        imports: [SharedTestingModule],
        providers: [
          {
            provide: DiaBackendAuthService,
            useClass: DiaBackendAuthTestingService,
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ProfilePage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
