import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Base } from '@shared/container/modules/entities/Base';
import { storageConfig } from '@config/storage';
import { Expose } from 'class-transformer';
import { Folder } from './Folder';

@Entity('files')
export class File extends Base {
  public file_url: string | null;

  @Column({ type: 'uuid', nullable: false })
  public folder_id: string;

  @Column({ type: 'varchar', nullable: false })
  public file: string;

  @Column({ type: 'varchar', nullable: false })
  public name: string;

  @ManyToOne(() => Folder, folder => folder.files, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'folder_id',
    foreignKeyConstraintName: 'FK_files_folder',
    referencedColumnName: 'id',
  })
  public folder: Folder;

  @Expose({ name: 'file_url' })
  public getFileUrl(): string | null {
    if (!this.file) {
      return null;
    }
    switch (storageConfig.driver) {
      case 'disk':
        return `${process.env.API_URL}/uploads/${this.file}`;
      case 's3':
        return `https://${storageConfig.config.aws.bucket}.s3.amazonaws.com/${this.file}`;
      default:
        return null;
    }
  }
}
