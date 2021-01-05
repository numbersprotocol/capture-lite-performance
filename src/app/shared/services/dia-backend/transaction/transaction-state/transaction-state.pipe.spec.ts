import { TransactionStatePipe } from './transaction-state.pipe';

describe('TransactionStatusPipe', () => {
  it('create an instance', () => {
    const pipe = new TransactionStatePipe();
    expect(pipe).toBeTruthy();
  });
});
