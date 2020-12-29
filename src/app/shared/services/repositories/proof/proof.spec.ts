import { TestBed } from '@angular/core/testing';
import { SharedTestingModule } from '../../../../shared/shared-testing.module';
import { verifyWithSha256AndEcdsa } from '../../../../utils/crypto/crypto';
import { MimeType } from '../../../../utils/mime-type';
import { ImageStore } from '../../file-store/image/image-store';
import {
  AssetMeta,
  Assets,
  DefaultFactId,
  Facts,
  getSerializedSortedSignedTargets,
  isFacts,
  isSignature,
  Proof,
  Signatures,
  SignedTargets,
  Truth,
} from './proof';

describe('Proof', () => {
  let proof: Proof;
  let imageStore: ImageStore;

  beforeAll(() => {
    Proof.registerSignatureProvider(SIGNATURE_PROVIDER_ID, {
      verify: verifyWithSha256AndEcdsa,
    });
  });

  afterAll(() => Proof.unregisterSignatureProvider(SIGNATURE_PROVIDER_ID));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedTestingModule],
    });
    imageStore = TestBed.inject(ImageStore);
  });

  it('should get the same assets with the parameter of factory method', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    expect(await proof.getAssets()).toEqual(ASSETS);
  });

  it('should get the same truth with the parameter of factory method', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    expect(proof.truth).toEqual(TRUTH);
  });

  it('should get the same signatures with the parameter of factory method', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    expect(proof.signatures).toEqual(SIGNATURES_VALID);
  });

  it('should get the same timestamp with the truth in the parameter of factory method', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    expect(proof.timestamp).toEqual(TRUTH.timestamp);
  });

  it('should get same ID with same properties', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    const another = await Proof.from(
      imageStore,
      ASSETS,
      TRUTH,
      SIGNATURES_VALID
    );
    expect(await proof.getId()).toEqual(await another.getId());
  });

  it('should have thumbnail when its assets have images', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    expect(await proof.getThumbnailUrl()).toBeTruthy();
  });

  it('should not have thumbnail when its assets do not have image', async () => {
    proof = await Proof.from(
      imageStore,
      { aGVsbG8K: { mimeType: 'application/octet-stream' } },
      TRUTH,
      SIGNATURES_VALID
    );
    expect(await proof.getThumbnailUrl()).toBeUndefined();
  });

  it('should get any device name when exists', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    expect(
      proof.deviceName === DEVICE_NAME_VALUE1 ||
        proof.deviceName === DEVICE_NAME_VALUE2
    ).toBeTrue();
  });

  it('should get undefined when device name not exists', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH_EMPTY, SIGNATURES_VALID);
    expect(proof.deviceName).toBeUndefined();
  });

  it('should get any geolocation latitude when exists', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    expect(
      proof.geolocationLatitude === GEOLOCATION_LATITUDE1 ||
        proof.geolocationLatitude === GEOLOCATION_LATITUDE2
    ).toBeTrue();
  });

  it('should get undefined when geolocation latitude not exists', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH_EMPTY, SIGNATURES_VALID);
    expect(proof.geolocationLatitude).toBeUndefined();
  });

  it('should get any geolocation longitude name when exists', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    expect(
      proof.geolocationLongitude === GEOLOCATION_LONGITUDE1 ||
        proof.geolocationLongitude === GEOLOCATION_LONGITUDE2
    ).toBeTrue();
  });

  it('should get undefined when geolocation longitude not exists', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH_EMPTY, SIGNATURES_VALID);
    expect(proof.geolocationLongitude).toBeUndefined();
  });

  it('should get existed fact with ID', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    expect(proof.getFactValue(HUMIDITY)).toEqual(HUMIDITY_VALUE);
  });

  it('should get undefined with nonexistent fact ID', async () => {
    const NONEXISTENT = 'NONEXISTENT';
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    expect(proof.getFactValue(NONEXISTENT)).toBeUndefined();
  });

  it('should stringify to ordered JSON string', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    const ASSETS_DIFFERENT_ORDER: Assets = {
      [ASSET2_BASE64]: ASSET2_META,
      [ASSET1_BASE64]: { mimeType: ASSET1_MIMETYPE },
    };
    const TRUTH_DIFFERENT_ORDER: Truth = {
      providers: {
        [CAPACITOR]: {
          [HUMIDITY]: HUMIDITY_VALUE,
          [DefaultFactId.GEOLOCATION_LONGITUDE]: GEOLOCATION_LONGITUDE2,
          [DefaultFactId.GEOLOCATION_LATITUDE]: GEOLOCATION_LATITUDE2,
          [DefaultFactId.DEVICE_NAME]: DEVICE_NAME_VALUE2,
        },
        [INFO_SNAPSHOT]: {
          [DefaultFactId.GEOLOCATION_LONGITUDE]: GEOLOCATION_LONGITUDE1,
          [DefaultFactId.DEVICE_NAME]: DEVICE_NAME_VALUE1,
          [DefaultFactId.GEOLOCATION_LATITUDE]: GEOLOCATION_LATITUDE1,
        },
      },
      timestamp: TIMESTAMP,
    };
    const proofWithDifferentContentsOrder = await Proof.from(
      imageStore,
      ASSETS_DIFFERENT_ORDER,
      TRUTH_DIFFERENT_ORDER,
      SIGNATURES_VALID
    );
    expect(await proof.stringify()).toEqual(
      await proofWithDifferentContentsOrder.stringify()
    );
  });

  it('should parse from stringified JSON string', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);

    const parsed = await Proof.parse(imageStore, await proof.stringify());

    expect(await parsed.getAssets()).toEqual(ASSETS);
    expect(parsed.truth).toEqual(TRUTH);
    expect(parsed.signatures).toEqual(SIGNATURES_VALID);
  });

  it('should be verified with valid signatures', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    expect(await proof.isVerified()).toBeTrue();
  });

  it('should not be verified with invalid signatures', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_INVALID);
    expect(await proof.isVerified()).toBeFalse();
  });

  it('should get indexed Proof view', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    const indexedProofView = proof.getIndexedProofView();

    expect(indexedProofView.indexedAssets).toBeTruthy();
    expect(indexedProofView.truth).toEqual(TRUTH);
    expect(indexedProofView.signatures).toEqual(SIGNATURES_VALID);
  });

  it('should create Proof from indexed Proof view', async () => {
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    const indexedProofView = proof.getIndexedProofView();

    const anotherProof = Proof.fromIndexedProofView(
      imageStore,
      indexedProofView
    );

    expect(await proof.stringify()).toEqual(await anotherProof.stringify());
  });

  it('should release resource after destroy', async () => {
    const spy = spyOn(imageStore, 'delete');
    proof = await Proof.from(imageStore, ASSETS, TRUTH, SIGNATURES_VALID);
    await proof.destroy();
    expect(spy).toHaveBeenCalled();
  });
});

