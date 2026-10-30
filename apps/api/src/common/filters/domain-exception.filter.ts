import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError, httpStatusFor } from '../errors/domain-error';

/** Traduce errores de dominio a HTTP con un cuerpo estable: { code, message, details }. */
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
