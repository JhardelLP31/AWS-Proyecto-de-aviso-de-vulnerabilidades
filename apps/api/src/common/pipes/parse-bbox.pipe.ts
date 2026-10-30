import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { BBox } from '@geoalert/contracts';

/** "minLng,minLat,maxLng,maxLat" → BBox validado. Útil en @Query('bbox') sueltos (p. ej. analítica). */
@Injectable()
export class ParseBBoxPipe implements PipeTransform<unknown, BBox> {
  transform(value: unknown): BBox {
    const parts = typeof value === 'string' ? value.split(',').map(Number) : [];
    const [minLng, minLat, maxLng, maxLat] = parts;
    const ok =
      parts.length === 4 &&
      parts.every(Number.isFinite) &&
      minLng < maxLng &&
      minLat < maxLat &&
      minLng >= -180 &&
      maxLng <= 180 &&
      minLat >= -90 &&
      maxLat <= 90;
    if (!ok) throw new BadRequestException('bbox debe ser "minLng,minLat,maxLng,maxLat"');
    return [minLng, minLat, maxLng, maxLat];
  }
}
