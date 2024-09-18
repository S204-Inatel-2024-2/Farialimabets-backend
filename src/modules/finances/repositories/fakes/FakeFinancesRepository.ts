import { Finance } from '@modules/finances/entities/Finance';
import { IFinancesRepository } from '@modules/finances/repositories/IFinancesRepository';
import { FakeBaseRepository } from '@shared/container/modules/repositories/fakes/FakeBaseRepository';

export class FakeFinancesRepository
  extends FakeBaseRepository<Finance>
  implements IFinancesRepository
{
  public constructor() {
    super(Finance);
  }

  // non-generic methods here
}
