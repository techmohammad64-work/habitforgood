import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
} from 'typeorm';
import { Student } from './student.entity';
import { Admin } from './admin.entity';
import { Sponsor } from './sponsor.entity';
import { Cause } from './cause.entity';

export type UserRole = 'student' | 'admin' | 'sponsor' | 'cause';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 255, name: 'password_hash' })
    passwordHash!: string;

    @Column({ type: 'varchar', length: 20 })
    role!: UserRole;

    @Column({ type: 'boolean', default: false, name: 'email_verified' })
    emailVerified!: boolean;

    @Column({ type: 'varchar', length: 50, default: 'UTC' })
    timezone!: string;

    @Column({ type: 'boolean', default: true, name: 'email_notifications_enabled' })
    emailNotificationsEnabled!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @OneToOne(() => Student, (student) => student.user)
    student?: Student;

    @OneToOne(() => Admin, (admin) => admin.user)
    admin?: Admin;

    @OneToOne(() => Sponsor, (sponsor) => sponsor.user)
    sponsor?: Sponsor;

    @OneToOne(() => Cause, (cause) => cause.user)
    cause?: Cause;
}
