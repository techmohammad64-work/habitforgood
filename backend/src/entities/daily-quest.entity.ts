import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';
import { Campaign } from './campaign.entity';

export enum QuestStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PENALTY_ISSUED = 'PENALTY_ISSUED',
}

@Entity('daily_quests')
export class DailyQuest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ name: 'student_id' })
  studentId!: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: Campaign;

  @Column({ name: 'campaign_id' })
  campaignId!: string;

  @Column({ name: 'quest_date', type: 'date' })
  questDate!: Date;

  @Column({ name: 'total_habits', type: 'int' })
  totalHabits!: number;

  @Column({ name: 'completed_habits', type: 'int', default: 0 })
  completedHabits!: number;

  @Column({
    type: 'enum',
    enum: QuestStatus,
    default: QuestStatus.IN_PROGRESS,
  })
  status!: QuestStatus;

  @Column({ name: 'bonus_xp', type: 'int', default: 0 })
  bonusXp!: number;

  @Column({ name: 'bonus_points', type: 'int', default: 0 })
  bonusPoints!: number;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ name: 'deadline', type: 'timestamp' })
  deadline!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
