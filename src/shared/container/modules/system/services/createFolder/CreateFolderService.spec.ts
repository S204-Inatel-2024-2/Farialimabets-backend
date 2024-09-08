import { FakeCacheProvider } from '@shared/container/providers/CacheProvider/fakes/FakeCacheProvider';
import { FakeFoldersRepository } from '@modules/system/repositories/fakes/FakeFoldersRepository';
import { Connection, IConnectionDTO } from '@shared/typeorm';
import { AppError } from '@shared/errors/AppError';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { CreateFolderService } from './CreateFolderService';

let fakeFoldersRepository: FakeFoldersRepository;
let fakeCacheProvider: FakeCacheProvider;
let createFolder: CreateFolderService;
let connection: IConnectionDTO;

describe('CreateFolderService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeFoldersRepository = new FakeFoldersRepository();
    fakeCacheProvider = new FakeCacheProvider();
    createFolder = new CreateFolderService(
      fakeFoldersRepository,
      fakeCacheProvider,
      connection,
    );
  });

  it('should be able to create a new folder', async (): Promise<void> => {
    const response = await createFolder.execute({ name: 'folder' });

    expect(response.code).toBe(201);
    expect(response.message_code).toBe('CREATED');
    expect(response.message).toBe('Folder successfully created');
  });

  it('should return AppError', async (): Promise<void> => {
    jest.spyOn(fakeFoldersRepository, 'create').mockImplementationOnce(() => {
      throw new AppError('FAILED_TO_CREATE', 'Failed to create a folder');
    });

    await expect(
      createFolder.execute({
        name: 'folder',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
