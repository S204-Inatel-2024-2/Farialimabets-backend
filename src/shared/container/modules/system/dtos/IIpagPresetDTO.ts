import { IDefaultPaymentDTO } from '@shared/container/providers/PaymentProvider/dtos/IDefaultPaymentDTO';
import { Preset } from '../entities/Preset';

export interface IIpagPresetDTO extends Partial<Preset> {
  name: 'ipag';
  attributes: {
    taxes: IDefaultPaymentDTO['ITaxesDTO'];
  };
}
