import { INCIDENT_STATUSES, INCIDENT_TYPES, IncidentStatus, IncidentType, SEVERITIES, Severity, VoteKind } from '@geoalert/contracts';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Campos de texto del multipart/form-data (los números llegan como string → @Type(() => Number)). */
export class ReportIncidentDto {
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
  lng!: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  district?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  occurredAt?: Date;
}

export class CastVoteDto {
  @IsIn(['CONFIRM', 'DENY'])
  kind!: VoteKind;

  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  @IsNumber()
  @Min(0)
  @Max(10_000)
  accuracyM!: number;
}

export class TriageDto {
  @IsOptional()
  @IsIn(SEVERITIES)
  severity?: Severity;

  @IsOptional()
  @IsIn(INCIDENT_STATUSES)
  status?: IncidentStatus;

  @IsInt()
  @Min(0)
  expectedVersion!: number;

  /** Al menos uno de los dos campos debe venir. */
  @ValidateIf((o: TriageDto) => o.severity === undefined && o.status === undefined)
  @IsString({ message: 'Envía severity y/o status' })
  readonly _atLeastOne?: never;
}

export class VerifyDto {
  @IsInt()
  @Min(0)
  expectedVersion!: number;
}

export class BoundsQueryDto {
  /** "minLng,minLat,maxLng,maxLat" */
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map(Number) : value))
  @IsNumber({}, { each: true })
  bbox!: [number, number, number, number];

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsIn(INCIDENT_STATUSES, { each: true })
  status?: IncidentStatus[];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  since?: Date;
}
