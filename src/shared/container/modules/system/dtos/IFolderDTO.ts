import { Folder } from '../entities/Folder';

export interface IFolderDTO extends Partial<Folder> {
  name: string;
}
