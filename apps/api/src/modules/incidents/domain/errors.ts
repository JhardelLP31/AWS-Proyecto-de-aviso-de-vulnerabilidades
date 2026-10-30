import { DomainError } from '../../../common/errors/domain-error';

export class IncidentNotFound extends DomainError {
  readonly code = 'INCIDENT_NOT_FOUND';
  readonly kind = 'not_found';
}
export class GeofenceViolation extends DomainError {
  readonly code = 'GEOFENCE_VIOLATION';
  readonly kind = 'invalid';
}
export class SelfVoteNotAllowed extends DomainError {
  readonly code = 'SELF_VOTE_NOT_ALLOWED';
  readonly kind = 'forbidden';
}
export class IncidentClosed extends DomainError {
  readonly code = 'INCIDENT_CLOSED';
  readonly kind = 'conflict';
}
export class InvalidPhoto extends DomainError {
  readonly code = 'INVALID_PHOTO';
  readonly kind = 'invalid';
}
export class OutOfCoverageArea extends DomainError {
  readonly code = 'OUT_OF_COVERAGE_AREA';
  readonly kind = 'invalid';
}
export class StaleVersion extends DomainError {
  readonly code = 'STALE_VERSION';
  readonly kind = 'conflict';
}
