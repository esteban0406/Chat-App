import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HTTPLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;

    const body = req.body as Record<string, unknown>;

    this.logger.log(`El logggeosss [${method}] ${originalUrl}`);

    if (body && Object.keys(body).length > 0) {
      const sanitizedBody = { ...body };

      const sensitiveFields = ['password', 'token'];
      sensitiveFields.forEach((field) => {
        if (field in sanitizedBody) {
          sanitizedBody[field] = '[REDACTED]';
        }
      });

      this.logger.debug(`Body: ${JSON.stringify(sanitizedBody)}`);
    }

    next();
  }
}
