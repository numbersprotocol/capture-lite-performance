import { Injectable } from '@angular/core';
import { ImageStore } from '../file-store/image/image-store';
import {
  Documents,
  getSerializedSortedSignedTargets,
  Proof,
  Signatures,
  SignedTargets,
  Truth,
} from '../repositories/proof/proof';
import { ProofRepository } from '../repositories/proof/proof-repository.service';
import { FactsProvider } from './facts/facts-provider';
import { SignatureProvider } from './signature/signature-provider';

@Injectable({
  providedIn: 'root',
})
export class CollectorService {
  private readonly factsProviders = new Set<FactsProvider>();
  private readonly signatureProviders = new Set<SignatureProvider>();

  constructor(
    private readonly proofRepository: ProofRepository,
    private readonly imageStore: ImageStore
  ) {}

  async runAndStore(documents: Documents) {
    const truth = await this.collectTruth(documents);
    const signatures = await this.signTargets({ documents: documents, truth });
    const proof = await Proof.from(
      this.imageStore,
      documents,
      truth,
      signatures
    );
    return this.proofRepository.add(proof);
  }

  private async collectTruth(documents: Documents): Promise<Truth> {
    return {
      timestamp: Date.now(),
      providers: Object.fromEntries(
        await Promise.all(
          [...this.factsProviders].map(async provider => [
            provider.id,
            await provider.provide(documents),
          ])
        )
      ),
    };
  }

  private async signTargets(targets: SignedTargets): Promise<Signatures> {
    const serializedSortedSignedTargets = getSerializedSortedSignedTargets(
      targets
    );
    return Object.fromEntries(
      await Promise.all(
        [...this.signatureProviders].map(async provider => [
          provider.id,
          await provider.provide(serializedSortedSignedTargets),
        ])
      )
    );
  }

  addFactsProvider(provider: FactsProvider) {
    this.factsProviders.add(provider);
  }

  removeFactsProvider(provider: FactsProvider) {
    this.factsProviders.delete(provider);
  }

  addSignatureProvider(provider: SignatureProvider) {
    this.signatureProviders.add(provider);
  }

  removeSignatureProvider(provider: SignatureProvider) {
    this.signatureProviders.delete(provider);
  }
}
