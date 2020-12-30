import { Documents, Facts } from '../../repositories/proof/proof';

export interface FactsProvider {
  readonly id: string;
  provide(documents: Documents): Promise<Facts>;
}
