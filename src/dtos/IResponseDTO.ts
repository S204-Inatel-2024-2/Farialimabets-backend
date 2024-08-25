import { ICodeDTO } from './ICodeDTO';

export interface IResponseDTO<T> {
  code: number;
  message_code: ICodeDTO;
  message: string;
  data: T;
}
