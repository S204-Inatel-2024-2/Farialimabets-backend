import { File } from '@modules/system/entities/File';
import { IFilesRepositoryDTO } from '@modules/system/repositories/IFilesRepository';
import { BaseRepository } from '@shared/container/modules/repositories/BaseRepository';

export class FilesRepository
  extends BaseRepository<File>
  implements IFilesRepositoryDTO
{
  public constructor() {
    super(File);
  }

  // non-generic methods here
}
