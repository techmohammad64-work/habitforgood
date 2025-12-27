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

@Entity('enrollments')
@Unique(['studentId', 'campaignId'])
export class Enrollment {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'student_id' })
    studentId!: number;

    @Column({ name: 'campaign_id' })
    campaignId!: number;

    @CreateDateColumn({ name: 'enrolled_at' })
    enrolledAt!: Date;

    // Relations
    @ManyToOne(() => Student, (student) => student.enrollments)
    @JoinColumn({ name: 'student_id' })
    student!: Student;

    @ManyToOne(() => Campaign, (campaign) => campaign.enrollments)
    @JoinColumn({ name: 'campaign_id' })
    campaign!: Campaign;
}
