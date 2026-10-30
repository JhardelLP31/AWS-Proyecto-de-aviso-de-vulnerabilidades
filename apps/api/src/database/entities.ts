import { AuditLogEntity } from '../modules/audit/entities/audit-log.entity';
import { IncidentConfirmationEntity, IncidentEntity, IncidentPhotoEntity } from '../modules/incidents/entities/incident.entities';
import {
  PermissionEntity,
  RoleEntity,
  RolePermissionEntity,
  UserEntity,
  UserPermissionEntity,
  UserRoleEntity,
} from '../modules/rbac/entities/rbac.entities';

/** Lista explícita (sin globs): funciona igual en `tsc`, en el bundle de esbuild y en Lambda. */
export const ENTITIES = [
  UserEntity,
  RoleEntity,
  PermissionEntity,
  UserRoleEntity,
  RolePermissionEntity,
  UserPermissionEntity,
  IncidentEntity,
  IncidentPhotoEntity,
  IncidentConfirmationEntity,
  AuditLogEntity,
];
