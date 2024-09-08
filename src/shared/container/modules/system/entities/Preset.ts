import {
  Entity,
  Column,
  Unique,
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  AfterUpdate,
} from 'typeorm';
import { Base } from '@shared/container/modules/entities/Base';

@Entity('presets')
export class Preset extends Base {
  @Unique('UNIQUE_presets_name', ['name'])
  @Column({
    type: 'enum',
    nullable: false,
    enum: [
      'general',
      'redis',
      'crypto',
      'bling',
      'omie',
      'bcrypt',
      'nodemailer',
      'ses',
      'handlebars',
      'ipag',
      'pagarme',
      'kue',
      'bull',
      'bee',
      'disk',
      's3',
    ],
  })
  public name:
    | 'general'
    | 'redis'
    | 'crypto'
    | 'bling'
    | 'omie'
    | 'bcrypt'
    | 'nodemailer'
    | 'ses'
    | 'handlebars'
    | 'ipag'
    | 'pagarme'
    | 'kue'
    | 'bull'
    | 'bee'
    | 'disk'
    | 's3';

  @Column({ type: 'text', nullable: true })
  public attributes: ReturnType<typeof JSON.parse>;

  @AfterLoad()
  @AfterUpdate()
  public getContent(): void {
    if (typeof this.attributes === 'string') {
      this.attributes = JSON.parse(this.attributes as unknown as string);
    }
  }

  @BeforeUpdate()
  @BeforeInsert()
  public stringifyAttributes(): void {
    if (typeof this.attributes === 'object') {
      (this.attributes as unknown) = JSON.stringify(this.attributes);
    }
  }
}
