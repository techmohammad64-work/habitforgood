import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Campaign } from './campaign.entity';

@Entity('causes')
export class Cause {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'user_id' })
    userId!: number;

    @Column({ type: 'varchar', length: 255, name: 'org_name' })
    orgName!: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    ein!: string;

    @Column({ type: 'text', nullable: true })
    mission!: string;

    @Column({ type: 'varchar', length: 500, nullable: true, name: 'logo_url' })
    logoUrl!: string;

    @Column({ type: 'boolean', default: false })
    verified!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @OneToOne(() => User, (user) => user.cause)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @OneToMany(() => Campaign, (campaign) => campaign.cause)
    campaigns!: Campaign[];
}
