import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CapacitorPluginsModule } from './core/capacitor-plugins/capacitor-plugins.module';
import { ImageComponent } from './core/image/image.component';
import { PostCaptureComponent } from './core/post-capture/post-capture.component';

@NgModule({
  declarations: [ImageComponent, PostCaptureComponent],
  imports: [
    CommonModule,
    IonicModule,
    HttpClientModule,
    CapacitorPluginsModule,
  ],
  exports: [CommonModule, IonicModule, ImageComponent, PostCaptureComponent],
})
export class SharedModule {}
