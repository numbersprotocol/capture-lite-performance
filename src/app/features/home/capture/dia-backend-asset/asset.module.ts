import { NgModule } from '@angular/core';
import { SharedModule } from '../../../../shared/shared.module';
import { AssetPageRoutingModule } from './asset-routing.module';
import { AssetPage } from './asset.page';

@NgModule({
  imports: [SharedModule, AssetPageRoutingModule],
  declarations: [AssetPage],
})
export class AssetPageModule {}
