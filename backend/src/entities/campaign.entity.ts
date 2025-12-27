import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Admin } from './admin.entity';
import { Cause } from './cause.entity';
import { Habit } from './habit.entity';
import { Enrollment } from './enrollment.entity';
import { HabitSubmission } from './habit-submission.entity';
import { Streak } from './streak.entity';
import { PointsLedger } from './points-ledger.entity';
import { SponsorPledge } from './sponsor-pledge.entity';

export type CampaignStatus = 'upcoming' | 'active' | 'ended' | 'completed' | 'paused';

@Entity('campaigns')
export class Campaign {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'admin_id', nullable: true })
    adminId!: number;

    @Column({ name: 'cause_id', nullable: true })
    causeId!: number;

    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ type: 'text', array: true, default: '{}', name: 'category_tags' })
    categoryTags!: string[];

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'goal_amount' })
    goalAmount!: number;

    @Column({ type: 'date', name: 'start_date' })
    startDate!: Date;

    @Column({ type: 'date', name: 'end_date' })
    endDate!: Date;

    @Column({ type: 'varchar', length: 20, default: 'upcoming' })
    status!: CampaignStatus;

    @Column({ type: 'varchar', length: 500, nullable: true, name: 'image_url' })
    imageUrl!: string;

    @Column({ type: 'boolean', default: false })
    featured!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => Admin, (admin) => admin.campaigns)
    @JoinColumn({ name: 'admin_id' })
    admin!: Admin;

    @ManyToOne(() => Cause, (cause) => cause.campaigns)
    @JoinColumn({ name: 'cause_id' })
    cause!: Cause;

    @OneToMany(() => Habit, (habit) => habit.campaign)
    habits!: Habit[];

    @OneToMany(() => Enrollment, (enrollment) => enrollment.campaign)
    enrollments!: Enrollment[];

    @OneToMany(() => HabitSubmission, (submission) => submission.campaign)
    submissions!: HabitSubmission[];

    @OneToMany(() => Streak, (streak) => streak.campaign)
    streaks!: Streak[];

    @OneToMany(() => PointsLedger, (points) => points.campaign)
    points!: PointsLedger[];

    @OneToMany(() => SponsorPledge, (pledge) => pledge.campaign)
    pledges!: SponsorPledge[];
}
