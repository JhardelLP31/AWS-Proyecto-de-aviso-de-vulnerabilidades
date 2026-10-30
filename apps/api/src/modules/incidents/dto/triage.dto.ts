import { INCIDENT_STATUSES, IncidentStatus, SEVERITIES, Severity } from '@geoalert/contracts';
import { IsDefined, IsIn, IsInt, IsOptional, Min, ValidateIf } from 'class-validator';

/** PATCH /incidents/:id/triage — al menos uno de severity/status, con bloqueo optimista. */
export class TriageDto {
  @IsOptional()
  @IsIn(SEVERITIES)
  severity?: Severity;

  @ValidateIf((o: TriageDto) => o.severity === undefined)
  @IsDefined({ message: 'Envía severity y/o status' })
  @IsIn(INCIDENT_STATUSES)
  status?: IncidentStatus;

  @IsInt()
  @Min(0)
  expectedVersion!: number;
}

/** POST /incidents/:id/verify */
export class VerifyIncidentDto {
  @IsInt()
  @Min(0)
  expectedVersion!: number;
}
