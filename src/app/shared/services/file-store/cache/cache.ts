import { Inject, Injectable } from '@angular/core';
import { FilesystemDirectory, FilesystemPlugin } from '@capacitor/core';
import { FILESYSTEM_PLUGIN } from '../../../core/capacitor-plugins/capacitor-plugins.module';
import { Database } from '../../database/database.service';
import { FileStoreBase } from '../file-store-base';

@Injectable({
  providedIn: 'root',
})
export class CacheStore extends FileStoreBase {
  constructor(
    @Inject(FILESYSTEM_PLUGIN)
    filesystemPlugin: FilesystemPlugin,
    database: Database
  ) {
    super(
      FilesystemDirectory.Cache,
      CacheStore.name,
      filesystemPlugin,
      database
    );
  }

  async readCache(index: string) {
    if (await this.exists(index)) return this.read(index);
    return undefined;
  }

  async delete(index: string): Promise<string> {
    if (await this.exists(index)) return super.delete(index);
    return index;
  }
}
