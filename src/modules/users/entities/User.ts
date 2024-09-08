import { Entity, Column } from 'typeorm';
import { Base } from '@shared/container/modules/entities/Base';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User extends Base {
  @Column({ type: 'varchar', unique: false })
  public name: string;

  @Column({ type: 'varchar', unique: false })
  public email: string;

  @Exclude()
  @Column({ type: 'varchar', unique: false })
  public password: string;
}
