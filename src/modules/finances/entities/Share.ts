import { User } from '@modules/users/entities/User';
import { Base } from '@shared/container/modules/entities/Base';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('shares')
export class Share extends Base {
  @Column({ type: 'uuid', nullable: false, unique: false })
  public user_id: string;

  @Column({ type: 'varchar', nullable: false })
  public company: string;

  @Column({ type: 'float', nullable: false })
  public total_value: number;

  @Column({ type: 'float', nullable: false })
  public purchase_price: number;

  @Column({ type: 'integer', nullable: false, default: 1 })
  public quantity: number;

  @ManyToOne(() => User, user => user.shares, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: 'FK_share_user',
  })
  public user: User;
}
