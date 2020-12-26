import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SuperTabsModule } from '@ionic-super-tabs/angular';
import { DiaBackendAssetTestingRepository } from '../../../shared/services/dia-backend/asset/dia-backend-asset-repository-testing.service';
import { DiaBackendAssetRepository } from '../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';
import { SharedTestingModule } from '../../../shared/shared-testing.module';
import { CapturePage } from './capture.page';

describe('CapturePage', () => {
  let component: CapturePage;
  let fixture: ComponentFixture<CapturePage>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [CapturePage],
        imports: [SharedTestingModule, SuperTabsModule],
        providers: [
          {
            provide: DiaBackendAssetRepository,
            useClass: DiaBackendAssetTestingRepository,
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(CapturePage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
