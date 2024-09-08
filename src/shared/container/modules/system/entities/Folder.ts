import { Entity, Column, OneToMany, Unique } from 'typeorm';
import { Base } from '@shared/container/modules/entities/Base';
import { File } from './File';

@Entity('folders')
export class Folder extends Base {
  @Column({ type: 'varchar', nullable: true })
  public name: string;

  @Unique('UNIQUE_folders_slug', ['slug'])
  @Column({ type: 'varchar' })
  public slug: string;

  @OneToMany(() => File, file => file.folder, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  public files: Array<File>;
}
