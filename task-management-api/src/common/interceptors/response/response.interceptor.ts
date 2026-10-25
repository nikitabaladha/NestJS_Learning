import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, map } from 'rxjs';

export const RESPONSE_MESSAGE = 'response_message';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, object> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<object> {
    const response = context.switchToHttp().getResponse();

    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) ??
      'Request successful';

    return next.handle().pipe(
      map((data: T) => ({
        statusCode: response.statusCode,
        success: true,
        message,
        data,
      })),
    );
  }
}
