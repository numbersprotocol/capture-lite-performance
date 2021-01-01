import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CapturePage } from './capture.page';

const routes: Routes = [
  {
    path: '',
    component: CapturePage,
  },
  {
    path: 'asset',
    loadChildren: () =>
      import('./asset/asset.module').then(m => m.AssetPageModule),
  },
  {
    path: 'transactions',
    loadChildren: () =>
      import('./transactions/transactions.module').then(
        m => m.TransactionsPageModule
      ),
  },
  {
    path: 'inbox',
    loadChildren: () =>
      import('./inbox/inbox.module').then(m => m.InboxPageModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CapturePageRoutingModule {}
