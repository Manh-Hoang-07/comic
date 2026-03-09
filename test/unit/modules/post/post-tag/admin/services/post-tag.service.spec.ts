import { Test, TestingModule } from '@nestjs/testing';
import { PostTagService } from '@/modules/post/post-tag/admin/services/post-tag.service';
import { POST_TAG_REPOSITORY } from '@/modules/post/post-tag/domain/post-tag.repository';
import { SlugHelper } from '@/common/core/utils/slug.helper';

jest.mock('@/common/core/utils/slug.helper');


describe('PostTagService', () => {
    let service: PostTagService;
    let tagRepo: any;

    beforeEach(async () => {
        tagRepo = {
            findById: jest.fn(),
            findFirstRaw: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostTagService,
                {
                    provide: POST_TAG_REPOSITORY,
                    useValue: tagRepo,
                },
            ],
        }).compile();

        service = module.get<PostTagService>(PostTagService);

        jest.spyOn(service as any, 'getList').mockResolvedValue('list_result');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getSimpleList', () => {
        it('should call getList with default limit 1000', async () => {
            const query = { search: 'tag' };

            const result = await service.getSimpleList(query as any);

            expect((service as any).getList).toHaveBeenCalledWith({
                ...query,
                limit: 1000,
            });
            expect(result).toBe('list_result');
        });
    });

    describe('beforeCreate', () => {
        it('should clone data and call SlugHelper', async () => {
            const data = { name: 'Tech', slug: '' };
            (SlugHelper.uniqueSlug as jest.Mock).mockResolvedValue('tech-slug');

            const result = await (service as any).beforeCreate(data);

            expect(SlugHelper.uniqueSlug).toHaveBeenCalledWith('Tech', tagRepo);
            expect(result.slug).toBe('tech-slug');
        });
    });

    describe('beforeUpdate', () => {
        it('should call SlugHelper', async () => {
            const data = { name: 'New name', slug: '' };
            (SlugHelper.uniqueSlug as jest.Mock).mockResolvedValue('new-slug');

            const result = await (service as any).beforeUpdate(1n, data);

            expect(SlugHelper.uniqueSlug).toHaveBeenCalledWith('New name', tagRepo, 1n);
            expect(result.slug).toBe('new-slug');
        });

        it('should respect updated slug field instead of name', async () => {
            const data = { slug: 'provided-slug', name: 'Some Name' };
            (SlugHelper.uniqueSlug as jest.Mock).mockResolvedValue('unique-slug');

            const result = await (service as any).beforeUpdate(1n, data);

            expect(SlugHelper.uniqueSlug).toHaveBeenCalledWith('provided-slug', tagRepo, 1n);
            expect(result.slug).toBe('unique-slug');
        });
    });
});

