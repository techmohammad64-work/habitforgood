import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('notification_logs')
export class NotificationLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'user_id' })
    userId!: number;

    @Column({ type: 'varchar', length: 50 })
    type!: string; // e.g., 'daily-reminder'

    @Column({ type: 'varchar', length: 20 })
    status!: 'pending' | 'sent' | 'failed';

    @Column({ type: 'text', nullable: true })
    error?: string;

    @Column({ type: 'timestamp', nullable: true, name: 'sent_at' })
    sentAt?: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;
}
