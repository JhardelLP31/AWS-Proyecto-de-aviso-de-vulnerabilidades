import {
  INCIDENT_SOURCES,
  INCIDENT_STATUSES,
  INCIDENT_TYPES,
  IncidentSource,
  IncidentStatus,
  IncidentType,
  SEVERITIES,
  Severity,
  VoteKind,
} from '@geoalert/contracts';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { UserEntity } from '../../rbac/entities/rbac.entities';

@Entity('incidents')
@Index('incidents_status_severity_idx', ['status', 'severity'])
@Index('incidents_district_status_idx', ['district', 'status'])
// Índice parcial: casi todas las lecturas del mapa piden incidentes activos.
@Index('incidents_active_location_gist', ['location'], { spatial: true, where: `status IN ('PENDING', 'VERIFIED')` })
@Check('incidents_lat_range', 'lat BETWEEN -90 AND 90')
@Check('incidents_lng_range', 'lng BETWEEN -180 AND 180')
export class IncidentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: INCIDENT_TYPES, enumName: 'incident_type' })
  type!: IncidentType;

  /** El orden del enum (GREEN < YELLOW < ORANGE < RED) permite ORDER BY severity DESC. */
  @Column({ type: 'enum', enum: SEVERITIES, enumName: 'severity' })
  severity!: Severity;

  @Column({ type: 'enum', enum: INCIDENT_STATUSES, enumName: 'incident_status', default: 'PENDING' })
  status!: IncidentStatus;

  @Column({ type: 'varchar', length: 120 })
  title!: string;

  @Column({ type: 'varchar', length: 2000 })
  description!: string;

  @Column({ type: 'double precision' })
  lat!: number;

  @Column({ type: 'double precision' })
  lng!: number;

  /**
   * geometry(Point, 4326) GENERADA por Postgres desde lat/lng: nunca se desincroniza
   * y la aplicación jamás la escribe.
   */
  @Index('incidents_location_gist', { spatial: true })
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    generatedType: 'STORED',
    asExpression: 'ST_SetSRID(ST_MakePoint(lng, lat), 4326)',
    insert: false,
    update: false,
    select: false,
    nullable: true,
  })
  location!: unknown;

  @Column({ type: 'varchar', length: 80, nullable: true })
  district!: string | null;

  @Column({ type: 'double precision', default: 0 })
  veracityScore!: number;

  @Column({ type: 'int', default: 0 })
  confirmCount!: number;

  @Column({ type: 'int', default: 0 })
  denyCount!: number;

  @Column({ type: 'enum', enum: INCIDENT_SOURCES, enumName: 'incident_source', default: 'CITIZEN' })
  source!: IncidentSource;

  /** "INDECI:<codigo>" — idempotencia de la importación. */
  @Index('incidents_external_ref_key', { unique: true })
  @Column({ type: 'varchar', length: 64, nullable: true })
  externalRef!: string | null;

  @Index('incidents_reporter_id_idx')
  @Column({ type: 'uuid', nullable: true })
  reporterId!: string | null;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reporter_id' })
  reporter!: Relation<UserEntity> | null;

  @Index('incidents_occurred_at_idx')
  @Column({ type: 'timestamptz' })
  occurredAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  /** Bloqueo optimista del triaje. */
  @VersionColumn({ default: 0 })
  version!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => IncidentPhotoEntity, (p) => p.incident, { cascade: ['insert'] })
  photos!: Relation<IncidentPhotoEntity[]>;

  @OneToMany(() => IncidentConfirmationEntity, (c) => c.incident)
  confirmations!: Relation<IncidentConfirmationEntity[]>;
}

@Entity('incident_photos')
export class IncidentPhotoEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('incident_photos_incident_id_idx')
  @Column({ type: 'uuid' })
  incidentId!: string;

  @ManyToOne(() => IncidentEntity, (i) => i.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incident_id' })
  incident!: Relation<IncidentEntity>;

  @Column({ type: 'varchar', length: 255 })
  storageKey!: string;

  @Column({ type: 'varchar', length: 30 })
  mimeType!: string;

  @Column({ type: 'int' })
  width!: number;

  @Column({ type: 'int' })
  height!: number;

  @Column({ type: 'int' })
  bytes!: number;

  @Column({ type: 'char', length: 64 })
  sha256!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

/** Un voto por usuario e incidente: votar de nuevo REEMPLAZA (UPSERT), nunca duplica. */
@Entity('incident_confirmations')
@Unique('incident_confirmations_incident_user_key', ['incidentId', 'userId'])
@Check('incident_confirmations_geofence', 'distance_m <= 500')
export class IncidentConfirmationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  incidentId!: string;

  @Index('incident_confirmations_user_id_idx')
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: ['CONFIRM', 'DENY'], enumName: 'vote_kind' })
  kind!: VoteKind;

  /** w_u congelado al momento del voto (auditabilidad del score). */
  @Column({ type: 'double precision' })
  weight!: number;

  @Column({ type: 'boolean', default: false })
  isBrigade!: boolean;

  @Column({ type: 'double precision' })
  distanceM!: number;

  @Column({ type: 'double precision' })
  lat!: number;

  @Column({ type: 'double precision' })
  lng!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => IncidentEntity, (i) => i.confirmations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'incident_id' })
  incident!: Relation<IncidentEntity>;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<UserEntity>;
}
