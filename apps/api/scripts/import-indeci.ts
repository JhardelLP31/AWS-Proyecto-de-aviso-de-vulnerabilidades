/**
 * Migración del dataset mock → PostgreSQL/PostGIS (requiere `pnpm build` y `pnpm migration:run`).
 *
 *   pnpm db:import-indeci ./data/indeci-piura.json
 *   pnpm db:import-indeci --synthetic          (5 000 registros sintéticos)
 *
 * Idempotente: `external_ref` es UNIQUE y se inserta con ON CONFLICT DO NOTHING, así que se
 * puede re-ejecutar tras corregir el mapeo sin duplicar filas. Los registros inválidos se
 * escriben en import-rechazos.json en lugar de abortar el lote.
 */
import 'reflect-metadata';
import { readFile, writeFile } from 'node:fs/promises';
import dataSource from '../src/database/data-source';
import { IncidentEntity } from '../src/modules/incidents/entities/incident.entities';
import { IndeciRecord, mapIndeciRecord } from '../src/modules/incidents/repositories/indeci/indeci.mapper';
import { generateSyntheticIndeci } from '../src/modules/incidents/repositories/indeci/synthetic-dataset';

const BATCH = 500;

async function main(): Promise<void> {
  const arg = process.argv[2] ?? './data/indeci-piura.json';
  const records: IndeciRecord[] =
    arg === '--synthetic' ? generateSyntheticIndeci() : (JSON.parse(await readFile(arg, 'utf8')) as IndeciRecord[]);

  await dataSource.initialize();
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
      const result = await dataSource
        .createQueryBuilder()
        .insert()
        .into(IncidentEntity)
        .values(rows)
        .orIgnore()
        .returning('id')
        .execute();
      const count = (result.raw as unknown[]).length;
      inserted += count;
      console.log(`Lote ${i / BATCH + 1}: ${count}/${rows.length} insertados`);
    }
  } finally {
    await dataSource.destroy();
  }

  if (rejected.length) await writeFile('./import-rechazos.json', JSON.stringify(rejected, null, 2));
  console.log(`Listo: ${inserted} insertados, ${rejected.length} rechazados, ${records.length} leídos.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
