import { Module } from '@nestjs/common';
import { PublicCachePurgeController } from './public/controllers/public-cache-purge.controller';

@Module({
  controllers: [PublicCachePurgeController],
})
export class CachePurgeModule {}