describe('Proof utils', () => {
  it('should check is Facts', () => {
    expect(isFacts({})).toBeTrue();
    expect(isFacts(FACTS_INFO_SNAPSHOT)).toBeTrue();
    expect(isFacts({ a: undefined })).toBeTrue();
    expect(isFacts(true)).toBeFalse();
    expect(isFacts(2)).toBeFalse();
    expect(isFacts('a')).toBeFalse();
    expect(isFacts({ a: { a: 1 } })).toBeFalse();
  });

  it('should check is Signature', () => {
    expect(isSignature({})).toBeFalse();
    expect(
      isSignature({ signature: VALID_SIGNATURE, publicKey: PUBLIC_KEY })
    ).toBeTrue();
    expect(
      isSignature({ signature: INVALID_SIGNATURE, publicKey: PUBLIC_KEY })
    ).toBeTrue();
    expect(isSignature({ signature: INVALID_SIGNATURE })).toBeFalse();
    expect(isSignature({ publicKey: PUBLIC_KEY })).toBeFalse();
    expect(isSignature(true)).toBeFalse();
    expect(isSignature(2)).toBeFalse();
    expect(isSignature('a')).toBeFalse();
  });

  it('should get serialized sorted SignedTargets', () => {
    const signedTargets: SignedTargets = {
      assets: ASSETS,
      truth: TRUTH,
    };
    // eslint-disable-next-line max-len
    const expected = `{"assets":{"${ASSET2_BASE64}":{"mimeType":"${ASSET2_MIMETYPE}"},"${ASSET1_BASE64}":{"mimeType":"${ASSET1_MIMETYPE}"}},"truth":{"providers":{"${CAPACITOR}":{"${DefaultFactId.DEVICE_NAME}":"${DEVICE_NAME_VALUE2}","${DefaultFactId.GEOLOCATION_LATITUDE}":${GEOLOCATION_LATITUDE2},"${DefaultFactId.GEOLOCATION_LONGITUDE}":${GEOLOCATION_LONGITUDE2},"${HUMIDITY}":${HUMIDITY_VALUE}},"${INFO_SNAPSHOT}":{"${DefaultFactId.DEVICE_NAME}":"${DEVICE_NAME_VALUE1}","${DefaultFactId.GEOLOCATION_LATITUDE}":${GEOLOCATION_LATITUDE1},"${DefaultFactId.GEOLOCATION_LONGITUDE}":${GEOLOCATION_LONGITUDE1}}},"timestamp":${TIMESTAMP}}}`;
    expect(getSerializedSortedSignedTargets(signedTargets)).toEqual(expected);
  });
});

