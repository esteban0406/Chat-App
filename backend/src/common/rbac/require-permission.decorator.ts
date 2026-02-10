import { SetMetadata } from '@nestjs/common';
import { ServerPermission } from '../../generated/prisma/client';

export const PERMISSION_KEY = 'requiredPermission';

export function RequirePermission(permission: ServerPermission) {
  return SetMetadata(PERMISSION_KEY, permission);
}
