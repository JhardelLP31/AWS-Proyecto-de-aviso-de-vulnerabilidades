import { HttpStatus } from '@nestjs/common';

/** Categoría agnóstica del transporte; HTTP y WebSocket la traducen cada uno a su manera. */
export type DomainErrorKind = 'not_found' | 'forbidden' | 'conflict' | 'invalid';

/** Error de negocio. Los services y el dominio lanzan esto, nunca HttpException. */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly kind: DomainErrorKind;

  constructor(
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

const HTTP_BY_KIND: Record<DomainErrorKind, number> = {
  not_found: HttpStatus.NOT_FOUND,
  forbidden: HttpStatus.FORBIDDEN,
  conflict: HttpStatus.CONFLICT,
  invalid: HttpStatus.UNPROCESSABLE_ENTITY,
};

export const httpStatusFor = (err: DomainError): number => HTTP_BY_KIND[err.kind];
