import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from '@/modules/post/post/admin/services/post.service';
import { POST_REPOSITORY } from '@/modules/post/post/domain/post.repository';
import { PostActionService } from '@/modules/post/post/admin/services/post-action.service';
import { SlugHelper } from '@/common/core/utils/slug.helper';
import * as utils from '@/common/shared/utils';

jest.mock('@/common/shared/utils', () => ({
  verifyGroupOwnership: jest.fn(),
}));

jest.mock('@/common/core/utils/slug.helper');

describe('PostService', () => {
  let service: PostService;
  let postRepo: any;
  let actionService: any;

  beforeEach(async () => {
    postRepo = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };

    actionService = {
      syncRelations: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: POST_REPOSITORY, useValue: postRepo },
        { provide: PostActionService, useValue: actionService },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    jest.spyOn(service as any, 'getList').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSimpleList', () => {
    it('should call getList with default pagination', async () => {
      await service.getSimpleList({ search: 'test' });
      expect((service as any).getList).toHaveBeenCalledWith({
        page: 1,
        limit: 1000,
        search: 'test',
      });
    });
  });

  describe('beforeCreate', () => {
    it('should call SlugHelper and return modified payload', async () => {
      const data = {
        title: 'Test',
        primary_postcategory_id: 123,
        tag_ids: [1, 2],
        group_id: 1n,
      };
      (SlugHelper.uniqueSlug as jest.Mock).mockResolvedValue('test-slug');

      jest
        .spyOn(Object.getPrototypeOf(PostService.prototype), 'beforeCreate')
        .mockResolvedValue({ ...data });

      const result = await (service as any).beforeCreate(data);

      expect(result.primary_postcategory_id).toBe(123n);
      expect(result.group_id).toBe(1n);
      expect(result.tag_ids).toBeUndefined();
      expect(result.slug).toBe('test-slug');
    });
  });

  describe('create', () => {
    it('should call syncRelations', async () => {
      const data = { title: 'T' };
      const payload = { title: 'T', slug: 't' };
      const entity = { id: 5 };

      jest.spyOn(service as any, 'beforeCreate').mockResolvedValue(payload);
      postRepo.create.mockResolvedValue(entity);
      jest.spyOn(service, 'getOne').mockResolvedValue(entity as any);

      const result = await service.create(data);

      expect(postRepo.create).toHaveBeenCalledWith(payload);
      expect(actionService.syncRelations).toHaveBeenCalledWith(5, data);
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('should call syncRelations and update', async () => {
      const data = { title: 'T' };
      const payload = { title: 'T', slug: 't' };
      const entity = { id: 5 };

      jest.spyOn(service as any, 'beforeUpdate').mockResolvedValue(payload);
      postRepo.update.mockResolvedValue(entity);
      jest.spyOn(service, 'getOne').mockResolvedValue(entity as any);

      const result = await service.update(5, data);

      expect(postRepo.update).toHaveBeenCalledWith(5, payload);
      expect(actionService.syncRelations).toHaveBeenCalledWith(5, data);
      expect(result).toEqual(entity);
    });
  });

  describe('getOne', () => {
    it('should verify group ownership', async () => {
      const entity = { id: 1, group_id: 2n };
      jest
        .spyOn(Object.getPrototypeOf(PostService.prototype), 'getOne')
        .mockResolvedValue(entity);

      const result = await service.getOne(1);

      expect(result).toEqual(entity);
      expect(utils.verifyGroupOwnership).toHaveBeenCalledWith({ group_id: 2 });
    });
  });

  describe('transform', () => {
    it('should map primary_category, categories, and tags', () => {
      const post = {
        primary_category: { id: 1, name: 'Cat', slug: 'cat', extra: 1 },
        categories: [
          { category: { id: 2, name: 'Cat2', slug: 'cat2', extra: 2 } },
        ],
        tags: [{ tag: { id: 3, name: 'Tag3', slug: 'tag3', extra: 3 } }],
      };

      const result = (service as any).transform(post);

      expect(result.primary_category).toEqual({
        id: 1,
        name: 'Cat',
        slug: 'cat',
      });
      expect(result.categories).toEqual([
        { id: 2, name: 'Cat2', slug: 'cat2' },
      ]);
      expect(result.tags).toEqual([{ id: 3, name: 'Tag3', slug: 'tag3' }]);
    });
  });
});
