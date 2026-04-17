import { Global, Module } from '@nestjs/common';
import { CONTEXT_REPOSITORY } from './domain/context.repository';
import { ContextRepositoryImpl } from './infrastructure/repositories/context.repository.impl';
import { GROUP_REPOSITORY } from '@/modules/system/group/domain/group.repository';
import { GroupRepositoryImpl } from '@/modules/system/group/infrastructure/repositories/group.repository.impl';

@Global()
@Module({
  providers: [
    {
      provide: CONTEXT_REPOSITORY,
      useClass: ContextRepositoryImpl,
    },
    {
      provide: GROUP_REPOSITORY,
      useClass: GroupRepositoryImpl,
    },
  ],
  exports: [CONTEXT_REPOSITORY, GROUP_REPOSITORY],
})
export class ContextRepositoryModule {}
