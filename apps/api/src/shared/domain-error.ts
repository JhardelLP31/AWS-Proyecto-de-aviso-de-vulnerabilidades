import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

/** Categoría agnóstica del transporte; HTTP y WebSocket la traducen cada uno a su manera. */
export type DomainErrorKind = 'not_found' | 'forbidden' | 'conflict' | 'invalid';

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

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(err: DomainError, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(httpStatusFor(err))
      .json({ code: err.code, message: err.message, details: err.details });
  }
}
