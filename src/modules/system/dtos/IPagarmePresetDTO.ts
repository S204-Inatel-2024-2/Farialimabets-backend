import { IDefaultPaymentDTO } from '@shared/container/providers/PaymentProvider/dtos/IDefaultPaymentDTO';
import { Preset } from '../entities/Preset';

export interface IPagarmePresetDTO extends Partial<Preset> {
  name: 'pagarme';
  attributes: {
    taxes: IDefaultPaymentDTO['ITaxesDTO'];
  };
}
