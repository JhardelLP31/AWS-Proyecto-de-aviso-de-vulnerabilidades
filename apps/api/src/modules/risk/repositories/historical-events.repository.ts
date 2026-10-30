import { readFile } from 'node:fs/promises';
import { Logger } from '@nestjs/common';
import { fromSinpadRow, type HistoricalEvent, type SinpadRow } from '../domain/historical-event';

export const HISTORICAL_EVENTS = Symbol('HISTORICAL_EVENTS');

export interface IHistoricalEventsRepository {
  all(): Promise<HistoricalEvent[]>;
}

/**
 * Datos de referencia de solo lectura (≈ 2 MB): se cargan una vez por proceso y se quedan en memoria.
 * La carga es perezosa para no sumar tiempo al cold start de Lambda si nadie pide riesgo.
 */
export class FileHistoricalEventsRepository implements IHistoricalEventsRepository {
  private readonly logger = new Logger('HistoricalEvents');
  private loading?: Promise<HistoricalEvent[]>;

  constructor(private readonly path: string) {}

  all(): Promise<HistoricalEvent[]> {
    this.loading ??= this.load().catch((err) => {
      this.loading = undefined; // permitir reintento si el archivo aparece después
      throw err;
    });
    return this.loading;
  }

  private async load(): Promise<HistoricalEvent[]> {
    const rows = JSON.parse(await readFile(this.path, 'utf8')) as SinpadRow[];
    if (!Array.isArray(rows)) throw new Error(`${this.path} debe ser un array JSON`);
    const events = rows.map(fromSinpadRow).filter((e): e is HistoricalEvent => e !== null);
    this.logger.log(`${events.length} eventos históricos cargados (${rows.length - events.length} descartados)`);
    return events;
  }
}

export class InMemoryHistoricalEventsRepository implements IHistoricalEventsRepository {
  constructor(private readonly events: HistoricalEvent[]) {}
  async all() {
    return this.events;
  }
}
