import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';

export enum AchievementCategory {
  STREAK = 'STREAK',
  LEVEL = 'LEVEL',
  RANK = 'RANK',
  SOCIAL = 'SOCIAL',
  CAMPAIGN = 'CAMPAIGN',
  SPECIAL = 'SPECIAL',
}

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ name: 'student_id' })
  studentId!: string;

  @Column({
    type: 'enum',
    enum: AchievementCategory,
  })
  category!: AchievementCategory;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'icon_url', type: 'varchar', nullable: true })
  iconUrl?: string;

  @Column({ name: 'xp_reward', type: 'int', default: 0 })
  xpReward!: number;

  @Column({ name: 'points_reward', type: 'int', default: 0 })
  pointsReward!: number;

  @CreateDateColumn({ name: 'unlocked_at' })
  unlockedAt!: Date;
}
