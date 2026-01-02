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

export enum PenaltyStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum PenaltyType {
  MISSED_DAILY_QUEST = 'MISSED_DAILY_QUEST',
  STREAK_BREAK = 'STREAK_BREAK',
  INCOMPLETE_CHALLENGE = 'INCOMPLETE_CHALLENGE',
}

@Entity('penalty_quests')
export class PenaltyQuest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ name: 'student_id' })
  studentId!: string;

  @ManyToOne(() => Campaign, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaign_id' })
  campaign?: Campaign;

  @Column({ name: 'campaign_id', nullable: true })
  campaignId?: string;

  @Column({
    type: 'enum',
    enum: PenaltyType,
    default: PenaltyType.MISSED_DAILY_QUEST,
  })
  type!: PenaltyType;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'penalty_task', type: 'text' })
  penaltyTask!: string;

  @Column({ name: 'xp_penalty', type: 'int', default: 0 })
  xpPenalty!: number;

  @Column({
    type: 'enum',
    enum: PenaltyStatus,
    default: PenaltyStatus.PENDING,
  })
  status!: PenaltyStatus;

  @Column({ name: 'deadline', type: 'timestamp' })
  deadline!: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
