import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { TransactionsPageRoutingModule } from './transactions-routing.module';
import { TransactionsPage } from './transactions.page';

@NgModule({
  imports: [SharedModule, TransactionsPageRoutingModule],
  declarations: [TransactionsPage],
})
export class TransactionsPageModule {}
