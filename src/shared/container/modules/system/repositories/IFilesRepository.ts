import { File } from '@modules/system/entities/File';
import { IBaseRepositoryDTO } from '@shared/container/modules/repositories/IBaseRepository';

export interface IFilesRepositoryDTO extends IBaseRepositoryDTO<File> {
  // non-generic methods here
}
