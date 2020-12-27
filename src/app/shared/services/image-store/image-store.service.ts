import { Inject, Injectable } from '@angular/core';
import { FilesystemDirectory, FilesystemPlugin } from '@capacitor/core';
import { Mutex } from 'async-mutex';
import ImageBlobReduce from 'image-blob-reduce';
import { sha256WithBase64 } from '../../../utils/crypto/crypto';
import { base64ToBlob, blobToBase64 } from '../../../utils/encoding/encoding';
import { MimeType, toExtension } from '../../../utils/mime-type';
import { FILESYSTEM_PLUGIN } from '../../core/capacitor-plugins/capacitor-plugins.module';
import { Database } from '../database/database.service';
import { OnConflictStrategy, Tuple } from '../database/table/table';

// TODO: Implement a CacheStore service to cache the thumb and other files, such
//       as the image thumb from backend. User should be able to clear the cache
//       freely. Finally, extract ImageStore.thumbnailTable to CacheStore.

const imageBlobReduce = new ImageBlobReduce();

@Injectable({
  providedIn: 'root',
})
export class ImageStore {
  private readonly directory = FilesystemDirectory.Data;
  private readonly rootDir = ImageStore.name;
  private readonly mutex = new Mutex();
  private hasInitialized = false;
  private readonly extensionTable = this.database.getTable<ImageExtension>(
    `${ImageStore.name}_extension`
  );
  private readonly thumbnailTable = this.database.getTable<Thumbnail>(
    `${ImageStore.name}_thumbnail`
  );

  constructor(
    @Inject(FILESYSTEM_PLUGIN)
    private readonly filesystemPlugin: FilesystemPlugin,
    private readonly database: Database
  ) {}

  private async initialize() {
    return this.mutex.runExclusive(async () => {
      if (this.hasInitialized) {
        return;
      }
      const dirs = await this.filesystemPlugin.readdir({
        directory: this.directory,
        path: '',
      });
      if (!dirs.files.includes(this.rootDir)) {
        await this.filesystemPlugin.mkdir({
          directory: this.directory,
          path: this.rootDir,
          recursive: true,
        });
      }
      this.hasInitialized = true;
    });
  }

  async read(index: string) {
    await this.initialize();
    const extension = await this.getExtension(index);
    const result = await this.filesystemPlugin.readFile({
      directory: this.directory,
      path: `${this.rootDir}/${index}.${extension}`,
    });
    return result.data;
  }

  async write(base64: string, mimeType: MimeType) {
    const index = await sha256WithBase64(base64);
    await this.initialize();
    return this.mutex.runExclusive(async () => {
      const imageExtension = await this.setImageExtension(index, mimeType);
      await this.filesystemPlugin.writeFile({
        directory: this.directory,
        path: `${this.rootDir}/${index}.${imageExtension.extension}`,
        data: base64,
        recursive: true,
      });
      return index;
    });
  }

  async delete(index: string) {
    await this.initialize();
    await this.deleteThumbnail(index);
    return this.mutex.runExclusive(async () => {
      const extension = await this.getExtension(index);
      await this.filesystemPlugin.deleteFile({
        directory: this.directory,
        path: `${this.rootDir}/${index}.${extension}`,
      });
      await this.deleteImageExtension(index);
      return index;
    });
  }

  async exists(index: string) {
    await this.initialize();
    const result = await this.filesystemPlugin.readdir({
      directory: this.directory,
      path: `${this.rootDir}`,
    });
    const extension = await this.getExtension(index);
    return result.files.includes(`${index}.${extension}`);
  }

  async readThumbnail(index: string, mimeType: MimeType) {
    const thumbnail = await this.getThumbnail(index);

    if (thumbnail) {
      return this.read(thumbnail.thumbnailIndex);
    }
    const thumbnailSize = 200;
    const blob = await base64ToBlob(await this.read(index), mimeType);
    const thumbnailBlob = await imageBlobReduce.toBlob(blob, {
      max: thumbnailSize,
    });
    const thumbnailBase64 = await blobToBase64(thumbnailBlob);
    this.thumbnailTable.insert(
      [
        {
          imageIndex: index,
          thumbnailIndex: await this.write(thumbnailBase64, mimeType),
        },
      ],
      OnConflictStrategy.IGNORE
    );
    return thumbnailBase64;
  }

  private async deleteThumbnail(index: string) {
    const thumbnail = await this.getThumbnail(index);

    if (!thumbnail) {
      return index;
    }

    await Promise.all([
      this.delete(thumbnail.thumbnailIndex),
      this.thumbnailTable.delete([thumbnail]),
    ]);
    return index;
  }

  private async getThumbnail(index: string) {
    const thumbnails = await this.thumbnailTable.queryAll();
    return thumbnails.find(thumb => thumb.imageIndex === index);
  }

  async getUri(index: string) {
    await this.initialize();
    const extension = await this.getExtension(index);
    const result = await this.filesystemPlugin.getUri({
      directory: this.directory,
      path: `${this.rootDir}/${index}.${extension}`,
    });
    return result.uri;
  }

  private async getExtension(index: string) {
    return (await this.getImageExtension(index))?.extension;
  }

  private async getImageExtension(index: string) {
    const imageExtensions = await this.extensionTable.queryAll();
    return imageExtensions.find(
      imageExtension => imageExtension.imageIndex === index
    );
  }

  private async setImageExtension(index: string, mimeType: MimeType) {
    return (
      await this.extensionTable.insert(
        [{ imageIndex: index, extension: toExtension(mimeType) }],
        OnConflictStrategy.IGNORE
      )
    )[0];
  }

  private async deleteImageExtension(index: string) {
    const imageExtension = await this.getImageExtension(index);
    if (!imageExtension) {
      return index;
    }
    await this.extensionTable.delete([imageExtension]);
    return index;
  }

  async drop() {
    await this.initialize();
    await this.thumbnailTable.drop();
    return this.mutex.runExclusive(async () => {
      this.hasInitialized = false;
      await this.filesystemPlugin.rmdir({
        directory: this.directory,
        path: this.rootDir,
        recursive: true,
      });
    });
  }
}

interface ImageExtension extends Tuple {
  readonly imageIndex: string;
  readonly extension: string;
}

interface Thumbnail extends Tuple {
  readonly imageIndex: string;
  readonly thumbnailIndex: string;
}
