import { flow, groupBy, mapValues } from 'lodash-es';
import { blobToBase64 } from '../../../../utils/encoding/encoding';
import { MimeType } from '../../../../utils/mime-type';
import { Tuple } from '../../database/table/table';
import { ImageStore } from '../../file-store/image/image-store';
import { DefaultFactId, Proof } from './proof';

/**
 * Only for migration and connection to backend. Subject to change.
 * Proof = OldProof + Information + Signatures
 * Proof can generate:
 *   1. OldProof
 *   2. Information List
 *   3. Signatures
 *   4. SortedProofInformation
 *   5. EssentialInformation List
 */

export function getOldProof(proof: Proof): OldProof {
  return {
    mimeType: Object.values(proof.indexedDocuments)[0].mimeType,
    timestamp: proof.timestamp,
    hash: Object.keys(proof.indexedDocuments)[0],
  };
}

export async function getSortedProofInformation(
  proof: Proof
): Promise<SortedProofInformation> {
  return {
    proof: getOldProof(proof),
    information: createSortedEssentialInformation(proof).map(info => ({
      provider: info.provider,
      name: replaceDefaultFactIdWithOldDefaultInformationName(info.name),
      value: info.value,
    })),
  };
}

export function replaceDefaultFactIdWithOldDefaultInformationName(
  name: string
): string {
  if (name === DefaultFactId.DEVICE_NAME) {
    return OldDefaultInformationName.DEVICE_NAME;
  }
  if (name === DefaultFactId.GEOLOCATION_LATITUDE) {
    return OldDefaultInformationName.GEOLOCATION_LATITUDE;
  }
  if (name === DefaultFactId.GEOLOCATION_LONGITUDE) {
    return OldDefaultInformationName.GEOLOCATION_LONGITUDE;
  }
  return name;
}

function createSortedEssentialInformation(
  proof: Proof
): OldEssentialInformation[] {
  return Object.entries(proof.truth.providers)
    .flatMap(([providerId, facts]) =>
      Object.entries(facts).map(([id, value]) => ({
        provider: providerId,
        name: id,
        value: `${value}`,
      }))
    )
    .sort((a, b) => {
      const providerCompared = a.provider.localeCompare(b.provider);
      const nameCompared = a.name.localeCompare(b.name);
      const valueCompared = a.value.localeCompare(b.value);

      if (providerCompared !== 0) {
        return providerCompared;
      }
      if (nameCompared !== 0) {
        return nameCompared;
      }
      return valueCompared;
    });
}

export function getOldSignatures(proof: Proof): OldSignature[] {
  const documentHash = Object.keys(proof.indexedDocuments)[0];
  return Object.entries(proof.signatures).map(
    ([provider, { signature, publicKey }]) => ({
      provider,
      proofHash: documentHash,
      signature,
      publicKey,
    })
  );
}

export async function getProof(
  imageStore: ImageStore,
  raw: Blob,
  sortedProofInformation: SortedProofInformation,
  oldSignatures: OldSignature[]
): Promise<Proof> {
  const base64 = await blobToBase64(raw);
  const groupedByProvider = groupObjectsBy(
    sortedProofInformation.information.map(info => ({
      provider: info.provider,
      name: replaceOldDefaultInformationNameWithDefaultFactId(info.name),
      value: info.value,
    })),
    'provider'
  );
  const providers = flow(
    (
      groupedByProvider: Record<
        string,
        Omit<OldEssentialInformation, 'provider'>[]
      >
    ) => mapValues(groupedByProvider, value => groupObjectsBy(value, 'name')),
    groupedValueByName =>
      mapValues(groupedValueByName, value =>
        mapValues(value, arr => toNumberOrBoolean(arr[0].value))
      )
  )(groupedByProvider);
  const signatures = flow(
    (oldSignatures: OldSignature[]) =>
      groupObjectsBy(oldSignatures, 'provider'),
    grouped =>
      mapValues(grouped, values => ({
        signature: values[0].signature as string,
        publicKey: values[0].publicKey as string,
      }))
  )(oldSignatures);

  return Proof.from(
    imageStore,
    { [base64]: { mimeType: raw.type as MimeType } },
    { timestamp: sortedProofInformation.proof.timestamp, providers },
    signatures
  );
}

export function replaceOldDefaultInformationNameWithDefaultFactId(
  name: string
): string {
  if (name === OldDefaultInformationName.DEVICE_NAME) {
    return DefaultFactId.DEVICE_NAME;
  }
  if (name === OldDefaultInformationName.GEOLOCATION_LATITUDE) {
    return DefaultFactId.GEOLOCATION_LATITUDE;
  }
  if (name === OldDefaultInformationName.GEOLOCATION_LONGITUDE) {
    return DefaultFactId.GEOLOCATION_LONGITUDE;
  }
  return name;
}

/**
 * Group by the key. The returned collection without the original key property.
 */
function groupObjectsBy<T extends Record<string, any>, K extends keyof T>(
  objects: T[],
  key: K
): Record<string, Omit<T, K>[]> {
  return flow(
    (objects: T[]) => groupBy(objects, key),
    grouped =>
      mapValues(grouped, values =>
        values.map(value => {
          delete value[key];
          return value;
        })
      )
  )(objects);
}

function toNumberOrBoolean(str: string) {
  if (str === 'true') {
    return true;
  }
  if (str === 'false') {
    return false;
  }
  if (!Number.isNaN(Number(str))) {
    return Number(str);
  }
  return str;
}

export interface OldProof extends Tuple {
  readonly hash: string;
  readonly mimeType: MimeType;
  readonly timestamp: number;
}

export type OldEssentialInformation = Pick<
  OldInformation,
  'provider' | 'name' | 'value'
>;

export interface SortedProofInformation extends Tuple {
  readonly proof: OldProof;
  readonly information: OldEssentialInformation[];
}

export const enum OldInformationImportance {
  Low = 'low',
  High = 'high',
}

export const enum OldInformationType {
  Device = 'device',
  Location = 'location',
  Other = 'other',
}

export interface OldInformation extends Tuple {
  readonly proofHash: string;
  readonly provider: string;
  readonly name: string;
  readonly value: string;
  readonly importance: OldInformationImportance;
  readonly type: OldInformationType;
}

export const enum OldDefaultInformationName {
  DEVICE_NAME = 'Device Name',
  GEOLOCATION_LATITUDE = 'Current GPS Latitude',
  GEOLOCATION_LONGITUDE = 'Current GPS Longitude',
}

export interface OldSignature extends Tuple {
  readonly proofHash: string;
  readonly provider: string;
  readonly signature: string;
  readonly publicKey: string;
}
