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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CapturePageRoutingModule {}
