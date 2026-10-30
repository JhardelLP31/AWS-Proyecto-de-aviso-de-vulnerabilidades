import { Prisma, PrismaClient } from '@prisma/client';
import type { BoundsQuery, Incident, NewIncident, TriagePatch, Vote } from '../domain/incident';
import type { IIncidentRepository, VoteOutcome } from '../domain/ports';
import type { Rescorer } from '../domain/veracity';

const withPhotos = { photos: { orderBy: { createdAt: 'asc' } } } satisfies Prisma.IncidentInclude;
type IncidentRow = Prisma.IncidentGetPayload<{ include: typeof withPhotos }>;

const toDomain = (row: IncidentRow): Incident => ({
  ...row,
  photos: row.photos.map(({ storageKey, mimeType, width, height, bytes, sha256 }) => ({
    storageKey, mimeType, width, height, bytes, sha256,
  })),
});

/** Persistencia real: Prisma + PostGIS (índice GIST sobre la columna generada `location`). */
export class PostgresIncidentRepository implements IIncidentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Incident | null> {
    const row = await this.prisma.incident.findUnique({ where: { id }, include: withPhotos });
    return row && toDomain(row);
  }

  async findInBounds({ bbox: [minLng, minLat, maxLng, maxLat], statuses, since, limit }: BoundsQuery): Promise<Incident[]> {
    // Filtro espacial con el operador && (bounding box) → usa el índice GIST.
    // Todos los valores viajan como parámetros ($1, $2…): no hay interpolación de strings.
    const ids = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Incident"
      WHERE "location" && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
        ${statuses.length ? Prisma.sql`AND "status"::text IN (${Prisma.join(statuses)})` : Prisma.empty}
        ${since ? Prisma.sql`AND "occurredAt" >= ${since}` : Prisma.empty}
      ORDER BY array_position(ARRAY['GREEN','YELLOW','ORANGE','RED'], "severity"::text) DESC, "occurredAt" DESC
      LIMIT ${limit}`;
    if (ids.length === 0) return [];

    const rows = await this.prisma.incident.findMany({ where: { id: { in: ids.map((r) => r.id) } }, include: withPhotos });
    const order = new Map(ids.map((r, i) => [r.id, i]));
    return rows.sort((a, b) => order.get(a.id)! - order.get(b.id)!).map(toDomain);
  }

  async create({ photos, ...data }: NewIncident): Promise<Incident> {
    const row = await this.prisma.incident.create({
      data: {
        ...data,
        status: data.status ?? 'PENDING',
        photos: { create: photos },
      },
      include: withPhotos,
    });
    return toDomain(row);
  }

  async applyVote(vote: Vote, rescore: Rescorer): Promise<VoteOutcome> {
    return this.prisma.$transaction(async (tx) => {
      // Bloqueo de fila: serializa votos concurrentes sobre el mismo incidente.
      await tx.$executeRaw`SELECT 1 FROM "Incident" WHERE id = ${vote.incidentId}::uuid FOR UPDATE`;
      const current = await tx.incident.findUniqueOrThrow({ where: { id: vote.incidentId }, include: withPhotos });

      const key = { incidentId_userId: { incidentId: vote.incidentId, userId: vote.userId } };
      const existing = await tx.incidentConfirmation.findUnique({ where: key, select: { id: true } });
      const { incidentId: _i, userId: _u, ...fields } = vote;
      await tx.incidentConfirmation.upsert({ where: key, create: vote, update: fields });

      const votes = await tx.incidentConfirmation.findMany({ where: { incidentId: vote.incidentId } });
      const result = rescore(votes, toDomain(current));

      const updated = await tx.incident.update({
        where: { id: vote.incidentId },
        data: { ...result, version: { increment: 1 } },
        include: withPhotos,
      });
      return { incident: toDomain(updated), previousStatus: current.status, replacedPreviousVote: Boolean(existing) };
    });
  }

  async updateTriage(id: string, patch: TriagePatch, expectedVersion: number): Promise<Incident | null> {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      // updateMany permite condicionar por versión sin lanzar si no coincide.
      const { count } = await tx.incident.updateMany({
        where: { id, version: expectedVersion },
        data: {
          ...patch,
          ...(patch.status === 'RESOLVED' ? { resolvedAt: now } : {}),
          version: { increment: 1 },
        },
      });
      if (count === 0) return null;
      if (patch.status === 'VERIFIED') {
        await tx.incident.updateMany({ where: { id, verifiedAt: null }, data: { verifiedAt: now } });
      }
      const row = await tx.incident.findUniqueOrThrow({ where: { id }, include: withPhotos });
      return toDomain(row);
    });
  }
}
