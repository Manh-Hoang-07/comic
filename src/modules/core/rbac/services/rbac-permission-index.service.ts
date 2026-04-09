import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PERM } from '@/modules/core/rbac/rbac.constants';
import { IPermissionRepository, PERMISSION_REPOSITORY } from '@/modules/core/iam/permission/domain/permission.repository';

type PermissionNode = { id: any; code: string; parent_id: any | null };

@Injectable()
export class RbacPermissionIndexService implements OnModuleInit, OnModuleDestroy {
  private permissionById = new Map<string, PermissionNode>();
  private permissionByCode = new Map<string, PermissionNode>();
  private lastPermFetchMs = 0;
  private readonly permIndexTtlMs = 5 * 60 * 1000;
  private readonly prewarmIntervalMs = 4 * 60 * 1000;
  private permissionIndexRefreshInFlight: Promise<void> | null = null;
  private prewarmTimer: NodeJS.Timeout | null = null;

  constructor(
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepo: IPermissionRepository,
  ) { }

  async onModuleInit(): Promise<void> {
    await this.ensurePermissionIndexes().catch(() => undefined);
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

  async preparePermissionCheck(): Promise<void> {
    await this.ensurePermissionIndexes();
  }

  matchesAssigned(assignedCodes: Set<string>, need: string): boolean {
    return this.grants(assignedCodes, need);
  }

  hasAnyRequiredFromAssigned(assignedCodes: Set<string>, required: string[]): boolean {
    return required.some((need) => this.grants(assignedCodes, need));
  }

  private async ensurePermissionIndexes(): Promise<void> {
    if (this.permissionById.size > 0 && Date.now() - this.lastPermFetchMs <= this.permIndexTtlMs) return;

    if (this.permissionIndexRefreshInFlight) {
      await this.permissionIndexRefreshInFlight;
      return;
    }

    this.permissionIndexRefreshInFlight = (async () => {
      const all = await this.permissionRepo.findActiveForRbacIndex();
      const byId = new Map<string, PermissionNode>();
      const byCode = new Map<string, PermissionNode>();
      for (const p of all as PermissionNode[]) {
        byId.set(String(p.id), p);
        if (p.code) byCode.set(p.code, p);
      }
      this.permissionById = byId;
      this.permissionByCode = byCode;
      this.lastPermFetchMs = Date.now();
    })();

    try {
      await this.permissionIndexRefreshInFlight;
    } finally {
      this.permissionIndexRefreshInFlight = null;
    }
  }

  private grants(assignedCodes: Set<string>, need: string): boolean {
    if (assignedCodes.has(PERM.SYSTEM.MANAGE)) return true;
    if (assignedCodes.has(need)) return true;

    for (let cur = this.permissionByCode.get(need); cur?.parent_id;) {
      const parent = this.permissionById.get(String(cur.parent_id));
      if (!parent) break;
      if (parent.code && assignedCodes.has(parent.code)) return true;
      cur = parent;
    }
    return false;
  }
}
