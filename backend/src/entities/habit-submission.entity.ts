import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { Student } from './student.entity';
import { Campaign } from './campaign.entity';

export type SubmissionRating = 'great' | 'good' | 'okay' | 'hard';

@Entity('habit_submissions')
@Unique(['studentId', 'campaignId', 'submissionDate'])
export class HabitSubmission {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'student_id' })
    studentId!: number;

    @Column({ name: 'campaign_id' })
    campaignId!: number;

    @Column({ type: 'date', name: 'submission_date' })
    submissionDate!: Date;

    @Column({ type: 'varchar', length: 20, nullable: true })
    rating!: SubmissionRating;

    @Column({ type: 'boolean', default: true })
    completed!: boolean;

    @CreateDateColumn({ name: 'submitted_at' })
    submittedAt!: Date;

    // Relations
    @ManyToOne(() => Student, (student) => student.submissions)
    @JoinColumn({ name: 'student_id' })
    student!: Student;

    @ManyToOne(() => Campaign, (campaign) => campaign.submissions)
    @JoinColumn({ name: 'campaign_id' })
    campaign!: Campaign;
}
