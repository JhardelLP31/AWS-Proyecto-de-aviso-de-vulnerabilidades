import { BBox, INCIDENT_STATUSES, IncidentStatus } from '@geoalert/contracts';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsIn, IsOptional } from 'class-validator';
import { IsBBox } from '../../../common/validators';
import { csv, csvNumbers } from './transforms';

/** GET /incidents?bbox=minLng,minLat,maxLng,maxLat&status=PENDING,VERIFIED&since=ISO */
export class BoundsQueryDto {
  @Transform(csvNumbers)
  @IsBBox()
  bbox!: BBox;

  @IsOptional()
  @Transform(csv)
  @IsIn(INCIDENT_STATUSES, { each: true })
  status?: IncidentStatus[];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  since?: Date;
}
