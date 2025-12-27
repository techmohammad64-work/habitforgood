import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Campaign } from './campaign.entity';

export type HabitFrequency = 'daily' | 'weekly';

@Entity('habits')
export class Habit {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'campaign_id' })
    campaignId!: number;

    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ type: 'varchar', length: 100, default: 'star' })
    icon!: string;

    @Column({ type: 'varchar', length: 20, default: 'daily' })
    frequency!: HabitFrequency;

    @Column({ type: 'text', nullable: true })
    disclaimer!: string;

    @Column({ type: 'integer', default: 0, name: 'sort_order' })
    sortOrder!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => Campaign, (campaign) => campaign.habits)
    @JoinColumn({ name: 'campaign_id' })
    campaign!: Campaign;
}
