import { NotFoundException } from '@nestjs/common';
import { IRepository, IPaginatedResult, IPaginationOptions } from '../repositories/repository.interface';
import { createPaginationMeta, prepareQuery } from '../utils';
import { getGroupFilter, assignGroupOwnership } from '@/common/shared/utils/group-ownership.util';

/**
 * Base Service DB-agnostic.
 * Làm việc thông qua Repository Interface thay vì trực tiếp với ORM.
 */
export abstract class BaseService<T, R extends IRepository<T>> {
    /**
     * Tự động thêm group_id vào payload khi tạo mới.
     * Service con có thể set = true trong constructor để bật tính năng này.
     */
    protected autoAddGroupId: boolean = false;

    constructor(protected readonly repository: R) { }

    protected getGroupFilter(): any {
        return getGroupFilter();
    }

    // ── Lifecycle hooks (override in subclasses) ───────────────────────────────

    /** Chạy trước khi create: có thể thêm group_id, transform data, v.v. */
    protected async beforeCreate(data: any): Promise<any> {
        const payload = { ...data };
        if (this.autoAddGroupId) {
            assignGroupOwnership(payload);
        }
        return payload;
    }

    /** Chạy sau khi create thành công. */
    protected async afterCreate(_entity: T, _data: any): Promise<void> { }

    /** Chạy trước khi update: có thể validate, transform data. */
    protected async beforeUpdate(_id: string | number | bigint, data: any): Promise<any> {
        return data;
    }

    /** Chạy sau khi update thành công. */
    protected async afterUpdate(_entity: T, _data: any): Promise<void> { }

    /** Chạy trước khi delete. Trả về false để hủy xóa. */
    protected async beforeDelete(_id: string | number | bigint): Promise<boolean> {
        return true;
    }

    /** Chạy sau khi delete thành công. */
    protected async afterDelete(_id: string | number | bigint, _entity?: any): Promise<void> { }

    /** Chuẩn hóa pagination options (page, limit, sort). */
    protected async prepareOptions(options: IPaginationOptions): Promise<IPaginationOptions> {
        const page = Math.max(Number(options.page) || 1, 1);
        const maxLimit = (options as any).maxLimit ?? 100;
        const limit = Math.min(Math.max(Number(options.limit) || 10, 1), maxLimit);
        const sort = options.sort || (this as any).defaultSort || 'id:DESC';
        return { ...options, page, limit, sort };
    }

    /**
     * Chuẩn bị filters trước khi query.
     * Trả về false → bỏ qua query, trả kết quả rỗng ngay lập tức.
     */
    protected async prepareFilters(
        filters?: Record<string, any>,
        _options?: any,
    ): Promise<Record<string, any> | boolean | undefined> {
        return filters;
    }

    /** Xử lý sau khi getList (ví dụ: sort lại, enrich data). */
    protected async afterGetList(result: IPaginatedResult<T>): Promise<IPaginatedResult<T>> {
        return result;
    }

    /** Xử lý sau khi getOne (ví dụ: load thêm relations). */
    protected async afterGetOne(entity: T | null): Promise<T | null> {
        return entity;
    }

    // ── CRUD operations ────────────────────────────────────────────────────────

    /** Lấy danh sách không phân trang (thường dùng cho dropdown). */
    async getSimpleList(query: any = {}) {
        const limit = Number(query.limit) || 1000;
        return this.getList({
            ...query,
            limit,
            maxLimit: query.maxLimit || Math.max(limit, 1000),
            skipCount: true,
        });
    }

    /** Lấy danh sách phân trang. */
    async getList(queryOrOptions: any = {}): Promise<IPaginatedResult<T>> {
        const { filter, options } = prepareQuery(queryOrOptions);
        const normalized = await this.prepareOptions(options);
        const preparedFilters = await this.prepareFilters(filter, normalized);

        if (preparedFilters === false) {
            return {
                data: [],
                meta: createPaginationMeta(normalized.page as number, normalized.limit as number, 0),
            };
        }

        normalized.filter =
            preparedFilters && typeof preparedFilters === 'object' ? preparedFilters : filter;

        const result = await this.repository.findAll(normalized);

        // Transform each item (sync or async)
        const transformedData = new Array(result.data.length);
        for (let i = 0; i < result.data.length; i++) {
            const t = this.transform(result.data[i]);
            transformedData[i] = t instanceof Promise ? await t : t;
        }
        result.data = transformedData as T[];

        return this.afterGetList(result);
    }

    /** Lấy một bản ghi theo ID. */
    async getOne(id: string | number | bigint, _options: IPaginationOptions = {}): Promise<T> {
        const entity = await this.repository.findById(id);
        if (!entity) throw new NotFoundException(`Resource with ID ${id} not found`);

        const transformed = this.transform(entity) as T;
        const final = await this.afterGetOne(transformed);
        if (!final) throw new NotFoundException(`Resource with ID ${id} not found after processing`);
        return final;
    }

    /** Tạo mới. */
    async create(data: any): Promise<T> {
        const payload = await this.beforeCreate(data);
        const entity = await this.repository.create(payload);
        await this.afterCreate(entity, data);
        return this.transform(entity) as T;
    }

    /** Cập nhật. */
    async update(id: string | number | bigint, data: any): Promise<T> {
        const payload = await this.beforeUpdate(id, data);
        const entity = await this.repository.update(id, payload);
        if (!entity) throw new NotFoundException(`Resource with ID ${id} not found to update`);
        await this.afterUpdate(entity, data);
        return this.transform(entity) as T;
    }

    /** Xóa. */
    async delete(id: string | number | bigint): Promise<any> {
        const canDelete = await this.beforeDelete(id);
        if (!canDelete) return false;
        const result = await this.repository.delete(id);
        if (result) await this.afterDelete(id);
        return result;
    }

    /**
     * Transform dữ liệu trả về.
     * Mặc định: convert BigInt → number để JSON serialization hoạt động đúng.
     * Override ở subclass để thêm logic custom.
     */
    protected transform(entity: T | null): T | null {
        if (!entity) return null;
        return deepConvertBigInt(entity);
    }

    /**
     * Helper để convert BigInt sang number trong object.
     * Subclass có thể gọi trực tiếp khi cần transform thủ công.
     */
    protected deepConvertBigInt(obj: any): any {
        return deepConvertBigInt(obj);
    }
}

/**
 * Recursively convert BigInt values to number in a plain object/array.
 * Exported for use outside BaseService (e.g. standalone services).
 */
export function deepConvertBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return Number(obj);
    if (typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj;

    if (Array.isArray(obj)) {
        const res = new Array(obj.length);
        for (let i = 0; i < obj.length; i++) res[i] = deepConvertBigInt(obj[i]);
        return res;
    }

    const ctor = obj.constructor;
    if (ctor !== undefined && ctor.name !== 'Object') return obj;

    const res: any = {};
    for (const key of Object.keys(obj)) {
        res[key] = deepConvertBigInt(obj[key]);
    }
    return res;
}
