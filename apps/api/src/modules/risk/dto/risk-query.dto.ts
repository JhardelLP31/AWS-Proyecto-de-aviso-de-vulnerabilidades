import type { BBox } from '@geoalert/contracts';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { IsBBox } from '../../../common/validators';
import { csvNumbers } from '../../incidents/dto/transforms';

/** GET /risk/heatmap?bbox=minLng,minLat,maxLng,maxLat (opcional: sin bbox devuelve toda la región). */
export class HeatmapQueryDto {
  @IsOptional()
  @Transform(csvNumbers)
  @IsBBox()
  bbox?: BBox;
}

/** GET /risk/forecast?precipitationMm=80 */
export class ForecastQueryDto {
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(500)
  precipitationMm!: number;
}
