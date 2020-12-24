import { NgModule } from '@angular/core';
import { SuperTabsModule } from '@ionic-super-tabs/angular';
import { SharedModule } from '../../../shared/shared.module';
import { CapturePageRoutingModule } from './capture-routing.module';
import { CapturePage } from './capture.page';

@NgModule({
  imports: [SharedModule, CapturePageRoutingModule, SuperTabsModule],
  declarations: [CapturePage],
})
export class CapturePageModule {}
