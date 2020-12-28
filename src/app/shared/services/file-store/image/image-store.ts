import { Inject, Injectable } from '@angular/core';
import { FilesystemDirectory, FilesystemPlugin } from '@capacitor/core';
import ImageBlobReduce from 'image-blob-reduce';
import {
  base64ToBlob,
  blobToBase64,
} from '../../../../utils/encoding/encoding';
import { MimeType } from '../../../../utils/mime-type';
import { FILESYSTEM_PLUGIN } from '../../../core/capacitor-plugins/capacitor-plugins.module';
import { Database } from '../../database/database.service';
import { OnConflictStrategy, Tuple } from '../../database/table/table';
import { CacheStore } from '../cache/cache';
import { FileStoreBase } from '../file-store-base';

const imageBlobReduce = new ImageBlobReduce();

@Injectable({
  providedIn: 'root',
})
export class ImageStore extends FileStoreBase {
  private readonly thumbnailRefTable = this.database.getTable<ThumbnailRef>(
    `${this.id}_thumbnailRef`
  );

  constructor(
    @Inject(FILESYSTEM_PLUGIN)
    filesystemPlugin: FilesystemPlugin,
    database: Database,
    private readonly thumbnailStore: CacheStore
  ) {
    super(
      FilesystemDirectory.Data,
      ImageStore.name,
      filesystemPlugin,
      database
    );
  }

  async delete(index: string) {
    await this.deleteThumbnail(index);
    return super.delete(index);
  }

  private async deleteThumbnail(index: string) {
    const thumbnailRef = await this.getThumbnailRef(index);
    if (!thumbnailRef) return;

    await this.thumbnailStore.delete(thumbnailRef.thumbnailIndex);
    await this.thumbnailRefTable.delete([thumbnailRef]);
    return index;
  }

  async readThumbnail(index: string, mimeType: MimeType) {
    const thumbnailRef = await this.getThumbnailRef(index);

    if (thumbnailRef) {
      return this.thumbnailStore.read(thumbnailRef.thumbnailIndex);
    }
    const thumbnailSize = 100;
    const blob = await base64ToBlob(await this.read(index), mimeType);
    const thumbnailBlob = await imageBlobReduce.toBlob(blob, {
      max: thumbnailSize,
    });
    const thumbnailBase64 = await blobToBase64(thumbnailBlob);
    await this.thumbnailRefTable.insert(
      [
        {
          imageIndex: index,
          thumbnailIndex: await this.thumbnailStore.write(
            thumbnailBase64,
            mimeType
          ),
        },
      ],
      OnConflictStrategy.IGNORE
    );
    return thumbnailBase64;
  }

  private async getThumbnailRef(index: string) {
    const thumbnails = await this.thumbnailRefTable.queryAll();
    return thumbnails.find(thumbnail => thumbnail.imageIndex === index);
  }

  async drop() {
    await this.thumbnailRefTable.drop();
    await this.thumbnailStore.drop();
    return super.drop();
  }
}

interface ThumbnailRef extends Tuple {
  readonly imageIndex: string;
  readonly thumbnailIndex: string;
}
