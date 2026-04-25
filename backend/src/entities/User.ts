import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';

export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  TECHNICIAN = 'technician',
  CLIENT = 'client',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @IsString()
  @MinLength(6)
  password: string;

  @Column()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.TECHNICIAN,
  })
  role: UserRole;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true, type: 'timestamp' })
  emailVerificationExpires?: Date;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true, type: 'timestamp' })
  passwordResetExpires?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  lastLogin?: Date;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ nullable: true, type: 'timestamp' })
  lockedUntil?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, config.security.bcryptRounds);
    }
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  generateEmailVerificationToken(): string {
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    this.emailVerificationToken = token;
    this.emailVerificationExpires = new Date(
      Date.now() + config.security.verifyTokenExpiryHours * 60 * 60 * 1000
    );
    return token;
  }

  generatePasswordResetToken(): string {
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    this.passwordResetToken = token;
    this.passwordResetExpires = new Date(
      Date.now() + config.security.resetTokenExpiryHours * 60 * 60 * 1000
    );
    return token;
  }

  isAccountLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date());
  }

  clearVerificationToken(): void {
    this.emailVerificationToken = undefined;
    this.emailVerificationExpires = undefined;
  }

  clearPasswordResetToken(): void {
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
  }

  toJSON() {
    const { password, emailVerificationToken, passwordResetToken, ...userObject } = this;
    return userObject;
  }
}