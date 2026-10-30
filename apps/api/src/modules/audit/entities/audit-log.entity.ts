import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation } from 'typeorm';
import { UserEntity } from '../../rbac/entities/rbac.entities';

/** Append-only: la migración revoca UPDATE/DELETE al rol de la aplicación cuando existe. */
@Entity('audit_logs')
@Index('audit_logs_resource_idx', ['resource', 'resourceId'])
@Index('audit_logs_user_created_idx', ['userId', 'createdAt'])
export class AuditLogEntity {
  /** bigint → string en JS para no perder precisión. */
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<UserEntity> | null;

  @Column({ type: 'varchar', length: 80 })
  action!: string;

  @Column({ type: 'varchar', length: 120 })
  resource!: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  resourceId!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'int', nullable: true })
  statusCode!: number | null;

  /** { before, after } ya saneado (sin contraseñas ni tokens). */
  @Column({ type: 'jsonb', nullable: true })
  changes!: { before: unknown; after: unknown } | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  requestId!: string | null;

  @Index('audit_logs_created_at_idx')
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
