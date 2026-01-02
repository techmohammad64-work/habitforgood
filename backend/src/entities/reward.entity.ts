import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Student } from './student.entity';

export enum RewardType {
  RANDOM_BOX = 'RANDOM_BOX',
  RANK_UP = 'RANK_UP',
  STREAK_MILESTONE = 'STREAK_MILESTONE',
  QUEST_COMPLETION = 'QUEST_COMPLETION',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
}

export enum RewardRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

@Entity('rewards')
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ name: 'student_id' })
  studentId!: string;

  @Column({
    type: 'enum',
    enum: RewardType,
  })
  type!: RewardType;

  @Column({
    type: 'enum',
    enum: RewardRarity,
  })
  rarity!: RewardRarity;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'xp_bonus', type: 'int', default: 0 })
  xpBonus!: number;

  @Column({ name: 'points_bonus', type: 'int', default: 0 })
  pointsBonus!: number;

  @Column({ name: 'badge_id', type: 'uuid', nullable: true })
  badgeId?: string;

  @Column({ name: 'icon_url', type: 'varchar', nullable: true })
  iconUrl?: string;

  @CreateDateColumn({ name: 'received_at' })
  receivedAt!: Date;
}