const ASSET1_MIMETYPE: MimeType = 'image/png';
const ASSET1_BASE64 =
  // eslint-disable-next-line max-len
  'iVBORw0KGgoAAAANSUhEUgAAAAYAAAADCAYAAACwAX77AAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAABAaVRYdENyZWF0aW9uIFRpbWUAAAAAADIwMjDlubTljYHkuIDmnIgxMOaXpSAo6YCx5LqMKSAyMOaZgjU55YiGMzfnp5JnJvHNAAAAFUlEQVQImWM0MTH5z4AFMGETxCsBAHRhAaHOZzVQAAAAAElFTkSuQmCC';
const ASSET1_META: AssetMeta = { mimeType: ASSET1_MIMETYPE };
const ASSET2_MIMETYPE: MimeType = 'image/png';
const ASSET2_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAABHNCSVQICAgIfAhkiAAAABZJREFUCJlj/Pnz538GJMDEgAYICwAAAbkD8p660MIAAAAASUVORK5CYII=';
const ASSET2_META: AssetMeta = { mimeType: ASSET2_MIMETYPE };
const ASSETS: Assets = {
  [ASSET1_BASE64]: ASSET1_META,
  [ASSET2_BASE64]: ASSET2_META,
};
const INFO_SNAPSHOT = 'INFO_SNAPSHOT';
const CAPACITOR = 'CAPACITOR';
const GEOLOCATION_LATITUDE1 = 22.917923;
const GEOLOCATION_LATITUDE2 = 23.000213;
const GEOLOCATION_LONGITUDE1 = 120.859958;
const GEOLOCATION_LONGITUDE2 = 120.868472;
const DEVICE_NAME_VALUE1 = 'Sony Xperia 1';
const DEVICE_NAME_VALUE2 = 'xperia1';
const HUMIDITY = 'HUMIDITY';
const HUMIDITY_VALUE = 0.8;
const TIMESTAMP = 1605013013193;
const FACTS_INFO_SNAPSHOT: Facts = {
  [DefaultFactId.GEOLOCATION_LATITUDE]: GEOLOCATION_LATITUDE1,
  [DefaultFactId.GEOLOCATION_LONGITUDE]: GEOLOCATION_LONGITUDE1,
  [DefaultFactId.DEVICE_NAME]: DEVICE_NAME_VALUE1,
};
const TRUTH: Truth = {
  timestamp: TIMESTAMP,
  providers: {
    [INFO_SNAPSHOT]: FACTS_INFO_SNAPSHOT,
    [CAPACITOR]: {
      [DefaultFactId.GEOLOCATION_LATITUDE]: GEOLOCATION_LATITUDE2,
      [DefaultFactId.GEOLOCATION_LONGITUDE]: GEOLOCATION_LONGITUDE2,
      [DefaultFactId.DEVICE_NAME]: DEVICE_NAME_VALUE2,
      [HUMIDITY]: HUMIDITY_VALUE,
    },
  },
};
const TRUTH_EMPTY: Truth = {
  timestamp: TIMESTAMP,
  providers: {},
};
const SIGNATURE_PROVIDER_ID = 'CAPTURE';
const VALID_SIGNATURE =
  '575cbd72438eec799ffc5d78b45d968b65fd4597744d2127cd21556ceb63dff4a94f409d87de8d1f554025efdf56b8445d8d18e661b79754a25f45d05f4e26ac';
const PUBLIC_KEY =
  // eslint-disable-next-line max-len
  '3059301306072a8648ce3d020106082a8648ce3d03010703420004bc23d419027e59bf1eb94c18bfa4ab5fb6ca8ae83c94dbac5bfdfac39ac8ae16484e23b4d522906c4cd8c7cb1a34cd820fb8d065e1b32c8a28320a68fff243f8';
const SIGNATURES_VALID: Signatures = {
  [SIGNATURE_PROVIDER_ID]: {
    signature: VALID_SIGNATURE,
    publicKey: PUBLIC_KEY,
  },
};
const INVALID_SIGNATURE =
  '5d9192a66e2e2b4d22ce69dae407618eb6e052a86bb236bec11a7c154ffe20c0604e392378288340317d169219dfe063c504ed27ea2f47d9ec3868206b1d7f73';
const SIGNATURES_INVALID: Signatures = {
  [SIGNATURE_PROVIDER_ID]: {
    signature: INVALID_SIGNATURE,
    publicKey: PUBLIC_KEY,
  },
};
