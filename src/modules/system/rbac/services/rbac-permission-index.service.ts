import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PERM } from '@/modules/system/rbac/rbac.constants';
import { RedisUtil } from '@/core/utils/redis.util';
import {
  IPermissionRepository,
  PERMISSION_REPOSITORY,
} from '@/modules/system/permission/domain/permission.repository';

type PermissionNode = { code: string; parentCode: string | null };

@Injectable()
export class RbacPermissionIndexService
  implements OnModuleInit, OnModuleDestroy
{
  private permissionByCode = new Map<string, PermissionNode>();
  private lastPermFetchMs = 0;
  private readonly permIndexTtlMs = 24 * 60 * 60 * 1000;
  private readonly prewarmIntervalMs = 6 * 60 * 60 * 1000;
  private readonly permIndexRefreshChannel = 'rbac:perm_index_refresh';
  private permissionIndexRefreshInFlight: Promise<void> | null = null;
  private prewarmTimer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepo: IPermissionRepository,
    private readonly redis: RedisUtil,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensurePermissionIndexes().catch(() => undefined);

    if (this.redis.isEnabled()) {
      await this.redis.subscribe(this.permIndexRefreshChannel, (_message) => {
        void this.refreshNow().catch(() => undefined);
      });
    }

    this.prewarmTimer = setInterval(() => {
      void this.ensurePermissionIndexes().catch(() => undefined);
    }, this.prewarmIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.prewarmTimer) {
      clearInterval(this.prewarmTimer);
      this.prewarmTimer = null;
    }
  }

  async prepare(): Promise<void> {
    await this.ensurePermissionIndexes();
  }

  async refreshNow(): Promise<void> {
    this.lastPermFetchMs = 0;
    await this.ensurePermissionIndexes(true);
  }

  matchesAssigned(assignedCodes: Set<string>, need: string): boolean {
    return this.grants(need, (code) => assignedCodes.has(code));
  }

  /**
   * Returns true if the user has **at least one** of the required permissions (OR logic).
   * Example: `@Permission('comic.manage', 'user.manage')` = user needs ONE of them, not both.
   */
  hasAnyRequiredFromAssigned(
    assignedCodes: Set<string>,
    required: string[],
  ): boolean {
    return required.some((need) => this.matchesAssigned(assignedCodes, need));
  }

  private async ensurePermissionIndexes(force = false): Promise<void> {
    if (
      !force &&
      this.permissionByCode.size > 0 &&
      Date.now() - this.lastPermFetchMs <= this.permIndexTtlMs
    )
      return;

    if (this.permissionIndexRefreshInFlight) {
      await this.permissionIndexRefreshInFlight;
      return;
    }

    this.permissionIndexRefreshInFlight = (async () => {
      const byCode = new Map<string, PermissionNode>();
      const nodes = await this.permissionRepo.findActiveForRbacIndex();
      type PermRow = { id: unknown; code: string; parent_id?: unknown };
      const byId = new Map<string, { code: string; parent_id: string | null }>();
      for (const n of nodes as PermRow[]) {
        byId.set(String(n.id), {
          code: n.code,
          parent_id: n.parent_id != null ? String(n.parent_id) : null,
        });
      }
      for (const n of nodes as PermRow[]) {
        const parent =
          n.parent_id != null ? byId.get(String(n.parent_id)) : null;
        if (n.code)
          byCode.set(n.code, {
            code: n.code,
            parentCode: parent?.code ?? null,
          });
      }
      this.permissionByCode = byCode;
      this.lastPermFetchMs = Date.now();
    })();

    try {
      await this.permissionIndexRefreshInFlight;
    } finally {
      this.permissionIndexRefreshInFlight = null;
    }
  }

  private grants(need: string, has: (code: string) => boolean): boolean {
    if (has(PERM.SYSTEM.MANAGE)) return true;
    if (has(need)) return true;
    const visited = new Set<string>();
    for (let cur = this.permissionByCode.get(need); cur?.parentCode; ) {
      if (visited.has(cur.parentCode)) break;
      visited.add(cur.parentCode);
      const parent = this.permissionByCode.get(cur.parentCode);
      if (!parent) break;
      if (parent.code && has(parent.code)) return true;
      cur = parent;
    }
    return false;
  }
}
