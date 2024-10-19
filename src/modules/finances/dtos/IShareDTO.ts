import { Share } from '../entities/Share';

export interface IShareDTO extends Partial<Share> {
  value: number;
}
