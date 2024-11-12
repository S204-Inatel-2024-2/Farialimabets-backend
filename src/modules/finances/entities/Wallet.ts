import { User } from '@modules/users/entities/User';
import { Base } from '@shared/container/modules/entities/Base';
import {
  AfterLoad,
  AfterUpdate,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToOne,
} from 'typeorm';

interface TransactionDTO {
  quantity: number;
  sold_value: number;
  company: string;
  profit: number;
}

@Entity('wallets')
export class Wallet extends Base {
  @Column({ type: 'float', nullable: false, default: 0 })
  public value: number;

  @Column({ type: 'json', nullable: true })
  public last_transactions: Array<TransactionDTO>;

  @OneToOne(() => User, user => user.wallet)
  public user: User;

  @BeforeUpdate()
  @BeforeInsert()
  public stringifyLastTransactions(): void {
    (this.last_transactions as unknown) = JSON.stringify(
      this.last_transactions,
    );
  }

  @AfterLoad()
  @AfterUpdate()
  public getLastTransactions(): void {
    if (typeof this.last_transactions === 'string') {
      this.last_transactions = JSON.parse(
        this.last_transactions as unknown as string,
      );
    }
  }

  @BeforeInsert()
  public setDefaultLastTransactions(): void {
    if (!this.last_transactions) {
      this.last_transactions = [];
    }
  }
}
