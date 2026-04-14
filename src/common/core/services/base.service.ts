import { NotFoundException } from '@nestjs/common';
import {
  IRepository,
  IPaginatedResult,
  IPaginationOptions,
} from '../repositories/repository.interface';
import {
  createPaginationMeta,
  prepareQuery,
  stableObjectJsonForCache,
} from '../utils';
import { assignGroupOwnership } from '@/common/shared/utils/group-ownership.util';
import type { CacheService } from '@/common/cache/services/cache.service';

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

  /**
   * Cache getList — mặc định tắt (client null hoặc ttl ≤ 0).
   * Service con chỉ cần gán `cacheForGetList` + `cacheForGetListTtlSec` (khai báo field / trong constructor).
   */
  protected cacheForGetList: CacheService | null = null;
  protected cacheForGetListTtlSec = 0;

  constructor(protected readonly repository: R) {}

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
  protected async afterCreate(_entity: T, _data: any): Promise<void> {}

  /** Chạy trước khi update: có thể validate, transform data. */
  protected async beforeUpdate(_id: any, data: any): Promise<any> {
    return data;
  }

  /** Chạy sau khi update thành công. */
  protected async afterUpdate(_entity: T, _data: any): Promise<void> {}

  /** Chạy trước khi delete. Trả về false để hủy xóa. */
  protected async beforeDelete(_id: any): Promise<boolean> {
    return true;
  }

  /** Chạy sau khi delete thành công. */
  protected async afterDelete(_id: any, _entity?: any): Promise<void> {}

  /** Chuẩn hóa pagination options (page, limit, sort). */
  protected async prepareOptions(
    options: IPaginationOptions,
  ): Promise<IPaginationOptions> {
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
  protected async afterGetList(
    result: IPaginatedResult<T>,
  ): Promise<IPaginatedResult<T>> {
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

  /**
   * Khóa cache cho getList (mặc định theo query đã sort key).
   * Service con có thể override (vd. prefix Redis cố định).
   */
  protected buildGetListCacheKey(queryOrOptions: any): string {
    return `${this.constructor.name}:${stableObjectJsonForCache(queryOrOptions)}`;
  }

  /** Thân getList: query DB + transform (không cache). */
  protected async executeGetList(
    queryOrOptions: any = {},
  ): Promise<IPaginatedResult<T>> {
    const { filter, options } = prepareQuery(queryOrOptions);
    const normalized = await this.prepareOptions(options);
    const preparedFilters = await this.prepareFilters(filter, normalized);

    if (preparedFilters === false) {
      return {
        data: [],
        meta: createPaginationMeta(
          normalized.page as number,
          normalized.limit as number,
          0,
        ),
      };
    }

    normalized.filter =
      preparedFilters && typeof preparedFilters === 'object'
        ? preparedFilters
        : filter;

    const result = await this.repository.findAll(normalized);
    const transformedData = await Promise.all(
      result.data.map((row) => {
        const t = this.transform(row);
        return t instanceof Promise ? t : Promise.resolve(t as T | null);
      }),
    );
    result.data = transformedData as T[];

    return this.afterGetList(result);
  }

  /** Lấy danh sách phân trang (có thể bọc cache khi gán cacheForGetList + cacheForGetListTtlSec). */
  async getList(queryOrOptions: any = {}): Promise<IPaginatedResult<T>> {
    const client = this.cacheForGetList;
    const ttl = this.cacheForGetListTtlSec;
    if (client && ttl > 0) {
      const key = this.buildGetListCacheKey(queryOrOptions);
      return client.getOrSet(
        key,
        () => this.executeGetList(queryOrOptions),
        ttl,
      );
    }
    return this.executeGetList(queryOrOptions);
  }

  /** Lấy một bản ghi theo ID. */
  async getOne(id: any, options: IPaginationOptions = {}): Promise<T> {
    const entity = await this.repository.findById(id, options);
    if (!entity)
      throw new NotFoundException(`Resource with ID ${id} not found`);

    const transformed = this.transform(entity) as T;
    const final = await this.afterGetOne(transformed);
    if (!final)
      throw new NotFoundException(
        `Resource with ID ${id} not found after processing`,
      );
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
  async update(id: any, data: any): Promise<T> {
    const payload = await this.beforeUpdate(id, data);
    const entity = await this.repository.update(id, payload);
    if (!entity)
      throw new NotFoundException(`Resource with ID ${id} not found to update`);
    await this.afterUpdate(entity, data);
    return this.transform(entity) as T;
  }

  /** Xóa. */
  async delete(id: any): Promise<any> {
    const canDelete = await this.beforeDelete(id);
    if (!canDelete) return false;
    const result = await this.repository.delete(id);
    if (result) await this.afterDelete(id);
    return result;
  }

  /**
   * Transform dữ liệu trả về.
   * Mặc định trả về entity nguyên bản.
   * Override ở subclass để thêm logic custom (giấu field, map data...).
   */
  protected transform(entity: T | null): T | null {
    return entity;
  }
}
