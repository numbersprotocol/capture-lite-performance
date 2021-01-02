import { Pipe, PipeTransform } from '@angular/core';
import { DiaBackendTransaction } from '../dia-backend-transaction-repository.service';

@Pipe({
  name: 'transactionStatus',
})
export class TransactionStatusPipe implements PipeTransform {
  async transform(
    transaction: DiaBackendTransaction,
    email?: string | Promise<string>
  ) {
    const resolvedEmail = await email;
    if (transaction.expired) {
      return Status.Returned;
    }
    if (!transaction.fulfilled_at) {
      if (transaction.receiver_email === resolvedEmail) {
        return Status.InProgress;
      }
      return Status.waitingToBeAccepted;
    }
    if (transaction.sender === resolvedEmail) {
      return Status.Delivered;
    }
    return Status.Accepted;
  }
}

enum Status {
  waitingToBeAccepted = 'waitingToBeAccepted',
  InProgress = 'inProgress',
  Returned = 'returned',
  Delivered = 'delivered',
  Accepted = 'accepted',
}
