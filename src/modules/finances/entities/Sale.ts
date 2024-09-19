import { User } from '@modules/users/entities/User';
import { Base } from '@shared/container/modules/entities/Base';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('sales')
export default class Sales extends Base {
  @Column({ type: 'uuid', nullable: false, unique: false })
  public user_id: string;

  @ManyToOne(() => User, user => user.sales, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_user_sale',
    referencedColumnName: 'id',
  })
  public user: User;

  
}
