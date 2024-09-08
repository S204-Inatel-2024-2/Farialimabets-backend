import { AppError } from '@shared/errors/AppError';
import { FakeFoldersRepository } from '@modules/system/repositories/fakes/FakeFoldersRepository';
import { Connection, IConnectionDTO } from '@shared/typeorm';
import { FakeDataSource } from '@shared/typeorm/dataSources/fakes/fakeDataSource';
import { FakeFilesRepository } from '@modules/system/repositories/fakes/FakeFilesRepository';
import { ShowFolderService } from './ShowFolderService';

let fakeFoldersRepository: FakeFoldersRepository;
let fakeFilesRepository: FakeFilesRepository;
let showFolder: ShowFolderService;
let connection: IConnectionDTO;

describe('ShowFolderService', (): void => {
  beforeAll((): void => {
    connection = new Connection('database_test', FakeDataSource);
  });

  beforeEach((): void => {
    fakeFilesRepository = new FakeFilesRepository();
    fakeFoldersRepository = new FakeFoldersRepository();
    showFolder = new ShowFolderService(fakeFoldersRepository, connection);
  });

  it('should be able to show a folder', async (): Promise<void> => {
    const folder = await fakeFoldersRepository.create({
      name: 'folder',
    });

    await fakeFilesRepository.create({
      name: 'file',
      folder,
      folder_id: folder.id,
    });
    const getFolder = await showFolder.execute(folder.id);

    expect(getFolder.data).toHaveProperty('id');
    expect(getFolder.data).toEqual(folder);
  });

  it('should not be able to show folders with a non-existing id', async (): Promise<void> => {
    await expect(showFolder.execute('non-existing-folder-id')).rejects.toThrow(
      new AppError('NOT_FOUND', 'Folder not found'),
    );
  });
});
