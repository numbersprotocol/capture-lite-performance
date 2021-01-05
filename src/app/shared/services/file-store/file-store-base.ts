import { FilesystemDirectory, FilesystemPlugin } from '@capacitor/core';
import { Mutex } from 'async-mutex';
import { sha256WithBase64 } from '../../../utils/crypto/crypto';
import { MimeType, toExtension } from '../../../utils/mime-type';
import { Database } from '../database/database.service';
import { OnConflictStrategy, Tuple } from '../database/table/table';
import { FileStore } from './file-store';

export class FileStoreBase implements FileStore {
  private readonly mutex = new Mutex();
  private hasInitialized = false;
  private readonly rootDir = `${FileStoreBase.name}/${this.id}`;
  private readonly mimeTypeTable = this.database.getTable<FileMimeType>(
    `${this.id}_mimeType`
  );

  constructor(
    private readonly directory: FilesystemDirectory,
    readonly id: string,
    protected readonly filesystemPlugin: FilesystemPlugin,
    protected readonly database: Database
  ) {}

  private async initialize() {
    return this.mutex.runExclusive(async () => {
      if (this.hasInitialized) return;
      await this.mkDirIfNotExist('', FileStoreBase.name);
      await this.mkDirIfNotExist(FileStoreBase.name, this.id);
      this.hasInitialized = true;
    });
  }

  private async mkDirIfNotExist(path: string, name: string) {
    const dirs = await this.filesystemPlugin.readdir({
      directory: this.directory,
      path,
    });
    if (!dirs.files.includes(name)) {
      await this.filesystemPlugin.mkdir({
        directory: this.directory,
        path: `${path}/${name}`,
        recursive: true,
      });
    }
  }

  async read(index: string): Promise<string> {
    await this.initialize();
    const extension = await this.getExtension(index);
    const result = await this.filesystemPlugin.readFile({
      directory: this.directory,
      path: `${this.rootDir}/${index}${extension ? '.' : ''}${extension ?? ''}`,
    });
    return result.data;
  }

  async getMimeType(index: string) {
    const fileMimeTypes = await this.mimeTypeTable.queryAll();
    const fileMimeType = fileMimeTypes.find(
      fileMimeType => fileMimeType.index === index
    );
    return fileMimeType?.mimeType;
  }

  async write(base64: string, mimeType: MimeType): Promise<string> {
    const index = await sha256WithBase64(base64);
    await this.initialize();
    return this.mutex.runExclusive(async () => {
      await this.setExtension(index, mimeType);
      await this.filesystemPlugin.writeFile({
        directory: this.directory,
        path: `${this.rootDir}/${index}.${toExtension(mimeType)}`,
        data: base64,
        recursive: true,
      });
      return index;
    });
  }

  async delete(index: string): Promise<string> {
    await this.initialize();
    return this.mutex.runExclusive(async () => {
      const extension = await this.getExtension(index);
      await this.filesystemPlugin.deleteFile({
        directory: this.directory,
        path: `${this.rootDir}/${index}${extension ? '.' : ''}${
          extension ?? ''
        }`,
      });
      await this.deleteFileExtension(index);
      return index;
    });
  }

  async exists(index: string): Promise<boolean> {
    await this.initialize();
    const result = await this.filesystemPlugin.readdir({
      directory: this.directory,
      path: `${this.rootDir}`,
    });
    const extension = await this.getExtension(index);
    return result.files.includes(
      `${index}${extension ? '.' : ''}${extension ?? ''}`
    );
  }

  async clear(): Promise<void> {
    await this.initialize();
    await this.mimeTypeTable.clear();
    return this.mutex.runExclusive(async () => {
      this.hasInitialized = false;
      await this.filesystemPlugin.rmdir({
        directory: this.directory,
        path: this.rootDir,
        recursive: true,
      });
    });
  }

  async drop(): Promise<void> {
    await this.clear();
    return this.mimeTypeTable.drop();
  }

  private async getExtension(index: string) {
    const mimeType = await this.getMimeType(index);
    if (!mimeType) return undefined;
    return toExtension(mimeType);
  }

  private async setExtension(index: string, mimeType: MimeType) {
    return (
      await this.mimeTypeTable.insert(
        [{ index, mimeType }],
        OnConflictStrategy.IGNORE
      )
    )[0];
  }

  private async deleteFileExtension(index: string) {
    const fileMimeTypes = await this.mimeTypeTable.queryAll();
    const mimeType = fileMimeTypes.find(
      fileMimeType => fileMimeType.index === index
    );
    if (!mimeType) return index;
    await this.mimeTypeTable.delete([mimeType]);
    return index;
  }
}

interface FileMimeType extends Tuple {
  readonly index: string;
  readonly mimeType: MimeType;
}
