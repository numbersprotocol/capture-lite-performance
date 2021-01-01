import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DiaBackendTransactionTestingRepository } from '../../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository-testing.service';
import { DiaBackendTransactionRepository } from '../../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository.service';
import { SharedTestingModule } from '../../../../shared/shared-testing.module';
import { TransactionsPage } from './transactions.page';

describe('TransactionsPage', () => {
  let component: TransactionsPage;
  let fixture: ComponentFixture<TransactionsPage>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [TransactionsPage],
        imports: [SharedTestingModule],
        providers: [
          {
            provide: DiaBackendTransactionRepository,
            useClass: DiaBackendTransactionTestingRepository,
          },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(TransactionsPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
