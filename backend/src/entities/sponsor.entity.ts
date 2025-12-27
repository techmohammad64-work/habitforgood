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
import { SponsorPledge } from './sponsor-pledge.entity';

@Entity('sponsors')
export class Sponsor {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'user_id' })
    userId!: number;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_donated' })
    totalDonated!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @OneToOne(() => User, (user) => user.sponsor)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @OneToMany(() => SponsorPledge, (pledge) => pledge.sponsor)
    pledges!: SponsorPledge[];
}
