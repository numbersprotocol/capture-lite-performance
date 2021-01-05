import { sha256WithString } from '../../../../utils/crypto/crypto';
import { sortObjectDeeplyByKey } from '../../../../utils/immutable/immutable';
import { MimeType } from '../../../../utils/mime-type';
import { Tuple } from '../../database/table/table';
import { ImageStore } from '../../file-store/image/image-store';

/**
 * - A box containing self-verifiable data.
 * - Easy to serialize and deserialize for data persistence and interchange.
 * - Bundle all immutable information.
 * - Check if proof.documents has image. If true, generate and cache single thumb.
 * - Generate and ID from hash of stringified.
 */
export class Proof {
  static signatureProviders = new Map<string, SignatureVerifier>();

  readonly indexedDocuments: IndexedDocuments = {};

  get timestamp() {
    return this.truth.timestamp;
  }

  get deviceName() {
    return this.getFactValue(DefaultFactId.DEVICE_NAME);
  }

  get geolocationLatitude() {
    return this.getFactValue(DefaultFactId.GEOLOCATION_LATITUDE);
  }

  get geolocationLongitude() {
    return this.getFactValue(DefaultFactId.GEOLOCATION_LONGITUDE);
  }

  private constructor(
    private readonly imageStore: ImageStore,
    readonly truth: Truth,
    readonly signatures: Signatures
  ) {}

  static async from(
    imageStore: ImageStore,
    documents: Documents,
    truth: Truth,
    signatures: Signatures
  ) {
    const proof = new Proof(imageStore, truth, signatures);
    await proof.setDocuments(documents);
    return proof;
  }

  /**
   * Create a Proof from IndexedProofView. This method should only be used when
   * you sure the Proof has already store its raw documents to ImageStore by
   * calling Proof.from() or Proof.parse() before.
   * @param imageStore The singleton ImageStore service.
   * @param indexedProofView The view without documents with base64.
   */
  static fromIndexedProofView(
    imageStore: ImageStore,
    indexedProofView: IndexedProofView
  ) {
    const proof = new Proof(
      imageStore,
      indexedProofView.truth,
      indexedProofView.signatures
    );
    proof.setIndexedDocuments(indexedProofView.indexedDocuments);
    return proof;
  }

  static registerSignatureProvider(id: string, provider: SignatureVerifier) {
    Proof.signatureProviders.set(id, provider);
  }

  static unregisterSignatureProvider(id: string) {
    Proof.signatureProviders.delete(id);
  }

  static async parse(imageStore: ImageStore, json: string) {
    const parsed = JSON.parse(json) as SerializedProof;
    const proof = new Proof(imageStore, parsed.truth, parsed.signatures);
    await proof.setDocuments(parsed.documents);
    return proof;
  }

  private async setDocuments(documents: Documents) {
    const indexedDocumentEntries: [string, DocumentMeta][] = [];
    for (const [base64, meta] of Object.entries(documents)) {
      const index = await this.imageStore.write(base64, meta.mimeType);
      indexedDocumentEntries.push([index, meta]);
    }

    this.setIndexedDocuments(Object.fromEntries(indexedDocumentEntries));
  }

  private setIndexedDocuments(indexedDocuments: IndexedDocuments) {
    // @ts-expect-error: intentionally reassign readonly property
    this.indexedDocuments = indexedDocuments;
    return indexedDocuments;
  }

  async getId() {
    return sha256WithString(await this.stringify());
  }

  async getDocuments() {
    const documentEntries: [string, DocumentMeta][] = [];
    for (const [index, meta] of Object.entries(this.indexedDocuments)) {
      const base64 = await this.imageStore.read(index);
      documentEntries.push([base64, meta]);
    }
    return Object.fromEntries(documentEntries);
  }

  async getThumbnailUrl() {
    const imageDocument = Object.entries(
      this.indexedDocuments
    ).find(([_, meta]) => meta.mimeType.startsWith('image'));
    if (imageDocument === undefined) {
      return undefined;
    }
    const [index] = imageDocument;
    return this.imageStore.getThumbnailUrl(index);
  }

