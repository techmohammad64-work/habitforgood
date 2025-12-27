import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { Sponsor } from './sponsor.entity';
import { Campaign } from './campaign.entity';

export type PledgeStatus = 'active' | 'fulfilled' | 'cancelled';

@Entity('sponsor_pledges')
@Unique(['sponsorId', 'campaignId'])
export class SponsorPledge {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'sponsor_id' })
    sponsorId!: number;

    @Column({ name: 'campaign_id' })
    campaignId!: number;

    @Column({ type: 'decimal', precision: 5, scale: 3, name: 'rate_per_point' })
    ratePerPoint!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'cap_amount' })
    capAmount!: number;

    @Column({ type: 'text', nullable: true })
    message!: string;

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'ad_image_url' })
    adImageUrl!: string;

    @Column({ type: 'varchar', length: 20, default: 'active' })
    status!: PledgeStatus;

    @CreateDateColumn({ name: 'pledged_at' })
    pledgedAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => Sponsor, (sponsor) => sponsor.pledges)
    @JoinColumn({ name: 'sponsor_id' })
    sponsor!: Sponsor;

    @ManyToOne(() => Campaign, (campaign) => campaign.pledges)
    @JoinColumn({ name: 'campaign_id' })
    campaign!: Campaign;
}
