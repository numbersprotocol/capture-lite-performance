import { Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { DiaBackendTransaction } from '../dia-backend-transaction-repository.service';

@Pipe({
  name: 'transactionStatus',
})
export class TransactionStatusPipe implements PipeTransform {
  async transform(
    transaction?: DiaBackendTransaction | null,
    email$?: string | Promise<string> | Observable<string>
  ) {
    if (!transaction) return Status.Unknown;
    const resolvedEmail = await (email$ instanceof Observable
      ? email$.toPromise()
      : email$);
    if (transaction.expired) return Status.Returned;
    if (transaction.fulfilled_at) return Status.Accepted;
    if (!resolvedEmail) return Status.Unknown;
    if (transaction.sender === resolvedEmail) return Status.Delivered;
    if (transaction.receiver_email === resolvedEmail) return Status.InProgress;
    return Status.waitingToBeAccepted;
  }
}

enum Status {
  waitingToBeAccepted = 'waitingToBeAccepted',
  InProgress = 'inProgress',
  Returned = 'returned',
  Delivered = 'delivered',
  Accepted = 'accepted',
  Unknown = 'null',
}
