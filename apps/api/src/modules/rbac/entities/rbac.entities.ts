import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

// Las seis entidades RBAC viven juntas: se referencian entre sí y separarlas solo
// añade imports circulares sin ganar claridad.

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('users_email_key', { unique: true })
  @Column({ type: 'varchar', length: 254 })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 120 })
  displayName!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  district!: string | null;

  /** w_u del motor de veracidad. 1.0 = vecino nuevo. */
  @Column({ type: 'double precision', default: 1 })
  reputation!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => UserRoleEntity, (ur) => ur.user)
  roles!: Relation<UserRoleEntity[]>;

  @OneToMany(() => UserPermissionEntity, (up) => up.user)
  permissions!: Relation<UserPermissionEntity[]>;
}

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('roles_name_key', { unique: true })
  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => RolePermissionEntity, (rp) => rp.role)
  permissions!: Relation<RolePermissionEntity[]>;
}

@Entity('permissions')
export class PermissionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  /** 'incidents.verify', 'triage.update', 'incidents.*', '*' */
  @Index('permissions_name_key', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

@Entity('user_roles')
export class UserRoleEntity {
  @PrimaryColumn('uuid')
  userId!: string;

  @Index('user_roles_role_id_idx')
  @PrimaryColumn('int')
  roleId!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  grantedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  grantedBy!: string | null;

  @ManyToOne(() => UserEntity, (u) => u.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<UserEntity>;

  @ManyToOne(() => RoleEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Relation<RoleEntity>;
}

@Entity('role_permissions')
export class RolePermissionEntity {
  @PrimaryColumn('int')
  roleId!: number;

  @Index('role_permissions_permission_id_idx')
  @PrimaryColumn('int')
  permissionId!: number;

  @ManyToOne(() => RoleEntity, (r) => r.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Relation<RoleEntity>;

  @ManyToOne(() => PermissionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission!: Relation<PermissionEntity>;
}

/** Permiso directo al usuario (equivalente a `givePermissionTo` de Spatie), opcionalmente temporal. */
@Entity('user_permissions')
export class UserPermissionEntity {
  @PrimaryColumn('uuid')
  userId!: string;

  @Index('user_permissions_permission_id_idx')
  @PrimaryColumn('int')
  permissionId!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  grantedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @ManyToOne(() => UserEntity, (u) => u.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<UserEntity>;

  @ManyToOne(() => PermissionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission!: Relation<PermissionEntity>;
}
