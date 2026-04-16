import { Test, TestingModule } from '@nestjs/testing';
import { RelationService } from '@/modules/system/user/admin/services/relation.service';
import { PROFILE_REPOSITORY } from '@/modules/system/user/domain/profile.repository';

describe('RelationService (admin)', () => {
  let service: RelationService;
  let profileRepo: { upsertByUserId: jest.Mock };

  beforeEach(async () => {
    profileRepo = {
      upsertByUserId: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelationService,
        { provide: PROFILE_REPOSITORY, useValue: profileRepo },
      ],
    }).compile();

    service = module.get(RelationService);
  });

  it('does nothing when data has no profile', async () => {
    await service.sync(10, {} as { profile?: any });
    expect(profileRepo.upsertByUserId).not.toHaveBeenCalled();
  });

  it('upserts profile when data.profile is set', async () => {
    await service.sync(5, {
      profile: {
        gender: 'male',
        address: 'HN',
        country_id: '100',
      },
    });

    expect(profileRepo.upsertByUserId).toHaveBeenCalledTimes(1);
    expect(profileRepo.upsertByUserId).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        gender: 'male',
        address: 'HN',
      }),
    );
  });
});
