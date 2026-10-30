/**
 * Migración del dataset mock → PostgreSQL/PostGIS.
 *
 *   pnpm --filter @geoalert/api db:import-indeci -- ./data/indeci-piura.json
 *   pnpm --filter @geoalert/api db:import-indeci -- --synthetic      (5 000 sintéticos)
 *
 * Idempotente: `externalRef` es UNIQUE y se usa skipDuplicates, así que se puede
 * re-ejecutar tras corregir el mapeo sin duplicar filas. Los registros inválidos se
 * reportan en un archivo de rechazos en lugar de abortar todo el lote.
 */
import { PrismaClient } from '@prisma/client';
import { readFile, writeFile } from 'node:fs/promises';
import { IndeciRecord, mapIndeciRecord } from '../src/modules/incidents/infrastructure/indeci.mapper';
import { generateSyntheticIndeci } from '../src/modules/incidents/infrastructure/synthetic-dataset';

const BATCH = 500;

async function main(): Promise<void> {
  const arg = process.argv[2] ?? './data/indeci-piura.json';
  const records: IndeciRecord[] =
    arg === '--synthetic' ? generateSyntheticIndeci() : (JSON.parse(await readFile(arg, 'utf8')) as IndeciRecord[]);

  const prisma = new PrismaClient();
  const rejected: Array<{ codigo: string; error: string }> = [];
  let inserted = 0;

  try {
    for (let i = 0; i < records.length; i += BATCH) {
      const rows = records.slice(i, i + BATCH).flatMap((r) => {
        try {
          const { photos: _none, ...incident } = mapIndeciRecord(r);
          return [
            {
              ...incident,
              verifiedAt: incident.status === 'VERIFIED' ? incident.occurredAt : null,
              resolvedAt: incident.status === 'RESOLVED' ? incident.occurredAt : null,
            },
          ];
        } catch (err) {
          rejected.push({ codigo: r.codigo, error: (err as Error).message });
          return [];
        }
      });
      const { count } = await prisma.incident.createMany({ data: rows, skipDuplicates: true });
      inserted += count;
      console.log(`Lote ${i / BATCH + 1}: ${count}/${rows.length} insertados`);
    }
  } finally {
    await prisma.$disconnect();
  }

  if (rejected.length) await writeFile('./import-rechazos.json', JSON.stringify(rejected, null, 2));
  console.log(`Listo: ${inserted} insertados, ${rejected.length} rechazados, ${records.length} leídos.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
