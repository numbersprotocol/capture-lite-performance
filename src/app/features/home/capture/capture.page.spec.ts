import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SuperTabsModule } from '@ionic-super-tabs/angular';
import { DiaBackendAssetTestingRepository } from '../../../shared/services/dia-backend/asset/dia-backend-asset-repository-testing.service';
import { DiaBackendAssetRepository } from '../../../shared/services/dia-backend/asset/dia-backend-asset-repository.service';
import { DiaBackendTransactionTestingRepository } from '../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository-testing.service';
import { DiaBackendTransactionRepository } from '../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository.service';
import { SharedTestingModule } from '../../../shared/shared-testing.module';
import { CaptureItemComponent } from './capture-item/capture-item.component';
import { CapturePage } from './capture.page';

describe('CapturePage', () => {
  let component: CapturePage;
  let fixture: ComponentFixture<CapturePage>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [CapturePage, CaptureItemComponent],
        imports: [SharedTestingModule, SuperTabsModule],
        providers: [
          {
            provide: DiaBackendAssetRepository,
            useClass: DiaBackendAssetTestingRepository,
          },
          {
            provide: DiaBackendTransactionRepository,
            useClass: DiaBackendTransactionTestingRepository,
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
