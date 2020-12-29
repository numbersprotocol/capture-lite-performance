import { NgModule } from '@angular/core';
import { SuperTabsModule } from '@ionic-super-tabs/angular';
import { SharedModule } from '../../../shared/shared.module';
import { CaptureItemComponent } from './capture-item/capture-item.component';
import { CapturePageRoutingModule } from './capture-routing.module';
import { CapturePage } from './capture.page';

@NgModule({
  imports: [SharedModule, CapturePageRoutingModule, SuperTabsModule],
  declarations: [CapturePage, CaptureItemComponent],
})
export class CapturePageModule {}
