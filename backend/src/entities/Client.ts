import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsPhoneNumber } from 'class-validator';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactPerson?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactTitle?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string; // RFC or Tax ID

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // TODO: Add relationships with Equipment and ServiceReports when implemented
  // @OneToMany(() => Equipment, equipment => equipment.client)
  // equipment: Equipment[];

  // @OneToMany(() => ServiceReport, report => report.client)
  // reports: ServiceReport[];

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      address: this.address,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      country: this.country,
      contactPerson: this.contactPerson,
      contactTitle: this.contactTitle,
      contactPhone: this.contactPhone,
      contactEmail: this.contactEmail,
      taxId: this.taxId,
      notes: this.notes,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}