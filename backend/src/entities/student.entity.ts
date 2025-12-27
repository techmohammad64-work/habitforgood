import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Enrollment } from './enrollment.entity';
import { HabitSubmission } from './habit-submission.entity';
import { Streak } from './streak.entity';
import { PointsLedger } from './points-ledger.entity';
import { Badge } from './badge.entity';

@Entity('students')
export class Student {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'user_id' })
    userId!: number;

    @Column({ type: 'varchar', length: 100, name: 'display_name' })
    displayName!: string;

    @Column({ type: 'integer', nullable: true })
    age!: number;

    @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
    avatarUrl!: string;

    @Column({ type: 'varchar', length: 255, name: 'parent_email' })
    parentEmail!: string;

    @Column({ type: 'boolean', default: false, name: 'anonymous_mode' })
    anonymousMode!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @OneToOne(() => User, (user) => user.student)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @OneToMany(() => Enrollment, (enrollment) => enrollment.student)
    enrollments!: Enrollment[];

    @OneToMany(() => HabitSubmission, (submission) => submission.student)
    submissions!: HabitSubmission[];

    @OneToMany(() => Streak, (streak) => streak.student)
    streaks!: Streak[];

    @OneToMany(() => PointsLedger, (points) => points.student)
    points!: PointsLedger[];

    @OneToMany(() => Badge, (badge) => badge.student)
    badges!: Badge[];
}
