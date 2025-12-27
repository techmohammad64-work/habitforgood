import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { Student } from './student.entity';
import { Campaign } from './campaign.entity';

@Entity('streaks')
@Unique(['studentId', 'campaignId'])
export class Streak {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'student_id' })
    studentId!: number;

    @Column({ name: 'campaign_id' })
    campaignId!: number;

    @Column({ type: 'integer', default: 0, name: 'current_streak' })
    currentStreak!: number;

    @Column({ type: 'integer', default: 0, name: 'longest_streak' })
    longestStreak!: number;

    @Column({ type: 'date', nullable: true, name: 'last_submission_date' })
    lastSubmissionDate!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => Student, (student) => student.streaks)
    @JoinColumn({ name: 'student_id' })
    student!: Student;

    @ManyToOne(() => Campaign, (campaign) => campaign.streaks)
    @JoinColumn({ name: 'campaign_id' })
    campaign!: Campaign;
}
