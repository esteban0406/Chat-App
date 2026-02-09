import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ServerPermission } from '../../generated/prisma/client';

export const PERMISSION_KEY = 'requiredPermission';
export const SERVER_ID_SOURCE_KEY = 'serverIdSource';

export interface ServerIdSource {
  from: 'params' | 'body' | 'channel';
  field: string;
}

export function RequirePermission(
  permission: ServerPermission,
  serverIdSource: ServerIdSource,
) {
  return applyDecorators(
    SetMetadata(PERMISSION_KEY, permission),
    SetMetadata(SERVER_ID_SOURCE_KEY, serverIdSource),
  );
}
