export const RBAC_CATALOG_TTL_SEC = 86400;

export const RbacCatalogKeys = {
  ctxById: 'rbac:ctx:by_id',
  ctxIds: 'rbac:ctx:ids',

  grpById: 'rbac:grp:by_id',
  grpIds: 'rbac:grp:ids',
  grpIdsByContext: 'rbac:grp:ids_by_context',

  roleById: 'rbac:role:by_id',
  roleIds: 'rbac:role:ids',

  permByCode: 'rbac:perm:by_code',
  permCodes: 'rbac:perm:codes',

  rolePermByRole: 'rbac:role_perm:by_role',
  roleCtxByContext: 'rbac:role_ctx:by_context',
} as const;

