import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/** 25 s: por debajo de los 29 s de API Gateway, para responder un 408 claro en vez de un 504 opaco. */
const REQUEST_TIMEOUT_MS = 25_000;

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (ctx.getType() !== 'http') return next.handle();
    return next.handle().pipe(
      timeout(REQUEST_TIMEOUT_MS),
      catchError((err: unknown) =>
        throwError(() => (err instanceof TimeoutError ? new RequestTimeoutException('La operación tardó demasiado') : err)),
      ),
    );
  }
}
