import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'user_id' })
    userId!: number;

    @Column({ type: 'varchar', length: 50 })
    type!: string;

    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    content!: string;

    @Column({ type: 'jsonb', nullable: true })
    data!: Record<string, unknown>;

    @Column({ type: 'boolean', default: false })
    read!: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    // Relations
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;
}
