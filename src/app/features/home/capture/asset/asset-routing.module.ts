import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AssetPage } from './asset.page';

const routes: Routes = [
  {
    path: '',
    component: AssetPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AssetPageRoutingModule {}
