import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Campaign } from './campaign.entity';
import { HabitSubmission } from './habit-submission.entity';

@Entity('points_ledger')
export class PointsLedger {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'student_id' })
    studentId!: number;

    @Column({ name: 'campaign_id' })
    campaignId!: number;

    @Column({ nullable: true, name: 'submission_id' })
    submissionId!: number;

    @Column({ type: 'date', name: 'submission_date' })
    submissionDate!: Date;

    @Column({ type: 'integer', default: 10, name: 'base_points' })
    basePoints!: number;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0, name: 'streak_multiplier' })
    streakMultiplier!: number;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 1.0, name: 'bonus_multiplier' })
    bonusMultiplier!: number;

    @Column({ type: 'integer', name: 'total_points' })
    totalPoints!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    // Relations
    @ManyToOne(() => Student, (student) => student.points)
    @JoinColumn({ name: 'student_id' })
    student!: Student;

    @ManyToOne(() => Campaign, (campaign) => campaign.points)
    @JoinColumn({ name: 'campaign_id' })
    campaign!: Campaign;

    @ManyToOne(() => HabitSubmission)
    @JoinColumn({ name: 'submission_id' })
    submission!: HabitSubmission;
}
