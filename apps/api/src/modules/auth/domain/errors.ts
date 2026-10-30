import { DomainError } from '../../../common/errors/domain-error';

export class EmailAlreadyRegistered extends DomainError {
  readonly code = 'EMAIL_ALREADY_REGISTERED';
  readonly kind = 'conflict';
}
