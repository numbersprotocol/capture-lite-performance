// tslint:disable: prefer-function-over-method no-unbound-method
import { TestBed } from '@angular/core/testing';
import { MimeType } from '../../../utils/mime-type';
import { SharedTestingModule } from '../../shared-testing.module';
import {
  DefaultFactId,
  DocumentMeta,
  Documents,
  Facts,
  Signature,
} from '../repositories/proof/proof';
import { ProofRepository } from '../repositories/proof/proof-repository.service';
import { CollectorService } from './collector.service';
import { FactsProvider } from './facts/facts-provider';
import { SignatureProvider } from './signature/signature-provider';

describe('CollectorService', () => {
  let service: CollectorService;
  let proofRepository: ProofRepository;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedTestingModule],
    });
    service = TestBed.inject(CollectorService);
    proofRepository = TestBed.inject(ProofRepository);
    spyOn(console, 'info');
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('should get the stored proof after run', async () => {
    const proof = await service.runAndStore(DOCUMENTS);
    expect(await proof.getDocuments()).toEqual(DOCUMENTS);
  });

  it('should remove added truth providers', async () => {
    service.addFactsProvider(mockFactsProvider);
    service.removeFactsProvider(mockFactsProvider);

    const proof = await service.runAndStore(DOCUMENTS);

    expect(proof.truth.providers).toEqual({});
  });

  it('should remove added signature providers', async () => {
    service.addSignatureProvider(mockSignatureProvider);
    service.removeSignatureProvider(mockSignatureProvider);

    const proof = await service.runAndStore(DOCUMENTS);

    expect(proof.signatures).toEqual({});
  });

  it('should get the stored proof with provided facts', async () => {
    service.addFactsProvider(mockFactsProvider);
    const proof = await service.runAndStore(DOCUMENTS);
    expect(proof.truth.providers).toEqual({ [mockFactsProvider.id]: FACTS });
  });

  it('should get the stored proof with provided signature', async () => {
    service.addSignatureProvider(mockSignatureProvider);
    const proof = await service.runAndStore(DOCUMENTS);
    expect(proof.signatures).toEqual({ [mockSignatureProvider.id]: SIGNATURE });
  });

  it('should store proof with ProofRepository', async () => {
    spyOn(proofRepository, 'add').and.callThrough();

    const proof = await service.runAndStore(DOCUMENTS);

    expect(proofRepository.add).toHaveBeenCalledWith(proof);
  });
});

const DOCUMENT1_MIMETYPE: MimeType = 'image/png';
const DOCUMENT1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAYAAAADCAYAAACwAX77AAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAABAaVRYdENyZWF0aW9uIFRpbWUAAAAAADIwMjDlubTljYHkuIDmnIgxMOaXpSAo6YCx5LqMKSAyMOaZgjU55YiGMzfnp5JnJvHNAAAAFUlEQVQImWM0MTH5z4AFMGETxCsBAHRhAaHOZzVQAAAAAElFTkSuQmCC';
const DOCUMENT1_META: DocumentMeta = { mimeType: DOCUMENT1_MIMETYPE };
const DOCUMENT2_MIMETYPE: MimeType = 'image/png';
const DOCUMENT2_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAABHNCSVQICAgIfAhkiAAAABZJREFUCJlj/Pnz538GJMDEgAYICwAAAbkD8p660MIAAAAASUVORK5CYII=';
const DOCUMENT2_META: DocumentMeta = { mimeType: DOCUMENT2_MIMETYPE };
const DOCUMENTS: Documents = {
  [DOCUMENT1_BASE64]: DOCUMENT1_META,
  [DOCUMENT2_BASE64]: DOCUMENT2_META,
};

const GEOLOCATION_LATITUDE = 22.917923;
const GEOLOCATION_LONGITUDE = 120.859958;
const DEVICE_NAME_VALUE = 'Sony Xperia 1';
const FACTS: Facts = {
  [DefaultFactId.GEOLOCATION_LATITUDE]: GEOLOCATION_LATITUDE,
  [DefaultFactId.GEOLOCATION_LONGITUDE]: GEOLOCATION_LONGITUDE,
  [DefaultFactId.DEVICE_NAME]: DEVICE_NAME_VALUE,
};

class MockFactsProvider implements FactsProvider {
  readonly id = MockFactsProvider.name;
  async provide(_: Documents) {
    return FACTS;
  }
}

const mockFactsProvider = new MockFactsProvider();

const SIGNATURE_VALUE =
  '575cbd72438eec799ffc5d78b45d968b65fd4597744d2127cd21556ceb63dff4a94f409d87de8d1f554025efdf56b8445d8d18e661b79754a25f45d05f4e26ac';
const PUBLIC_KEY =
  '3059301306072a8648ce3d020106082a8648ce3d03010703420004bc23d419027e59bf1eb94c18bfa4ab5fb6ca8ae83c94dbac5bfdfac39ac8ae16484e23b4d522906c4cd8c7cb1a34cd820fb8d065e1b32c8a28320a68fff243f8';
const SIGNATURE: Signature = {
  signature: SIGNATURE_VALUE,
  publicKey: PUBLIC_KEY,
};
class MockSignatureProvider implements SignatureProvider {
  readonly id = MockSignatureProvider.name;
  async provide(_: string) {
    return SIGNATURE;
  }
}

const mockSignatureProvider = new MockSignatureProvider();
