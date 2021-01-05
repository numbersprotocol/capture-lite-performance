import { TestBed } from '@angular/core/testing';
import { Plugins } from '@capacitor/core';
import { stringToBase64 } from '../../../../utils/encoding/encoding';
import { MimeType } from '../../../../utils/mime-type';
import { FILESYSTEM_PLUGIN } from '../../../core/capacitor-plugins/capacitor-plugins.module';
import { SharedTestingModule } from '../../../shared-testing.module';
import { CacheStore } from './cache';

const { Filesystem } = Plugins;

describe('CacheStore', () => {
  let store: CacheStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedTestingModule],
      providers: [{ provide: FILESYSTEM_PLUGIN, useValue: Filesystem }],
    });
    store = TestBed.inject(CacheStore);
  });

  afterEach(async () => store.drop());

  it('should be created', () => expect(store).toBeTruthy());

  it('should check if file exists', async () => {
    expect(await store.exists(INDEX)).toBeFalse();
  });

  it('should write file with Base64', async () => {
    const index = await store.write(FILE, MIME_TYPE);
    expect(await store.exists(index)).toBeTrue();
  });

  it('should read file with index', async () => {
    const index = await store.write(FILE, MIME_TYPE);
    expect(await store.read(index)).toEqual(FILE);
  });

  it('should delete file with index', async () => {
    const index = await store.write(FILE, MIME_TYPE);

    await store.delete(index);

    expect(await store.exists(index)).toBeFalse();
  });

  it('should remove all files after drop', async () => {
    const index1 = await store.write(FILE, MIME_TYPE);
    const anotherFile =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEX/TQBcNTh/AAAAAXRSTlPM0jRW/QAAAApJREFUeJxjYgAAAAYAAzY3fKgAAAAASUVORK5CYII=';
    const index2 = await store.write(anotherFile, MIME_TYPE);

    await store.drop();

    expect(await store.exists(index1)).toBeFalse();
    expect(await store.exists(index2)).toBeFalse();
  });

  it('should write atomicly', async () => {
    const fileCount = 100;
    const files = [...Array(fileCount).keys()].map(value =>
      stringToBase64(`${value}`)
    );

    const indexes = await Promise.all(
      files.map(file => store.write(file, MIME_TYPE))
    );

    for (const index of indexes) {
      expect(await store.exists(index)).toBeTrue();
    }
  });

  it('should delete atomicly', async () => {
    const fileCount = 100;
    const files = [...Array(fileCount).keys()].map(value =>
      stringToBase64(`${value}`)
    );
    const indexes = [];

    for (const file of files) {
      indexes.push(await store.write(file, MIME_TYPE));
    }

    await Promise.all(indexes.map(index => store.delete(index)));

    for (const index of indexes) {
      expect(await store.exists(index)).toBeFalse();
    }
  });

  it('should get undefined on reading nonexistent cache with index', async () => {
    expect(await store.readCache(INDEX)).toBeUndefined();
  });

  it('should delete file even if not exists', async () => {
    expect(await store.delete(INDEX)).toEqual(INDEX);
  });

  it('should clear all files', async () => {
    const index = await store.write(FILE, MIME_TYPE);

    await store.clear();

    expect(await store.exists(index)).toBeFalse();
  });
});

const FILE =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const INDEX =
  '93ae7d494fad0fb30cbf3ae746a39c4bc7a0f8bbf87fbb587a3f3c01f3c5ce20';
const MIME_TYPE: MimeType = 'image/png';
