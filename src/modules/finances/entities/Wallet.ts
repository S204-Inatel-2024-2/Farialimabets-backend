import { User } from '@modules/users/entities/User';
import { Base } from '@shared/container/modules/entities/Base';
import { Column, Entity, OneToOne } from 'typeorm';

interface TransactionDTO {
  value: number;
  product: Record<string, string>;
}

@Entity('wallets')
export class Wallet extends Base {
  @Column({ type: 'float', nullable: false, default: 0 })
  public value: number;

  @Column({ type: 'json', nullable: true })
  public last_transactions: Array<TransactionDTO>;

  @OneToOne(() => User, user => user.wallet)
  public user: User;
}
