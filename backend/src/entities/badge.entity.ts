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

export type BadgeType =
    | '7_day_streak'
    | '30_day_streak'
    | '100_day_streak'
    | 'campaign_completer'
    | 'top_3_finisher'
    | 'generous_heart';

@Entity('badges')
@Unique(['studentId', 'badgeType', 'campaignId'])
export class Badge {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'integer', name: 'student_id' })
    studentId!: number;

    @Column({ type: 'varchar', length: 50, name: 'badge_type' })
    badgeType!: BadgeType;

    @Column({ type: 'integer', nullable: true, name: 'campaign_id' })
    campaignId!: number;

    @CreateDateColumn({ name: 'earned_at' })
    earnedAt!: Date;

    // Relations
    @ManyToOne(() => Student, (student) => student.badges)
    @JoinColumn({ name: 'student_id' })
    student!: Student;

    @ManyToOne(() => Campaign)
    @JoinColumn({ name: 'campaign_id' })
    campaign!: Campaign;
}
