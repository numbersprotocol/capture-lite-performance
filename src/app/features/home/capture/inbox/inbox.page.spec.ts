import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DiaBackendTransactionTestingRepository } from '../../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository-testing.service';
import { DiaBackendTransactionRepository } from '../../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository.service';
import { SharedTestingModule } from '../../../../shared/shared-testing.module';
import { InboxPage } from './inbox.page';

describe('InboxPage', () => {
  let component: InboxPage;
  let fixture: ComponentFixture<InboxPage>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [InboxPage],
        imports: [SharedTestingModule],
        providers: [
          {
            provide: DiaBackendTransactionRepository,
            useClass: DiaBackendTransactionTestingRepository,
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(InboxPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
