import { IRepository, IPaginationOptions, IPaginatedResult } from './repository.interface';
import { createPaginationMeta } from '@/common/core/utils';
import { toPrimaryKey, parseSort, resolveQuerySelection } from './prisma-query.helper';

// Generic Delegate for Prisma Client models
export interface PrismaDelegate {
    findMany: (args: any) => Promise<any[]>;
    findFirst: (args: any) => Promise<any | null>;
    findUnique?: (args: any) => Promise<any | null>;
    count: (args: any) => Promise<number>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    updateMany: (args: any) => Promise<{ count: number }>;
    upsert: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    deleteMany: (args: any) => Promise<{ count: number }>;
}

/**
 * Base Prisma Repository.
 */
export abstract class PrismaRepository<
    Model,
    WhereInput = any,
    _CreateInput = any,
    _UpdateInput = any,
    OrderByInput = any
> implements IRepository<Model> {
    protected isSoftDelete = false;
    protected defaultSelect: any = undefined;
    protected defaultInclude: any = undefined;

    constructor(
        protected readonly delegate: PrismaDelegate,
        protected readonly defaultSort: string = 'created_at:desc',
    ) { }

    /** Must be implemented by subclasses to transform abstract filters to Prisma WhereInput. */
    protected abstract buildWhere(filter: Record<string, any>): WhereInput;

    // ── Query Operations ───────────────────────────────────────────────────────

    async findAll(options: IPaginationOptions = {}): Promise<IPaginatedResult<Model>> {
        const page = Math.max(Number(options.page) || 1, 1);
        const limit = Math.max(Number(options.limit) || 10, 1);
        const sort = options.sort || this.defaultSort;
        const filter = options.filter || {};

        const where: any = this.buildWhere(filter);
        const orderBy = this.parseSort(sort) as unknown as OrderByInput[];

        const selectionFlat = resolveQuerySelection(options, {
            select: this.defaultSelect,
            include: this.defaultInclude,
        });

        const skipCount = (options as any).skipCount === true;
        const queryArgs = {
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            ...selectionFlat,
        };

        const [data, total] = await Promise.all([
            this.delegate.findMany(queryArgs),
            skipCount ? Promise.resolve(0) : this.delegate.count({ where }),
        ]);

        return {
            data,
            meta: createPaginationMeta(page, limit, total),
        };
    }

    async findById(id: string | number | bigint): Promise<Model | null> {
        const selection = resolveQuerySelection(
            {},
            { select: this.defaultSelect, include: this.defaultInclude },
        );

        // Some models don't have findUnique (usually many-to-many or specific schemas)
        const finder = this.delegate.findUnique || this.delegate.findFirst;

        return finder({
            where: { id: toPrimaryKey(id) } as any,
            ...selection,
        });
    }

    async findManyByIds(ids: (string | number | bigint)[]): Promise<Model[]> {
        if (!ids?.length) return [];
        const selection = resolveQuerySelection(
            {},
            { select: this.defaultSelect, include: this.defaultInclude },
        );

        return this.delegate.findMany({
            where: { id: { in: ids.map(toPrimaryKey) } } as any,
            ...selection,
        });
    }

    async findOne(filter: Record<string, any>): Promise<Model | null> {
        const selection = resolveQuerySelection(
            {},
            { select: this.defaultSelect, include: this.defaultInclude },
        );

        return this.delegate.findFirst({
            where: this.buildWhere(filter),
            ...selection,
        });
    }

    async findMany(
        filter: Record<string, any> = {},
        options: IPaginationOptions = {},
    ): Promise<Model[]> {
        const selectionFlat = resolveQuerySelection(options, {
            select: this.defaultSelect,
            include: this.defaultInclude,
        });

        return this.delegate.findMany({
            where: this.buildWhere(filter),
            orderBy: options.sort ? this.parseSort(options.sort) : undefined,
            take: options.limit,
            skip:
                options.page && options.limit ? (options.page - 1) * options.limit : undefined,
            ...selectionFlat,
        });
    }

    // ── Mutation Operations ────────────────────────────────────────────────────

    async create(data: any): Promise<Model> {
        return this.delegate.create({ data });
    }

    async update(id: string | number | bigint, data: any): Promise<Model> {
        return this.delegate.update({
            where: { id: toPrimaryKey(id) } as any,
            data,
        });
    }

    async updateMany(filter: Record<string, any>, data: any): Promise<{ count: number }> {
        return this.delegate.updateMany({
            where: this.buildWhere(filter),
            data,
        });
    }

    async upsert(id: string | number | bigint, data: any): Promise<Model> {
        const pk = toPrimaryKey(id);
        return this.delegate.upsert({
            where: { id: pk } as any,
            create: { ...data, id: pk },
            update: data,
        });
    }

    async delete(id: string | number | bigint): Promise<boolean> {
        try {
            await this.delegate.delete({
                where: { id: toPrimaryKey(id) } as any,
            });
            return true;
        } catch {
            return false;
        }
    }

    async deleteMany(filter: Record<string, any>): Promise<{ count: number }> {
        return this.delegate.deleteMany({
            where: this.buildWhere(filter),
        });
    }

    // ── Utility Operations ─────────────────────────────────────────────────────

    async exists(filter: Record<string, any>): Promise<boolean> {
        const count = await this.delegate.count({ where: this.buildWhere(filter) });
        return count > 0;
    }

    async count(filter: Record<string, any> = {}): Promise<number> {
        return this.delegate.count({ where: this.buildWhere(filter) });
    }

    // ── Low-level Access ───────────────────────────────────────────────────────

    async findFirstRaw(options: any): Promise<Model | null> {
        return this.delegate.findFirst(options);
    }

    async findManyRaw(options: any): Promise<Model[]> {
        return this.delegate.findMany(options);
    }

    // ── Internal Helpers (Backward Compatibility Delegates) ────────────────────

    protected toPrimaryKey(id: any): any {
        return toPrimaryKey(id);
    }

    protected parseSort(sortStr: string): OrderByInput[] {
        return parseSort(sortStr) as unknown as OrderByInput[];
    }
}
