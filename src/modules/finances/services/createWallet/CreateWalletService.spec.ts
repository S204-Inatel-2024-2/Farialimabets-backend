import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { ICacheProvider } from '@shared/container/providers/CacheProvider/models/ICacheProvider';
import { FakeFinancesRepository } from '@modules/finances/repositories/fakes/FakeFinancesRepository';
import { IFinancesRepository } from '@modules/finances/repositories/IFinancesRepository';
import { Connection, IConnection } from '@shared/typeorm';
import { AppError } from '@shared/errors/AppError';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { CreateFinanceService } from './CreateFinanceService';

let fakeFinancesRepository: IFinancesRepository;
let fakeCacheProvider: ICacheProvider;
let connection: IConnection;
let createFinanceService: CreateFinanceService;

describe('CreateFinanceService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeFinancesRepository = new FakeFinancesRepository();
    fakeCacheProvider = new FakeCacheProvider();
    createFinanceService = new CreateFinanceService(
      fakeFinancesRepository,
      fakeCacheProvider,
      connection,
    );
  });

  it('Should be able to create a new finance', async (): Promise<void> => {
    const finance = await createFinanceService.execute({
      name: 'finance',
      description: 'This is a finance',
    });

    expect(finance.data).toHaveProperty('id');
  });

  it('Should return AppError', async (): Promise<void> => {
    jest.spyOn(fakeFinancesRepository, 'create').mockImplementationOnce(() => {
      throw new AppError('FAILED_TO_CREATE', 'Failed to create a finance');
    });

    await expect(createFinanceService.execute({})).rejects.toBeInstanceOf(
      AppError,
    );
  });
});