  getFactValue(id: string) {
    return Object.values(this.truth.providers).find(fact => fact[id])?.[id];
  }

  /**
   * Return the stringified Proof following the schema:
   * https://github.com/numbersprotocol/capture-lite/wiki/High-Level-Proof-Schema
   */
  async stringify() {
    const proofProperties: SerializedProof = {
      documents: await this.getDocuments(),
      truth: this.truth,
      signatures: this.signatures,
    };
    return JSON.stringify(
      sortObjectDeeplyByKey(proofProperties as any).toJSON()
    );
  }

  async isVerified() {
    const signedTargets: SignedTargets = {
      documents: await this.getDocuments(),
      truth: this.truth,
    };
    const serializedSortedSignedTargets = getSerializedSortedSignedTargets(
      signedTargets
    );
    const results = await Promise.all(
      Object.entries(this.signatures).map(([id, signature]) =>
        Proof.signatureProviders
          .get(id)
          ?.verify(
            serializedSortedSignedTargets,
            signature.signature,
            signature.publicKey
          )
      )
    );
    return results.every(result => result);
  }

  getIndexedProofView(): IndexedProofView {
    return {
      indexedDocuments: this.indexedDocuments,
      truth: this.truth,
      signatures: this.signatures,
    };
  }

  async destroy() {
    await Promise.all(
      Object.keys(this.indexedDocuments).map(index =>
        this.imageStore.delete(index)
      )
    );
  }
}

export interface Documents {
  readonly [base64: string]: DocumentMeta;
}

interface IndexedDocuments extends Tuple {
  readonly [index: string]: DocumentMeta;
}

export interface DocumentMeta extends Tuple {
  readonly mimeType: MimeType;
}

export interface Truth extends Tuple {
  readonly timestamp: number;
  readonly providers: TruthProviders;
}

interface TruthProviders extends Tuple {
  readonly [id: string]: Facts;
}

export interface Facts extends Tuple {
  readonly [id: string]: boolean | number | string | undefined;
}

export function isFacts(value: any): value is Facts {
  if (!(value instanceof Object)) {
    return false;
  }
  if (
    Object.values(value).some(
      v =>
        typeof v !== 'boolean' &&
        typeof v !== 'number' &&
        typeof v !== 'string' &&
        typeof v !== 'undefined'
    )
  ) {
    return false;
  }
  return true;
}

export const enum DefaultFactId {
  DEVICE_NAME = 'DEVICE_NAME',
  GEOLOCATION_LATITUDE = 'GEOLOCATION_LATITUDE',
  GEOLOCATION_LONGITUDE = 'GEOLOCATION_LONGITUDE',
}

export interface Signatures extends Tuple {
  readonly [id: string]: Signature;
}

export interface Signature extends Tuple {
  readonly signature: string;
  readonly publicKey: string;
}

export function isSignature(value: any): value is Signature {
  if (!(value instanceof Object)) {
    return false;
  }
  if (
    !value.signature ||
    !value.publicKey ||
    typeof value.signature !== 'string' ||
    typeof value.publicKey !== 'string'
  ) {
    return false;
  }
  return true;
}

interface SerializedProof {
  readonly documents: Documents;
  readonly truth: Truth;
  readonly signatures: Signatures;
}

export type SignedTargets = Pick<SerializedProof, 'documents' | 'truth'>;

export function getSerializedSortedSignedTargets(signedTargets: SignedTargets) {
  return JSON.stringify(sortObjectDeeplyByKey(signedTargets as any).toJSON());
}

interface SignatureVerifier {
  verify(
    message: string,
    signature: string,
    publicKey: string
  ): boolean | Promise<boolean>;
}

export interface IndexedProofView extends Tuple {
  readonly indexedDocuments: IndexedDocuments;
  readonly truth: Truth;
  readonly signatures: Signatures;
}
