import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CapacitorPluginsModule } from './core/capacitor-plugins/capacitor-plugins.module';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CapacitorPluginsModule,
  ],
  exports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
})
export class SharedModule {}
