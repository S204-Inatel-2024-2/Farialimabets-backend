import { File } from '../entities/File';

export interface IFileDTO extends Partial<File> {
  file?: string;
  folder_id: string;
}
