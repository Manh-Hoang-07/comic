import { Test, TestingModule } from '@nestjs/testing';
import { PostCategoryService } from '@/modules/post/post-category/admin/services/post-category.service';
import { POST_CATEGORY_REPOSITORY } from '@/modules/post/post-category/domain/post-category.repository';
import { SlugHelper } from '@/common/core/utils/slug.helper';

jest.mock('@/common/core/utils/slug.helper');

describe('PostCategoryService', () => {
  let service: PostCategoryService;
  let categoryRepo: any;

  beforeEach(async () => {
    categoryRepo = {
      findById: jest.fn(),
      findFirstRaw: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostCategoryService,
        {
          provide: POST_CATEGORY_REPOSITORY,
          useValue: categoryRepo,
        },
      ],
    }).compile();

    service = module.get<PostCategoryService>(PostCategoryService);

    jest.spyOn(service as any, 'getList').mockResolvedValue('list_result');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSimpleList', () => {
    it('should call getList with default sort and limit 1000', async () => {
      const query = { search: 'cat' };

      const result = await service.getSimpleList(query as any);

      expect((service as any).getList).toHaveBeenCalledWith({
        ...query,
        limit: 1000,
        sort: 'sort_order:ASC',
      });
      expect(result).toBe('list_result');
    });

    it('should respect custom sort but still force limit 1000', async () => {
      const query = { search: 'cat', sort: 'name:DESC', limit: 20 };

      await service.getSimpleList(query as any);

      expect((service as any).getList).toHaveBeenCalledWith({
        ...query,
        limit: 1000,
        sort: 'name:DESC',
      });
    });
  });

  describe('beforeCreate', () => {
    it('should call SlugHelper and convert parent_id to bigint', async () => {
      const data = { name: 'Tech', parent_id: '5' };
      (SlugHelper.uniqueSlug as jest.Mock).mockResolvedValue('tech-slug');

      const result = await (service as any).beforeCreate(data);

      expect(SlugHelper.uniqueSlug).toHaveBeenCalledWith('Tech', categoryRepo);
      expect(result.slug).toBe('tech-slug');
      expect(result.parent_id).toBe(5n);
    });

    it('should set parent_id to undefined when invalid', async () => {
      const data = { name: 'Tech', parent_id: 'invalid' };
      (SlugHelper.uniqueSlug as jest.Mock).mockResolvedValue('tech-slug');

      const result = await (service as any).beforeCreate(data);

      expect(result.parent_id).toBeNull();
    });
  });

  describe('beforeUpdate', () => {
    it('should call SlugHelper and handle parent_id', async () => {
      const data = { name: 'New', parent_id: '2' };
      (SlugHelper.uniqueSlug as jest.Mock).mockResolvedValue('new-slug');

      const result = await (service as any).beforeUpdate(1n, data);

      expect(SlugHelper.uniqueSlug).toHaveBeenCalledWith(
        'New',
        categoryRepo,
        1n,
      );
      expect(result.slug).toBe('new-slug');
      expect(result.parent_id).toBe(2n);
    });
  });

  describe('transform', () => {
    it('should keep only id, name, slug for parent and children', () => {
      const category: any = {
        id: 1,
        name: 'Parent',
        slug: 'parent',
        parent: {
          id: 2,
          name: 'Root',
          slug: 'root',
          extra: 'ignored',
        },
        children: [
          { id: 3, name: 'Child1', slug: 'child-1', extra: 'x' },
          { id: 4, name: 'Child2', slug: 'child-2', extra: 'y' },
        ],
      };

      const result = (service as any).transform(category);

      expect(result.parent).toEqual({ id: 2, name: 'Root', slug: 'root' });
      expect(result.children).toEqual([
        { id: 3, name: 'Child1', slug: 'child-1' },
        { id: 4, name: 'Child2', slug: 'child-2' },
      ]);
    });

    it('should return entity as is when no parent and children', () => {
      const category: any = { id: 1, name: 'Single', slug: 'single' };
      const result = (service as any).transform(category);
      expect(result).toEqual(category);
    });
  });
});
