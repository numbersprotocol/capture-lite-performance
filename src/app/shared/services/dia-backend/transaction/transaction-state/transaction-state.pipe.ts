import { Pipe, PipeTransform } from '@angular/core';
import { DiaBackendTransaction } from '../dia-backend-transaction-repository.service';

@Pipe({
  name: 'transactionState',
})
export class TransactionStatePipe implements PipeTransform {
  async transform(
    transaction?: DiaBackendTransaction | null,
    args?: { email?: string | Promise<string> | null; prefix?: string }
  ) {
    const status = await this.getStatus(transaction, args?.email);
    if (args?.prefix) return `${args.prefix}${status}`;
    return status;
  }

  private async getStatus(
    transaction?: DiaBackendTransaction | null,
    email?: string | Promise<string> | null
  ) {
    if (!transaction) return Status.Unknown;
    const resolvedEmail = await email;
    if (transaction.expired) return Status.Returned;
    if (transaction.fulfilled_at) return Status.Accepted;
    if (!resolvedEmail) return Status.Unknown;
    if (transaction.sender === resolvedEmail) return Status.Delivered;
    if (transaction.receiver_email === resolvedEmail) return Status.InProgress;
    return Status.waitingToBeAccepted;
  }
}

const enum Status {
  waitingToBeAccepted = 'waitingToBeAccepted',
  InProgress = 'inProgress',
  Returned = 'returned',
  Delivered = 'delivered',
  Accepted = 'accepted',
  Unknown = 'null',
}
