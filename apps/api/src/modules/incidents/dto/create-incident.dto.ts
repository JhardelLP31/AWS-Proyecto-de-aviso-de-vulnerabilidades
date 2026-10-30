import { INCIDENT_TYPES, IncidentType, SEVERITIES, Severity } from '@geoalert/contracts';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsIn, IsLatitude, IsLongitude, IsOptional, IsString, Length, MaxDate } from 'class-validator';
import { IsInsidePiura } from '../../../common/validators';
import { trim } from './transforms';

/**
 * Campos de texto del multipart/form-data de POST /incidents.
 * Los números llegan como string → @Type(() => Number). Las fotos van aparte (campo `photos`).
 */
export class CreateIncidentDto {
  @IsIn(INCIDENT_TYPES)
  type!: IncidentType;

  @IsIn(SEVERITIES)
  severity!: Severity;

  @Transform(trim)
  @IsString()
  @Length(4, 120)
  title!: string;

  @Transform(trim)
  @IsString()
  @Length(10, 2000)
  description!: string;

  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsLongitude()
  @IsInsidePiura()
  lng!: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  district?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @MaxDate(() => new Date(Date.now() + 5 * 60_000), { message: 'occurredAt no puede estar en el futuro' })
  occurredAt?: Date;
}
