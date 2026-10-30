import { DataSource, EntityManager } from 'typeorm';
import type { Rescorer } from '../domain/veracity';
import { IncidentConfirmationEntity, IncidentEntity, IncidentPhotoEntity } from '../entities/incident.entities';
import type { BoundsQuery, Incident, NewIncident, TriagePatch, Vote } from '../types/incident.types';
import type { IIncidentRepository, VoteOutcome } from './incident.repository';

const toDomain = (row: IncidentEntity): Incident => ({
  id: row.id,
  type: row.type,
  severity: row.severity,
  status: row.status,
  title: row.title,
  description: row.description,
  lat: row.lat,
  lng: row.lng,
  district: row.district,
  veracityScore: row.veracityScore,
  confirmCount: row.confirmCount,
  denyCount: row.denyCount,
  source: row.source,
  externalRef: row.externalRef,
  reporterId: row.reporterId,
  occurredAt: row.occurredAt,
  verifiedAt: row.verifiedAt,
  resolvedAt: row.resolvedAt,
  version: row.version,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  photos: (row.photos ?? [])
    .sort((a, b) => +a.createdAt - +b.createdAt)
    .map(({ storageKey, mimeType, width, height, bytes, sha256 }) => ({ storageKey, mimeType, width, height, bytes, sha256 })),
});

/** Persistencia real: TypeORM + PostgreSQL + PostGIS (índice GIST sobre la columna generada `location`). */
export class TypeOrmIncidentRepository implements IIncidentRepository {
  constructor(private readonly db: DataSource) {}

  private findOneWith(em: EntityManager, id: string) {
    return em.getRepository(IncidentEntity).findOne({ where: { id }, relations: { photos: true } });
  }

  async findById(id: string): Promise<Incident | null> {
    const row = await this.findOneWith(this.db.manager, id);
    return row && toDomain(row);
  }

  async findInBounds({ bbox: [minLng, minLat, maxLng, maxLat], statuses, since, limit }: BoundsQuery): Promise<Incident[]> {
    // `&&` (intersección de bounding boxes) usa el índice GIST. Todo va parametrizado.
    const qb = this.db
      .getRepository(IncidentEntity)
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.photos', 'p')
      .where('i.location && ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)', { minLng, minLat, maxLng, maxLat })
      .orderBy('i.severity', 'DESC') // el enum está ordenado GREEN < YELLOW < ORANGE < RED
      .addOrderBy('i.occurredAt', 'DESC')
      .take(limit); // take (no limit) para que la paginación respete el join con fotos

    if (statuses.length) qb.andWhere('i.status IN (:...statuses)', { statuses });
    if (since) qb.andWhere('i.occurredAt >= :since', { since });

    return (await qb.getMany()).map(toDomain);
  }

  async create({ photos, status, ...data }: NewIncident): Promise<Incident> {
    return this.db.transaction(async (em) => {
      const incident = await em.getRepository(IncidentEntity).save(
        em.getRepository(IncidentEntity).create({ ...data, status: status ?? 'PENDING' }),
      );
      if (photos.length) {
        await em.getRepository(IncidentPhotoEntity).insert(photos.map((p) => ({ ...p, incidentId: incident.id })));
      }
      return toDomain((await this.findOneWith(em, incident.id))!);
    });
  }

  async applyVote(vote: Vote, rescore: Rescorer): Promise<VoteOutcome> {
    return this.db.transaction(async (em) => {
      // Bloqueo de fila: serializa votos concurrentes sobre el mismo incidente.
      await em.query('SELECT 1 FROM incidents WHERE id = $1 FOR UPDATE', [vote.incidentId]);
      const current = toDomain((await this.findOneWith(em, vote.incidentId))!);

      const votes = em.getRepository(IncidentConfirmationEntity);
      const replacedPreviousVote = await votes.exists({ where: { incidentId: vote.incidentId, userId: vote.userId } });
      await votes.upsert(vote, { conflictPaths: ['incidentId', 'userId'] });

      const all = await votes.find({ where: { incidentId: vote.incidentId } });
      const result = rescore(all, current);

      // update() no pasa por @VersionColumn: se incrementa explícitamente.
      await em.getRepository(IncidentEntity).update(vote.incidentId, { ...result, version: current.version + 1 });
      const updated = toDomain((await this.findOneWith(em, vote.incidentId))!);
      return { incident: updated, previousStatus: current.status, replacedPreviousVote };
    });
  }

  async updateTriage(id: string, patch: TriagePatch, expectedVersion: number): Promise<Incident | null> {
    return this.db.transaction(async (em) => {
      const now = new Date();
      const result = await em
        .createQueryBuilder()
        .update(IncidentEntity)
        .set({
          ...patch,
          ...(patch.status === 'RESOLVED' ? { resolvedAt: now } : {}),
          ...(patch.status === 'VERIFIED' ? { verifiedAt: () => 'COALESCE(verified_at, now())' } : {}),
          version: () => 'version + 1',
        })
        .where('id = :id AND version = :expectedVersion', { id, expectedVersion })
        .execute();
      if (!result.affected) return null;
      return toDomain((await this.findOneWith(em, id))!);
    });
  }
}
