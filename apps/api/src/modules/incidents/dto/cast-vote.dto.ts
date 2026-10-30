import type { VoteKind } from '@geoalert/contracts';
import { IsIn, IsLatitude, IsLongitude, IsNumber, Max, Min } from 'class-validator';

/** POST /incidents/:id/votes — la geocerca de 500 m se valida en el service (depende del incidente). */
export class CastVoteDto {
  @IsIn(['CONFIRM', 'DENY'])
  kind!: VoteKind;

  @IsLatitude()
  lat!: number;

  @IsLongitude()
  lng!: number;

  /** Precisión del GPS del dispositivo en metros (GeolocationCoordinates.accuracy). */
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(10_000)
  accuracyM!: number;
}
