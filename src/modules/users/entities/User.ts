import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Base } from '@shared/container/modules/entities/Base';
import { Exclude } from 'class-transformer';
import { Wallet } from '@modules/finances/entities/Wallet';
import Sales from '@modules/finances/entities/Sale';

@Entity('users')
export class User extends Base {
  @Column({ type: 'varchar', unique: false })
  public name: string;

  @Column({ type: 'varchar', unique: true })
  public email: string;

  @Exclude()
  @Column({ type: 'varchar', unique: false })
  public password: string;

  @Column({ type: 'uuid', unique: true, nullable: true })
  public wallet_id: string;

  @OneToOne(() => Wallet, wallet => wallet.user)
  @JoinColumn({
    name: 'wallet_id',
    foreignKeyConstraintName: 'FK_wallet_user',
    referencedColumnName: 'id',
  })
  public wallet: Wallet;

  @OneToMany(() => Sales, sales => sales.user, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  public sales: Array<Sales>;
}
