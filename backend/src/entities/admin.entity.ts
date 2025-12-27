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

@Entity('admins')
export class Admin {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'user_id' })
    userId!: number;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    organization!: string;

    @Column({ type: 'varchar', length: 100, nullable: true, name: 'role_title' })
    roleTitle!: string;

    @Column({ type: 'boolean', default: false })
    verified!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // Relations
    @OneToOne(() => User, (user) => user.admin)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @OneToMany(() => Campaign, (campaign) => campaign.admin)
    campaigns!: Campaign[];
}
