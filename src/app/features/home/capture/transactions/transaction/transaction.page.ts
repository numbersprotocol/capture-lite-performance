import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first, map, shareReplay, switchMap } from 'rxjs/operators';
import { DiaBackendAuthService } from '../../../../../shared/services/dia-backend/auth/dia-backend-auth.service';
import { DiaBackendTransactionRepository } from '../../../../../shared/services/dia-backend/transaction/dia-backend-transaction-repository.service';
import { isNonNullable } from '../../../../../utils/rx-operators/rx-operators';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.page.html',
  styleUrls: ['./transaction.page.scss'],
})
export class TransactionPage {
  readonly transaction$ = this.route.paramMap.pipe(
    map(params => params.get('id')),
    isNonNullable(),
    switchMap(id => this.diaBackendTransactionRepository.fetchById$(id)),
    first(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly email$ = this.diaBackendAuthService.email$;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly diaBackendTransactionRepository: DiaBackendTransactionRepository,
    private readonly diaBackendAuthService: DiaBackendAuthService
  ) {}
}
