23:52:49.319 Running build in Washington, D.C., USA (East) – iad1
23:52:49.319 Build machine configuration: 2 cores, 8 GB
23:52:49.458 Cloning github.com/Manh-Hoang-07/comic (Branch: master, Commit: 91c8cb9)
23:52:49.459 Previous build caches not available.
23:52:50.154 Cloning completed: 696.000ms
23:52:50.694 Running "vercel build"
23:52:51.376 Vercel CLI 50.43.0
23:52:52.144 Installing dependencies...
23:52:55.379 npm warn deprecated whatwg-encoding@3.1.1: Use @exodus/bytes instead for a more spec-conformant and faster implementation
23:52:55.838 npm warn deprecated supertest@6.3.4: Please upgrade to supertest v7.1.3+, see release notes at https://github.com/forwardemail/supertest/releases/tag/v7.1.3 - maintenance is supported by Forward Email @ https://forwardemail.net
23:52:56.180 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
23:52:57.583 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
23:52:57.927 npm warn deprecated superagent@8.1.2: Please upgrade to superagent v10.2.2+, see release notes at https://github.com/forwardemail/superagent/releases/tag/v10.2.2 - maintenance is supported by Forward Email @ https://forwardemail.net
23:53:00.375 npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
23:53:00.439 npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
23:53:00.975 npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
23:53:01.110 npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
23:53:01.342 npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
23:53:01.379 npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
23:53:01.785 npm warn deprecated glob@7.2.3: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
23:53:03.549 npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
23:53:03.622 npm warn deprecated glob@10.4.5: Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me
23:53:06.073 npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
23:53:10.176 
23:53:10.176 added 1285 packages in 18s
23:53:10.177 
23:53:10.177 204 packages are looking for funding
23:53:10.179   run `npm fund` for details
23:53:10.281 Running "npm run build"
23:53:10.658 
23:53:10.659 > nestjs-backend@1.0.0 build
23:53:10.659 > nest build
23:53:10.659 
23:53:20.603 [96msrc/common/http/filters/query-failed.filter.ts[0m:[93m9[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.603 
23:53:20.603 [7m9[0m import { Prisma } from '@prisma/client';
23:53:20.604 [7m [0m [91m         ~~~~~~[0m
23:53:20.604 [96msrc/core/database/prisma/prisma.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PrismaClient'.
23:53:20.604 
23:53:20.604 [7m2[0m import { PrismaClient } from '@prisma/client';
23:53:20.604 [7m [0m [91m         ~~~~~~~~~~~~[0m
23:53:20.604 [96msrc/core/database/prisma/prisma.service.ts[0m:[93m38[0m:[93m16[0m - [91merror[0m[90m TS2339: [0mProperty '$connect' does not exist on type 'PrismaService'.
23:53:20.604 
23:53:20.604 [7m38[0m     await this.$connect();
23:53:20.604 [7m  [0m [91m               ~~~~~~~~[0m
23:53:20.604 [96msrc/core/database/prisma/prisma.service.ts[0m:[93m40[0m:[93m16[0m - [91merror[0m[90m TS2339: [0mProperty '$queryRaw' does not exist on type 'PrismaService'.
23:53:20.604 
23:53:20.604 [7m40[0m     await this.$queryRaw`SELECT 1`.catch(() => undefined);
23:53:20.604 [7m  [0m [91m               ~~~~~~~~~[0m
23:53:20.604 [96msrc/core/database/prisma/prisma.service.ts[0m:[93m44[0m:[93m16[0m - [91merror[0m[90m TS2339: [0mProperty '$disconnect' does not exist on type 'PrismaService'.
23:53:20.605 
23:53:20.605 [7m44[0m     await this.$disconnect();
23:53:20.605 [7m  [0m [91m               ~~~~~~~~~~~[0m
23:53:20.605 [96msrc/core/database/seeder/comic/seed-chapters.ts[0m:[93m12[0m:[93m48[0m - [91merror[0m[90m TS2339: [0mProperty 'chapter' does not exist on type 'PrismaService'.
23:53:20.605 
23:53:20.605 [7m12[0m     const existingChapters = await this.prisma.chapter.count();
23:53:20.605 [7m  [0m [91m                                               ~~~~~~~[0m
23:53:20.605 [96msrc/core/database/seeder/comic/seed-chapters.ts[0m:[93m23[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.605 
23:53:20.605 [7m23[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'admin' } });
23:53:20.605 [7m  [0m [91m                                        ~~~~[0m
23:53:20.605 [96msrc/core/database/seeder/comic/seed-chapters.ts[0m:[93m26[0m:[93m38[0m - [91merror[0m[90m TS2339: [0mProperty 'comic' does not exist on type 'PrismaService'.
23:53:20.605 
23:53:20.605 [7m26[0m     const comics = await this.prisma.comic.findMany();
23:53:20.605 [7m  [0m [91m                                     ~~~~~[0m
23:53:20.605 [96msrc/core/database/seeder/comic/seed-chapters.ts[0m:[93m29[0m:[93m43[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.605 
23:53:20.605 [7m29[0m     const systemGroup = await this.prisma.group.findFirst({ where: { code: 'system' } });
23:53:20.605 [7m  [0m [91m                                          ~~~~~[0m
23:53:20.605 [96msrc/core/database/seeder/comic/seed-chapters.ts[0m:[93m51[0m:[93m29[0m - [91merror[0m[90m TS2339: [0mProperty 'chapter' does not exist on type 'PrismaService'.
23:53:20.605 
23:53:20.605 [7m51[0m           await this.prisma.chapter.create({
23:53:20.605 [7m  [0m [91m                            ~~~~~~~[0m
23:53:20.605 [96msrc/core/database/seeder/comic/seed-chapters.ts[0m:[93m87[0m:[93m29[0m - [91merror[0m[90m TS2339: [0mProperty 'chapter' does not exist on type 'PrismaService'.
23:53:20.605 
23:53:20.605 [7m87[0m           await this.prisma.chapter.create({
23:53:20.606 [7m  [0m [91m                            ~~~~~~~[0m
23:53:20.606 [96msrc/core/database/seeder/comic/seed-chapters.ts[0m:[93m107[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'chapterPage' does not exist on type 'PrismaService'.
23:53:20.606 
23:53:20.606 [7m107[0m     await this.prisma.chapterPage.deleteMany({});
23:53:20.606 [7m   [0m [91m                      ~~~~~~~~~~~[0m
23:53:20.606 [96msrc/core/database/seeder/comic/seed-chapters.ts[0m:[93m108[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'chapter' does not exist on type 'PrismaService'.
23:53:20.606 
23:53:20.606 [7m108[0m     await this.prisma.chapter.deleteMany({});
23:53:20.606 [7m   [0m [91m                      ~~~~~~~[0m
23:53:20.606 [96msrc/core/database/seeder/comic/seed-comic-categories.ts[0m:[93m11[0m:[93m50[0m - [91merror[0m[90m TS2339: [0mProperty 'comicCategory' does not exist on type 'PrismaService'.
23:53:20.606 
23:53:20.606 [7m11[0m     const existingCategories = await this.prisma.comicCategory.count();
23:53:20.606 [7m  [0m [91m                                                 ~~~~~~~~~~~~~[0m
23:53:20.606 [96msrc/core/database/seeder/comic/seed-comic-categories.ts[0m:[93m14[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.606 
23:53:20.608 [7m14[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'admin' } });
23:53:20.608 [7m  [0m [91m                                        ~~~~[0m
23:53:20.609 [96msrc/core/database/seeder/comic/seed-comic-categories.ts[0m:[93m20[0m:[93m43[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.609 
23:53:20.609 [7m20[0m     const systemGroup = await this.prisma.group.findFirst({ where: { code: 'system' } });
23:53:20.609 [7m  [0m [91m                                          ~~~~~[0m
23:53:20.609 [96msrc/core/database/seeder/comic/seed-comic-categories.ts[0m:[93m24[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'comicCategory' does not exist on type 'PrismaService'.
23:53:20.609 
23:53:20.609 [7m24[0m       await this.prisma.comicCategory.create({
23:53:20.609 [7m  [0m [91m                        ~~~~~~~~~~~~~[0m
23:53:20.609 [96msrc/core/database/seeder/comic/seed-comic-categories.ts[0m:[93m38[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'comicCategory' does not exist on type 'PrismaService'.
23:53:20.609 
23:53:20.609 [7m38[0m     await this.prisma.comicCategory.deleteMany({});
23:53:20.609 [7m  [0m [91m                      ~~~~~~~~~~~~~[0m
23:53:20.609 [96msrc/core/database/seeder/comic/seed-comic-comments.ts[0m:[93m12[0m:[93m52[0m - [91merror[0m[90m TS2339: [0mProperty 'comicComment' does not exist on type 'PrismaService'.
23:53:20.609 
23:53:20.609 [7m12[0m         const existingComments = await this.prisma.comicComment.count();
23:53:20.609 [7m  [0m [91m                                                   ~~~~~~~~~~~~[0m
23:53:20.609 [96msrc/core/database/seeder/comic/seed-comic-comments.ts[0m:[93m21[0m:[93m42[0m - [91merror[0m[90m TS2339: [0mProperty 'comic' does not exist on type 'PrismaService'.
23:53:20.609 
23:53:20.609 [7m21[0m         const comics = await this.prisma.comic.findMany({ take: 10 });
23:53:20.609 [7m  [0m [91m                                         ~~~~~[0m
23:53:20.609 [96msrc/core/database/seeder/comic/seed-comic-comments.ts[0m:[93m22[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.616 
23:53:20.616 [7m22[0m         const users = await this.prisma.user.findMany({ take: 10 });
23:53:20.616 [7m  [0m [91m                                        ~~~~[0m
23:53:20.616 [96msrc/core/database/seeder/comic/seed-comic-comments.ts[0m:[93m33[0m:[93m51[0m - [91merror[0m[90m TS2339: [0mProperty 'comicComment' does not exist on type 'PrismaService'.
23:53:20.616 
23:53:20.616 [7m33[0m                 const comment = await this.prisma.comicComment.create({
23:53:20.616 [7m  [0m [91m                                                  ~~~~~~~~~~~~[0m
23:53:20.616 [96msrc/core/database/seeder/comic/seed-comic-comments.ts[0m:[93m44[0m:[93m39[0m - [91merror[0m[90m TS2339: [0mProperty 'comicComment' does not exist on type 'PrismaService'.
23:53:20.616 
23:53:20.616 [7m44[0m                     await this.prisma.comicComment.create({
23:53:20.616 [7m  [0m [91m                                      ~~~~~~~~~~~~[0m
23:53:20.617 [96msrc/core/database/seeder/comic/seed-comic-comments.ts[0m:[93m59[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'comicComment' does not exist on type 'PrismaService'.
23:53:20.617 
23:53:20.617 [7m59[0m         await this.prisma.comicComment.deleteMany({});
23:53:20.617 [7m  [0m [91m                          ~~~~~~~~~~~~[0m
23:53:20.617 [96msrc/core/database/seeder/comic/seed-comic-last-chapter.ts[0m:[93m11[0m:[93m40[0m - [91merror[0m[90m TS2339: [0mProperty 'comic' does not exist on type 'PrismaService'.
23:53:20.617 
23:53:20.617 [7m11[0m       const comics = await this.prisma.comic.findMany({
23:53:20.617 [7m  [0m [91m                                       ~~~~~[0m
23:53:20.617 [96msrc/core/database/seeder/comic/seed-comic-last-chapter.ts[0m:[93m21[0m:[93m49[0m - [91merror[0m[90m TS2339: [0mProperty 'chapter' does not exist on type 'PrismaService'.
23:53:20.617 
23:53:20.617 [7m21[0m           const lastChapter = await this.prisma.chapter.findFirst({
23:53:20.617 [7m  [0m [91m                                                ~~~~~~~[0m
23:53:20.617 [96msrc/core/database/seeder/comic/seed-comic-last-chapter.ts[0m:[93m30[0m:[93m29[0m - [91merror[0m[90m TS2339: [0mProperty 'comic' does not exist on type 'PrismaService'.
23:53:20.617 
23:53:20.617 [7m30[0m           await this.prisma.comic.update({
23:53:20.617 [7m  [0m [91m                            ~~~~~[0m
23:53:20.617 [96msrc/core/database/seeder/comic/seed-comics.ts[0m:[93m12[0m:[93m46[0m - [91merror[0m[90m TS2339: [0mProperty 'comic' does not exist on type 'PrismaService'.
23:53:20.617 
23:53:20.617 [7m12[0m     const existingComics = await this.prisma.comic.count();
23:53:20.617 [7m  [0m [91m                                             ~~~~~[0m
23:53:20.617 [96msrc/core/database/seeder/comic/seed-comics.ts[0m:[93m23[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.617 
23:53:20.617 [7m23[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'admin' } });
23:53:20.617 [7m  [0m [91m                                        ~~~~[0m
23:53:20.618 [96msrc/core/database/seeder/comic/seed-comics.ts[0m:[93m26[0m:[93m42[0m - [91merror[0m[90m TS2339: [0mProperty 'comicCategory' does not exist on type 'PrismaService'.
23:53:20.618 
23:53:20.618 [7m26[0m     const categories = await this.prisma.comicCategory.findMany();
23:53:20.618 [7m  [0m [91m                                         ~~~~~~~~~~~~~[0m
23:53:20.618 [96msrc/core/database/seeder/comic/seed-comics.ts[0m:[93m29[0m:[93m43[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.618 
23:53:20.618 [7m29[0m     const systemGroup = await this.prisma.group.findFirst({ where: { code: 'system' } });
23:53:20.618 [7m  [0m [91m                                          ~~~~~[0m
23:53:20.618 [96msrc/core/database/seeder/comic/seed-comics.ts[0m:[93m33[0m:[93m49[0m - [91merror[0m[90m TS7006: [0mParameter 'cat' implicitly has an 'any' type.
23:53:20.618 
23:53:20.618 [7m33[0m       const comicCategories = categories.filter(cat =>
23:53:20.618 [7m  [0m [91m                                                ~~~[0m
23:53:20.618 [96msrc/core/database/seeder/comic/seed-comics.ts[0m:[93m37[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'comic' does not exist on type 'PrismaService'.
23:53:20.618 
23:53:20.618 [7m37[0m       await this.prisma.comic.create({
23:53:20.618 [7m  [0m [91m                        ~~~~~[0m
23:53:20.618 [96msrc/core/database/seeder/comic/seed-comics.ts[0m:[93m58[0m:[93m41[0m - [91merror[0m[90m TS7006: [0mParameter 'cat' implicitly has an 'any' type.
23:53:20.618 
23:53:20.618 [7m58[0m             create: comicCategories.map(cat => ({ comic_category_id: cat.id })),
23:53:20.618 [7m  [0m [91m                                        ~~~[0m
23:53:20.619 [96msrc/core/database/seeder/comic/seed-comics.ts[0m:[93m66[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'comicCategoryOnComic' does not exist on type 'PrismaService'.
23:53:20.619 
23:53:20.619 [7m66[0m     await this.prisma.comicCategoryOnComic.deleteMany({});
23:53:20.619 [7m  [0m [91m                      ~~~~~~~~~~~~~~~~~~~~[0m
23:53:20.619 [96msrc/core/database/seeder/comic/seed-comics.ts[0m:[93m67[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'comicStats' does not exist on type 'PrismaService'.
23:53:20.619 
23:53:20.619 [7m67[0m     await this.prisma.comicStats.deleteMany({});
23:53:20.619 [7m  [0m [91m                      ~~~~~~~~~~[0m
23:53:20.619 [96msrc/core/database/seeder/comic/seed-comics.ts[0m:[93m68[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'comic' does not exist on type 'PrismaService'.
23:53:20.619 
23:53:20.619 [7m68[0m     await this.prisma.comic.deleteMany({});
23:53:20.619 [7m  [0m [91m                      ~~~~~[0m
23:53:20.619 [96msrc/core/database/seeder/core/seed-content-templates.ts[0m:[93m16[0m:[93m31[0m - [91merror[0m[90m TS2339: [0mProperty 'contentTemplate' does not exist on type 'PrismaService'.
23:53:20.619 
23:53:20.619 [7m16[0m             await this.prisma.contentTemplate.upsert({
23:53:20.619 [7m  [0m [91m                              ~~~~~~~~~~~~~~~[0m
23:53:20.619 [96msrc/core/database/seeder/core/seed-content-templates.ts[0m:[93m25[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'contentTemplate' does not exist on type 'PrismaService'.
23:53:20.619 
23:53:20.619 [7m25[0m         await this.prisma.contentTemplate.deleteMany({});
23:53:20.619 [7m  [0m [91m                          ~~~~~~~~~~~~~~~[0m
23:53:20.620 [96msrc/core/database/seeder/core/seed-email-configs.ts[0m:[93m11[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'emailConfig' does not exist on type 'PrismaService'.
23:53:20.620 
23:53:20.620 [7m11[0m     if (await this.prisma.emailConfig.findFirst()) return;
23:53:20.620 [7m  [0m [91m                          ~~~~~~~~~~~[0m
23:53:20.620 [96msrc/core/database/seeder/core/seed-email-configs.ts[0m:[93m16[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.620 
23:53:20.620 [7m16[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.620 [7m  [0m [91m                                        ~~~~[0m
23:53:20.620 [96msrc/core/database/seeder/core/seed-email-configs.ts[0m:[93m19[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'emailConfig' does not exist on type 'PrismaService'.
23:53:20.620 
23:53:20.620 [7m19[0m     await this.prisma.emailConfig.create({
23:53:20.620 [7m  [0m [91m                      ~~~~~~~~~~~[0m
23:53:20.620 [96msrc/core/database/seeder/core/seed-email-configs.ts[0m:[93m29[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'emailConfig' does not exist on type 'PrismaService'.
23:53:20.620 
23:53:20.620 [7m29[0m     await this.prisma.emailConfig.deleteMany({});
23:53:20.620 [7m  [0m [91m                      ~~~~~~~~~~~[0m
23:53:20.620 [96msrc/core/database/seeder/core/seed-general-configs.ts[0m:[93m11[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'generalConfig' does not exist on type 'PrismaService'.
23:53:20.620 
23:53:20.620 [7m11[0m     if (await this.prisma.generalConfig.findFirst()) return;
23:53:20.620 [7m  [0m [91m                          ~~~~~~~~~~~~~[0m
23:53:20.620 [96msrc/core/database/seeder/core/seed-general-configs.ts[0m:[93m16[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.620 
23:53:20.621 [7m16[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.621 [7m  [0m [91m                                        ~~~~[0m
23:53:20.621 [96msrc/core/database/seeder/core/seed-general-configs.ts[0m:[93m19[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'generalConfig' does not exist on type 'PrismaService'.
23:53:20.621 
23:53:20.621 [7m19[0m     await this.prisma.generalConfig.create({
23:53:20.621 [7m  [0m [91m                      ~~~~~~~~~~~~~[0m
23:53:20.621 [96msrc/core/database/seeder/core/seed-general-configs.ts[0m:[93m29[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'generalConfig' does not exist on type 'PrismaService'.
23:53:20.621 
23:53:20.621 [7m29[0m     await this.prisma.generalConfig.deleteMany({});
23:53:20.621 [7m  [0m [91m                      ~~~~~~~~~~~~~[0m
23:53:20.621 [96msrc/core/database/seeder/core/seed-groups.ts[0m:[93m14[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.621 
23:53:20.621 [7m14[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.621 [7m  [0m [91m                                        ~~~~[0m
23:53:20.621 [96msrc/core/database/seeder/core/seed-groups.ts[0m:[93m19[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'context' does not exist on type 'PrismaService'.
23:53:20.623 
23:53:20.623 [7m19[0m       let ctx = await this.prisma.context.findFirst({ where: { code: data.code } });
23:53:20.623 [7m  [0m [91m                                  ~~~~~~~[0m
23:53:20.623 [96msrc/core/database/seeder/core/seed-groups.ts[0m:[93m20[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'context' does not exist on type 'PrismaService'.
23:53:20.623 
23:53:20.623 [7m20[0m       if (!ctx) ctx = await this.prisma.context.create({ data });
23:53:20.623 [7m  [0m [91m                                        ~~~~~~~[0m
23:53:20.623 [96msrc/core/database/seeder/core/seed-groups.ts[0m:[93m31[0m:[93m37[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.624 
23:53:20.624 [7m31[0m       let group = await this.prisma.group.findFirst({ where: { code: data.code } });
23:53:20.624 [7m  [0m [91m                                    ~~~~~[0m
23:53:20.624 [96msrc/core/database/seeder/core/seed-groups.ts[0m:[93m33[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.624 
23:53:20.624 [7m33[0m         group = await this.prisma.group.create({
23:53:20.624 [7m  [0m [91m                                  ~~~~~[0m
23:53:20.624 [96msrc/core/database/seeder/core/seed-groups.ts[0m:[93m41[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.625 
23:53:20.625 [7m41[0m         group = await this.prisma.group.update({
23:53:20.625 [7m  [0m [91m                                  ~~~~~[0m
23:53:20.625 [96msrc/core/database/seeder/core/seed-groups.ts[0m:[93m52[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'context' does not exist on type 'PrismaService'.
23:53:20.632 
23:53:20.636 [7m52[0m       await this.prisma.context.update({ where: { id: groupContext.id }, data: { ref_id: groupDemo.id } });
23:53:20.637 [7m  [0m [91m                        ~~~~~~~[0m
23:53:20.637 [96msrc/core/database/seeder/core/seed-groups.ts[0m:[93m57[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'context' does not exist on type 'PrismaService'.
23:53:20.637 
23:53:20.637 [7m57[0m     await this.prisma.context.deleteMany({ where: { type: { not: 'system' } } });
23:53:20.637 [7m  [0m [91m                      ~~~~~~~[0m
23:53:20.637 [96msrc/core/database/seeder/core/seed-groups.ts[0m:[93m58[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.637 
23:53:20.638 [7m58[0m     await this.prisma.group.deleteMany({});
23:53:20.638 [7m  [0m [91m                      ~~~~~[0m
23:53:20.638 [96msrc/core/database/seeder/core/seed-locations.ts[0m:[93m11[0m:[93m48[0m - [91merror[0m[90m TS2339: [0mProperty 'country' does not exist on type 'PrismaService'.
23:53:20.638 
23:53:20.638 [7m11[0m         const countryCount = await this.prisma.country.count();
23:53:20.638 [7m  [0m [91m                                               ~~~~~~~[0m
23:53:20.638 [96msrc/core/database/seeder/core/seed-locations.ts[0m:[93m19[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'country' does not exist on type 'PrismaService'.
23:53:20.638 
23:53:20.638 [7m19[0m                 await this.prisma.country.create({
23:53:20.638 [7m  [0m [91m                                  ~~~~~~~[0m
23:53:20.638 [96msrc/core/database/seeder/core/seed-locations.ts[0m:[93m36[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'province' does not exist on type 'PrismaService'.
23:53:20.638 
23:53:20.638 [7m36[0m                 await this.prisma.province.create({
23:53:20.638 [7m  [0m [91m                                  ~~~~~~~~[0m
23:53:20.638 [96msrc/core/database/seeder/core/seed-locations.ts[0m:[93m63[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'ward' does not exist on type 'PrismaService'.
23:53:20.638 
23:53:20.638 [7m63[0m                 await this.prisma.ward.createMany({ data: batch });
23:53:20.638 [7m  [0m [91m                                  ~~~~[0m
23:53:20.638 [96msrc/core/database/seeder/core/seed-locations.ts[0m:[93m71[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'ward' does not exist on type 'PrismaService'.
23:53:20.638 
23:53:20.639 [7m71[0m         await this.prisma.ward.deleteMany({});
23:53:20.639 [7m  [0m [91m                          ~~~~[0m
23:53:20.639 [96msrc/core/database/seeder/core/seed-locations.ts[0m:[93m72[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'province' does not exist on type 'PrismaService'.
23:53:20.639 
23:53:20.639 [7m72[0m         await this.prisma.province.deleteMany({});
23:53:20.639 [7m  [0m [91m                          ~~~~~~~~[0m
23:53:20.639 [96msrc/core/database/seeder/core/seed-locations.ts[0m:[93m73[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'country' does not exist on type 'PrismaService'.
23:53:20.639 
23:53:20.639 [7m73[0m         await this.prisma.country.deleteMany({});
23:53:20.639 [7m  [0m [91m                          ~~~~~~~[0m
23:53:20.639 [96msrc/core/database/seeder/core/seed-menus.ts[0m:[93m12[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'menuPermission' does not exist on type 'PrismaService'.
23:53:20.639 
23:53:20.639 [7m12[0m     await this.prisma.menuPermission.deleteMany({});
23:53:20.639 [7m  [0m [91m                      ~~~~~~~~~~~~~~[0m
23:53:20.639 [96msrc/core/database/seeder/core/seed-menus.ts[0m:[93m13[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'menu' does not exist on type 'PrismaService'.
23:53:20.639 
23:53:20.639 [7m13[0m     await this.prisma.menu.deleteMany({});
23:53:20.640 [7m  [0m [91m                      ~~~~[0m
23:53:20.640 [96msrc/core/database/seeder/core/seed-menus.ts[0m:[93m15[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.640 
23:53:20.640 [7m15[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.640 [7m  [0m [91m                                        ~~~~[0m
23:53:20.640 [96msrc/core/database/seeder/core/seed-menus.ts[0m:[93m18[0m:[93m43[0m - [91merror[0m[90m TS2339: [0mProperty 'permission' does not exist on type 'PrismaService'.
23:53:20.640 
23:53:20.641 [7m18[0m     const permissions = await this.prisma.permission.findMany();
23:53:20.641 [7m  [0m [91m                                          ~~~~~~~~~~[0m
23:53:20.641 [96msrc/core/database/seeder/core/seed-menus.ts[0m:[93m20[0m:[93m25[0m - [91merror[0m[90m TS7006: [0mParameter 'perm' implicitly has an 'any' type.
23:53:20.641 
23:53:20.641 [7m20[0m     permissions.forEach(perm => permMap.set(perm.code, perm));
23:53:20.641 [7m  [0m [91m                        ~~~~[0m
23:53:20.641 [96msrc/core/database/seeder/core/seed-menus.ts[0m:[93m31[0m:[93m78[0m - [91merror[0m[90m TS2339: [0mProperty 'menu' does not exist on type 'PrismaService'.
23:53:20.642 
23:53:20.642 [7m31[0m         parent = createdMenus.get(menuItem.parent_code) || await this.prisma.menu.findFirst({ where: { code: menuItem.parent_code } });
23:53:20.642 [7m  [0m [91m                                                                             ~~~~[0m
23:53:20.642 [96msrc/core/database/seeder/core/seed-menus.ts[0m:[93m39[0m:[93m39[0m - [91merror[0m[90m TS2339: [0mProperty 'menu' does not exist on type 'PrismaService'.
23:53:20.642 
23:53:20.642 [7m39[0m       const saved = await this.prisma.menu.create({
23:53:20.643 [7m  [0m [91m                                      ~~~~[0m
23:53:20.643 [96msrc/core/database/seeder/core/seed-menus.ts[0m:[93m63[0m:[93m31[0m - [91merror[0m[90m TS2339: [0mProperty 'menuPermission' does not exist on type 'PrismaService'.
23:53:20.643 
23:53:20.643 [7m63[0m             await this.prisma.menuPermission.create({
23:53:20.643 [7m  [0m [91m                              ~~~~~~~~~~~~~~[0m
23:53:20.643 [96msrc/core/database/seeder/core/seed-menus.ts[0m:[93m101[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'menuPermission' does not exist on type 'PrismaService'.
23:53:20.644 
23:53:20.644 [7m101[0m     await this.prisma.menuPermission.deleteMany({});
23:53:20.644 [7m   [0m [91m                      ~~~~~~~~~~~~~~[0m
23:53:20.644 [96msrc/core/database/seeder/core/seed-menus.ts[0m:[93m102[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'menu' does not exist on type 'PrismaService'.
23:53:20.644 
23:53:20.644 [7m102[0m     await this.prisma.menu.deleteMany({});
23:53:20.644 [7m   [0m [91m                      ~~~~[0m
23:53:20.645 [96msrc/core/database/seeder/core/seed-permissions.ts[0m:[93m11[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.645 
23:53:20.645 [7m11[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.645 [7m  [0m [91m                                        ~~~~[0m
23:53:20.645 [96msrc/core/database/seeder/core/seed-permissions.ts[0m:[93m25[0m:[93m48[0m - [91merror[0m[90m TS2339: [0mProperty 'permission' does not exist on type 'PrismaService'.
23:53:20.645 
23:53:20.645 [7m25[0m           parentPermission = await this.prisma.permission.findFirst({ where: { code: permData.parent_code } });
23:53:20.645 [7m  [0m [91m                                               ~~~~~~~~~~[0m
23:53:20.646 [96msrc/core/database/seeder/core/seed-permissions.ts[0m:[93m31[0m:[93m39[0m - [91merror[0m[90m TS2339: [0mProperty 'permission' does not exist on type 'PrismaService'.
23:53:20.646 
23:53:20.646 [7m31[0m       const saved = await this.prisma.permission.upsert({
23:53:20.646 [7m  [0m [91m                                      ~~~~~~~~~~[0m
23:53:20.646 [96msrc/core/database/seeder/core/seed-permissions.ts[0m:[93m82[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'permission' does not exist on type 'PrismaService'.
23:53:20.646 
23:53:20.646 [7m82[0m     await this.prisma.permission.deleteMany({});
23:53:20.647 [7m  [0m [91m                      ~~~~~~~~~~[0m
23:53:20.647 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m14[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.647 
23:53:20.647 [7m14[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.647 [7m  [0m [91m                                        ~~~~[0m
23:53:20.647 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m20[0m:[93m38[0m - [91merror[0m[90m TS2339: [0mProperty 'role' does not exist on type 'PrismaService'.
23:53:20.647 
23:53:20.647 [7m20[0m       const role = await this.prisma.role.upsert({
23:53:20.647 [7m  [0m [91m                                     ~~~~[0m
23:53:20.647 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m41[0m:[93m46[0m - [91merror[0m[90m TS2339: [0mProperty 'permission' does not exist on type 'PrismaService'.
23:53:20.647 
23:53:20.647 [7m41[0m     const allPermissions = await this.prisma.permission.findMany({ where: { status: 'active' } });
23:53:20.647 [7m  [0m [91m                                             ~~~~~~~~~~[0m
23:53:20.648 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m72[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'roleHasPermission' does not exist on type 'PrismaService'.
23:53:20.648 
23:53:20.648 [7m72[0m         await this.prisma.roleHasPermission.deleteMany({ where: { role_id: role.id } });
23:53:20.648 [7m  [0m [91m                          ~~~~~~~~~~~~~~~~~[0m
23:53:20.648 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m73[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'roleHasPermission' does not exist on type 'PrismaService'.
23:53:20.648 
23:53:20.648 [7m73[0m         await this.prisma.roleHasPermission.createMany({
23:53:20.648 [7m  [0m [91m                          ~~~~~~~~~~~~~~~~~[0m
23:53:20.648 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m74[0m:[93m27[0m - [91merror[0m[90m TS7006: [0mParameter 'perm' implicitly has an 'any' type.
23:53:20.648 
23:53:20.648 [7m74[0m           data: perms.map(perm => ({ role_id: role.id, permission_id: perm.id })),
23:53:20.648 [7m  [0m [91m                          ~~~~[0m
23:53:20.648 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m81[0m:[93m45[0m - [91merror[0m[90m TS2339: [0mProperty 'context' does not exist on type 'PrismaService'.
23:53:20.648 
23:53:20.648 [7m81[0m     const systemContext = await this.prisma.context.findFirst({ where: { code: 'system' } });
23:53:20.648 [7m  [0m [91m                                            ~~~~~~~[0m
23:53:20.648 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m82[0m:[93m44[0m - [91merror[0m[90m TS2339: [0mProperty 'context' does not exist on type 'PrismaService'.
23:53:20.648 
23:53:20.648 [7m82[0m     const groupContext = await this.prisma.context.findFirst({ where: { code: 'group' } });
23:53:20.648 [7m  [0m [91m                                           ~~~~~~~[0m
23:53:20.648 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m96[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'roleContext' does not exist on type 'PrismaService'.
23:53:20.648 
23:53:20.649 [7m96[0m         await this.prisma.roleContext.deleteMany({
23:53:20.649 [7m  [0m [91m                          ~~~~~~~~~~~[0m
23:53:20.649 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m100[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'roleContext' does not exist on type 'PrismaService'.
23:53:20.649 
23:53:20.650 [7m100[0m         await this.prisma.roleContext.upsert({
23:53:20.651 [7m   [0m [91m                          ~~~~~~~~~~~[0m
23:53:20.651 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m118[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'roleHasPermission' does not exist on type 'PrismaService'.
23:53:20.651 
23:53:20.651 [7m118[0m     await this.prisma.roleHasPermission.deleteMany({});
23:53:20.651 [7m   [0m [91m                      ~~~~~~~~~~~~~~~~~[0m
23:53:20.651 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m119[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'roleContext' does not exist on type 'PrismaService'.
23:53:20.652 
23:53:20.652 [7m119[0m     await this.prisma.roleContext.deleteMany({});
23:53:20.652 [7m   [0m [91m                      ~~~~~~~~~~~[0m
23:53:20.652 [96msrc/core/database/seeder/core/seed-roles.ts[0m:[93m120[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'role' does not exist on type 'PrismaService'.
23:53:20.652 
23:53:20.652 [7m120[0m     await this.prisma.role.deleteMany({});
23:53:20.652 [7m   [0m [91m                      ~~~~[0m
23:53:20.653 [96msrc/core/database/seeder/core/seed-users.ts[0m:[93m20[0m:[93m36[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.653 
23:53:20.653 [7m20[0m       let user = await this.prisma.user.findFirst({ where: { email: userData.email } });
23:53:20.653 [7m  [0m [91m                                   ~~~~[0m
23:53:20.653 [96msrc/core/database/seeder/core/seed-users.ts[0m:[93m22[0m:[93m34[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.653 
23:53:20.653 [7m22[0m         user = await this.prisma.user.create({
23:53:20.653 [7m  [0m [91m                                 ~~~~[0m
23:53:20.654 [96msrc/core/database/seeder/core/seed-users.ts[0m:[93m32[0m:[93m34[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.654 
23:53:20.654 [7m32[0m         user = await this.prisma.user.update({
23:53:20.654 [7m  [0m [91m                                 ~~~~[0m
23:53:20.654 [96msrc/core/database/seeder/core/seed-users.ts[0m:[93m43[0m:[93m43[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.654 
23:53:20.654 [7m43[0m     const systemAdmin = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.654 [7m  [0m [91m                                          ~~~~[0m
23:53:20.654 [96msrc/core/database/seeder/core/seed-users.ts[0m:[93m45[0m:[93m45[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.654 
23:53:20.654 [7m45[0m       const systemGroup = await this.prisma.group.findFirst({ where: { code: 'system' } });
23:53:20.654 [7m  [0m [91m                                            ~~~~~[0m
23:53:20.654 [96msrc/core/database/seeder/core/seed-users.ts[0m:[93m47[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.654 
23:53:20.654 [7m47[0m         await this.prisma.group.update({
23:53:20.654 [7m  [0m [91m                          ~~~~~[0m
23:53:20.654 [96msrc/core/database/seeder/core/seed-users.ts[0m:[93m57[0m:[93m19[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.654 
23:53:20.654 [7m57[0m       this.prisma.group.findFirst({ where: { code: groupCode } }),
23:53:20.654 [7m  [0m [91m                  ~~~~~[0m
23:53:20.654 [96msrc/core/database/seeder/core/seed-users.ts[0m:[93m58[0m:[93m19[0m - [91merror[0m[90m TS2339: [0mProperty 'role' does not exist on type 'PrismaService'.
23:53:20.654 
23:53:20.654 [7m58[0m       this.prisma.role.findFirst({ where: { code: roleCode } }),
23:53:20.655 [7m  [0m [91m                  ~~~~[0m
23:53:20.655 [96msrc/core/database/seeder/core/seed-users.ts[0m:[93m62[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'userGroup' does not exist on type 'PrismaService'.
23:53:20.655 
23:53:20.655 [7m62[0m     await this.prisma.userGroup.upsert({
23:53:20.655 [7m  [0m [91m                      ~~~~~~~~~[0m
23:53:20.655 [96msrc/core/database/seeder/core/seed-users.ts[0m:[93m68[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'userRoleAssignment' does not exist on type 'PrismaService'.
23:53:20.655 
23:53:20.655 [7m68[0m     await this.prisma.userRoleAssignment.upsert({
23:53:20.655 [7m  [0m [91m                      ~~~~~~~~~~~~~~~~~~[0m
23:53:20.655 [96msrc/core/database/seeder/core/seed-users.ts[0m:[93m76[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.655 
23:53:20.655 [7m76[0m     await this.prisma.user.deleteMany({});
23:53:20.655 [7m  [0m [91m                      ~~~~[0m
23:53:20.655 [96msrc/core/database/seeder/introduction/seed-about-sections.ts[0m:[93m12[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'aboutSection' does not exist on type 'PrismaService'.
23:53:20.655 
23:53:20.655 [7m12[0m     if (await this.prisma.aboutSection.count() > 0) return;
23:53:20.655 [7m  [0m [91m                          ~~~~~~~~~~~~[0m
23:53:20.655 [96msrc/core/database/seeder/introduction/seed-about-sections.ts[0m:[93m17[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.655 
23:53:20.655 [7m17[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.655 [7m  [0m [91m                                        ~~~~[0m
23:53:20.655 [96msrc/core/database/seeder/introduction/seed-about-sections.ts[0m:[93m21[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'aboutSection' does not exist on type 'PrismaService'.
23:53:20.655 
23:53:20.655 [7m21[0m       await this.prisma.aboutSection.create({
23:53:20.656 [7m  [0m [91m                        ~~~~~~~~~~~~[0m
23:53:20.656 [96msrc/core/database/seeder/introduction/seed-about-sections.ts[0m:[93m33[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'aboutSection' does not exist on type 'PrismaService'.
23:53:20.656 
23:53:20.656 [7m33[0m     await this.prisma.aboutSection.deleteMany({});
23:53:20.656 [7m  [0m [91m                      ~~~~~~~~~~~~[0m
23:53:20.656 [96msrc/core/database/seeder/introduction/seed-certificates.ts[0m:[93m11[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'certificate' does not exist on type 'PrismaService'.
23:53:20.656 
23:53:20.656 [7m11[0m     if (await this.prisma.certificate.count() > 0) return;
23:53:20.656 [7m  [0m [91m                          ~~~~~~~~~~~[0m
23:53:20.656 [96msrc/core/database/seeder/introduction/seed-certificates.ts[0m:[93m16[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.656 
23:53:20.656 [7m16[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.656 [7m  [0m [91m                                        ~~~~[0m
23:53:20.656 [96msrc/core/database/seeder/introduction/seed-certificates.ts[0m:[93m20[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'certificate' does not exist on type 'PrismaService'.
23:53:20.656 
23:53:20.657 [7m20[0m       await this.prisma.certificate.create({
23:53:20.657 [7m  [0m [91m                        ~~~~~~~~~~~[0m
23:53:20.657 [96msrc/core/database/seeder/introduction/seed-certificates.ts[0m:[93m33[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'certificate' does not exist on type 'PrismaService'.
23:53:20.657 
23:53:20.657 [7m33[0m     await this.prisma.certificate.deleteMany({});
23:53:20.657 [7m  [0m [91m                      ~~~~~~~~~~~[0m
23:53:20.657 [96msrc/core/database/seeder/introduction/seed-gallery.ts[0m:[93m12[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'gallery' does not exist on type 'PrismaService'.
23:53:20.658 
23:53:20.658 [7m12[0m     if (await this.prisma.gallery.count() > 0) return;
23:53:20.658 [7m  [0m [91m                          ~~~~~~~[0m
23:53:20.658 [96msrc/core/database/seeder/introduction/seed-gallery.ts[0m:[93m17[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.658 
23:53:20.658 [7m17[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.658 [7m  [0m [91m                                        ~~~~[0m
23:53:20.658 [96msrc/core/database/seeder/introduction/seed-gallery.ts[0m:[93m21[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'gallery' does not exist on type 'PrismaService'.
23:53:20.659 
23:53:20.659 [7m21[0m       await this.prisma.gallery.create({
23:53:20.659 [7m  [0m [91m                        ~~~~~~~[0m
23:53:20.659 [96msrc/core/database/seeder/introduction/seed-gallery.ts[0m:[93m34[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'gallery' does not exist on type 'PrismaService'.
23:53:20.659 
23:53:20.659 [7m34[0m     await this.prisma.gallery.deleteMany({});
23:53:20.660 [7m  [0m [91m                      ~~~~~~~[0m
23:53:20.660 [96msrc/core/database/seeder/introduction/seed-partners.ts[0m:[93m11[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'partner' does not exist on type 'PrismaService'.
23:53:20.660 
23:53:20.660 [7m11[0m     if (await this.prisma.partner.count() > 0) return;
23:53:20.660 [7m  [0m [91m                          ~~~~~~~[0m
23:53:20.660 [96msrc/core/database/seeder/introduction/seed-partners.ts[0m:[93m16[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.660 
23:53:20.661 [7m16[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.661 [7m  [0m [91m                                        ~~~~[0m
23:53:20.661 [96msrc/core/database/seeder/introduction/seed-partners.ts[0m:[93m20[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'partner' does not exist on type 'PrismaService'.
23:53:20.661 
23:53:20.661 [7m20[0m       await this.prisma.partner.create({
23:53:20.661 [7m  [0m [91m                        ~~~~~~~[0m
23:53:20.662 [96msrc/core/database/seeder/introduction/seed-partners.ts[0m:[93m31[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'partner' does not exist on type 'PrismaService'.
23:53:20.662 
23:53:20.662 [7m31[0m     await this.prisma.partner.deleteMany({});
23:53:20.662 [7m  [0m [91m                      ~~~~~~~[0m
23:53:20.662 [96msrc/core/database/seeder/introduction/seed-projects.ts[0m:[93m12[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'project' does not exist on type 'PrismaService'.
23:53:20.662 
23:53:20.662 [7m12[0m     if (await this.prisma.project.count() > 0) return;
23:53:20.663 [7m  [0m [91m                          ~~~~~~~[0m
23:53:20.663 [96msrc/core/database/seeder/introduction/seed-projects.ts[0m:[93m17[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.663 
23:53:20.663 [7m17[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.663 [7m  [0m [91m                                        ~~~~[0m
23:53:20.663 [96msrc/core/database/seeder/introduction/seed-projects.ts[0m:[93m21[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'project' does not exist on type 'PrismaService'.
23:53:20.663 
23:53:20.664 [7m21[0m       await this.prisma.project.create({
23:53:20.664 [7m  [0m [91m                        ~~~~~~~[0m
23:53:20.664 [96msrc/core/database/seeder/introduction/seed-projects.ts[0m:[93m36[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'project' does not exist on type 'PrismaService'.
23:53:20.664 
23:53:20.664 [7m36[0m     await this.prisma.project.deleteMany({});
23:53:20.664 [7m  [0m [91m                      ~~~~~~~[0m
23:53:20.664 [96msrc/core/database/seeder/introduction/seed-staff.ts[0m:[93m11[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'staff' does not exist on type 'PrismaService'.
23:53:20.665 
23:53:20.665 [7m11[0m     if (await this.prisma.staff.count() > 0) return;
23:53:20.665 [7m  [0m [91m                          ~~~~~[0m
23:53:20.665 [96msrc/core/database/seeder/introduction/seed-staff.ts[0m:[93m16[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.665 
23:53:20.665 [7m16[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.665 [7m  [0m [91m                                        ~~~~[0m
23:53:20.666 [96msrc/core/database/seeder/introduction/seed-staff.ts[0m:[93m20[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'staff' does not exist on type 'PrismaService'.
23:53:20.666 
23:53:20.666 [7m20[0m       await this.prisma.staff.create({
23:53:20.666 [7m  [0m [91m                        ~~~~~[0m
23:53:20.667 [96msrc/core/database/seeder/introduction/seed-staff.ts[0m:[93m32[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'staff' does not exist on type 'PrismaService'.
23:53:20.667 
23:53:20.667 [7m32[0m     await this.prisma.staff.deleteMany({});
23:53:20.667 [7m  [0m [91m                      ~~~~~[0m
23:53:20.667 [96msrc/core/database/seeder/introduction/seed-testimonials.ts[0m:[93m11[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'testimonial' does not exist on type 'PrismaService'.
23:53:20.667 
23:53:20.667 [7m11[0m     if (await this.prisma.testimonial.count() > 0) return;
23:53:20.667 [7m  [0m [91m                          ~~~~~~~~~~~[0m
23:53:20.667 [96msrc/core/database/seeder/introduction/seed-testimonials.ts[0m:[93m16[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.667 
23:53:20.667 [7m16[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.668 [7m  [0m [91m                                        ~~~~[0m
23:53:20.668 [96msrc/core/database/seeder/introduction/seed-testimonials.ts[0m:[93m19[0m:[93m40[0m - [91merror[0m[90m TS2339: [0mProperty 'project' does not exist on type 'PrismaService'.
23:53:20.668 
23:53:20.668 [7m19[0m     const projects = await this.prisma.project.findMany({ take: 10, orderBy: { sort_order: 'asc' } });
23:53:20.668 [7m  [0m [91m                                       ~~~~~~~[0m
23:53:20.668 [96msrc/core/database/seeder/introduction/seed-testimonials.ts[0m:[93m24[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'testimonial' does not exist on type 'PrismaService'.
23:53:20.668 
23:53:20.668 [7m24[0m       await this.prisma.testimonial.create({
23:53:20.668 [7m  [0m [91m                        ~~~~~~~~~~~[0m
23:53:20.668 [96msrc/core/database/seeder/introduction/seed-testimonials.ts[0m:[93m36[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'testimonial' does not exist on type 'PrismaService'.
23:53:20.668 
23:53:20.669 [7m36[0m     await this.prisma.testimonial.deleteMany({});
23:53:20.669 [7m  [0m [91m                      ~~~~~~~~~~~[0m
23:53:20.669 [96msrc/core/database/seeder/marketing/seed-banner-locations.ts[0m:[93m15[0m:[93m31[0m - [91merror[0m[90m TS2339: [0mProperty 'bannerLocation' does not exist on type 'PrismaService'.
23:53:20.669 
23:53:20.669 [7m15[0m             await this.prisma.bannerLocation.upsert({
23:53:20.669 [7m  [0m [91m                              ~~~~~~~~~~~~~~[0m
23:53:20.669 [96msrc/core/database/seeder/marketing/seed-banner-locations.ts[0m:[93m24[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'bannerLocation' does not exist on type 'PrismaService'.
23:53:20.669 
23:53:20.669 [7m24[0m         await this.prisma.bannerLocation.deleteMany({});
23:53:20.670 [7m  [0m [91m                          ~~~~~~~~~~~~~~[0m
23:53:20.670 [96msrc/core/database/seeder/marketing/seed-banners.ts[0m:[93m15[0m:[93m48[0m - [91merror[0m[90m TS2339: [0mProperty 'bannerLocation' does not exist on type 'PrismaService'.
23:53:20.670 
23:53:20.670 [7m15[0m             const location = await this.prisma.bannerLocation.findUnique({
23:53:20.670 [7m  [0m [91m                                               ~~~~~~~~~~~~~~[0m
23:53:20.670 [96msrc/core/database/seeder/marketing/seed-banners.ts[0m:[93m20[0m:[93m54[0m - [91merror[0m[90m TS2339: [0mProperty 'banner' does not exist on type 'PrismaService'.
23:53:20.670 
23:53:20.670 [7m20[0m             const existingBanner = await this.prisma.banner.findFirst({
23:53:20.670 [7m  [0m [91m                                                     ~~~~~~[0m
23:53:20.671 [96msrc/core/database/seeder/marketing/seed-banners.ts[0m:[93m26[0m:[93m31[0m - [91merror[0m[90m TS2339: [0mProperty 'banner' does not exist on type 'PrismaService'.
23:53:20.671 
23:53:20.671 [7m26[0m             await this.prisma.banner.create({
23:53:20.671 [7m  [0m [91m                              ~~~~~~[0m
23:53:20.671 [96msrc/core/database/seeder/marketing/seed-banners.ts[0m:[93m36[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'banner' does not exist on type 'PrismaService'.
23:53:20.671 
23:53:20.671 [7m36[0m         await this.prisma.banner.deleteMany({});
23:53:20.671 [7m  [0m [91m                          ~~~~~~[0m
23:53:20.671 [96msrc/core/database/seeder/marketing/seed-contacts.ts[0m:[93m11[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'contact' does not exist on type 'PrismaService'.
23:53:20.671 
23:53:20.671 [7m11[0m     if (await this.prisma.contact.count() > 0) return;
23:53:20.671 [7m  [0m [91m                          ~~~~~~~[0m
23:53:20.671 [96msrc/core/database/seeder/marketing/seed-contacts.ts[0m:[93m16[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.672 
23:53:20.672 [7m16[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.672 [7m  [0m [91m                                        ~~~~[0m
23:53:20.672 [96msrc/core/database/seeder/marketing/seed-contacts.ts[0m:[93m20[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'contact' does not exist on type 'PrismaService'.
23:53:20.672 
23:53:20.672 [7m20[0m       await this.prisma.contact.create({
23:53:20.672 [7m  [0m [91m                        ~~~~~~~[0m
23:53:20.672 [96msrc/core/database/seeder/marketing/seed-contacts.ts[0m:[93m31[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'contact' does not exist on type 'PrismaService'.
23:53:20.672 
23:53:20.672 [7m31[0m     await this.prisma.contact.deleteMany({});
23:53:20.672 [7m  [0m [91m                      ~~~~~~~[0m
23:53:20.672 [96msrc/core/database/seeder/marketing/seed-faqs.ts[0m:[93m11[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'faq' does not exist on type 'PrismaService'.
23:53:20.672 
23:53:20.672 [7m11[0m     if (await this.prisma.faq.count() > 0) return;
23:53:20.672 [7m  [0m [91m                          ~~~[0m
23:53:20.672 [96msrc/core/database/seeder/marketing/seed-faqs.ts[0m:[93m16[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.672 
23:53:20.672 [7m16[0m     const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.672 [7m  [0m [91m                                        ~~~~[0m
23:53:20.672 [96msrc/core/database/seeder/marketing/seed-faqs.ts[0m:[93m20[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'faq' does not exist on type 'PrismaService'.
23:53:20.672 
23:53:20.672 [7m20[0m       await this.prisma.faq.create({
23:53:20.672 [7m  [0m [91m                        ~~~[0m
23:53:20.672 [96msrc/core/database/seeder/marketing/seed-faqs.ts[0m:[93m31[0m:[93m23[0m - [91merror[0m[90m TS2339: [0mProperty 'faq' does not exist on type 'PrismaService'.
23:53:20.672 
23:53:20.672 [7m31[0m     await this.prisma.faq.deleteMany({});
23:53:20.673 [7m  [0m [91m                      ~~~[0m
23:53:20.673 [96msrc/core/database/seeder/post/seed-posts.ts[0m:[93m15[0m:[93m49[0m - [91merror[0m[90m TS2339: [0mProperty 'post' does not exist on type 'PrismaService'.
23:53:20.673 
23:53:20.673 [7m15[0m         const existingCount = await this.prisma.post.count();
23:53:20.673 [7m  [0m [91m                                                ~~~~[0m
23:53:20.673 [96msrc/core/database/seeder/post/seed-posts.ts[0m:[93m21[0m:[93m45[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.673 
23:53:20.673 [7m21[0m         const adminUser = await this.prisma.user.findFirst({ where: { username: 'systemadmin' } });
23:53:20.673 [7m  [0m [91m                                            ~~~~[0m
23:53:20.673 [96msrc/core/database/seeder/post/seed-posts.ts[0m:[93m28[0m:[93m45[0m - [91merror[0m[90m TS2339: [0mProperty 'postCategory' does not exist on type 'PrismaService'.
23:53:20.673 
23:53:20.673 [7m28[0m             const saved = await this.prisma.postCategory.create({
23:53:20.673 [7m  [0m [91m                                            ~~~~~~~~~~~~[0m
23:53:20.673 [96msrc/core/database/seeder/post/seed-posts.ts[0m:[93m44[0m:[93m45[0m - [91merror[0m[90m TS2339: [0mProperty 'postTag' does not exist on type 'PrismaService'.
23:53:20.673 
23:53:20.673 [7m44[0m             const saved = await this.prisma.postTag.create({
23:53:20.673 [7m  [0m [91m                                            ~~~~~~~[0m
23:53:20.673 [96msrc/core/database/seeder/post/seed-posts.ts[0m:[93m65[0m:[93m47[0m - [91merror[0m[90m TS2339: [0mProperty 'post' does not exist on type 'PrismaService'.
23:53:20.673 
23:53:20.673 [7m65[0m             const created = await this.prisma.post.create({
23:53:20.673 [7m  [0m [91m                                              ~~~~[0m
23:53:20.673 [96msrc/core/database/seeder/post/seed-posts.ts[0m:[93m112[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'postPosttag' does not exist on type 'PrismaService'.
23:53:20.673 
23:53:20.673 [7m112[0m         await this.prisma.postPosttag.deleteMany({});
23:53:20.673 [7m   [0m [91m                          ~~~~~~~~~~~[0m
23:53:20.674 [96msrc/core/database/seeder/post/seed-posts.ts[0m:[93m113[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'postPostcategory' does not exist on type 'PrismaService'.
23:53:20.674 
23:53:20.674 [7m113[0m         await this.prisma.postPostcategory.deleteMany({});
23:53:20.674 [7m   [0m [91m                          ~~~~~~~~~~~~~~~~[0m
23:53:20.674 [96msrc/core/database/seeder/post/seed-posts.ts[0m:[93m114[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'post' does not exist on type 'PrismaService'.
23:53:20.674 
23:53:20.674 [7m114[0m         await this.prisma.post.deleteMany({});
23:53:20.674 [7m   [0m [91m                          ~~~~[0m
23:53:20.674 [96msrc/core/database/seeder/post/seed-posts.ts[0m:[93m115[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'postTag' does not exist on type 'PrismaService'.
23:53:20.674 
23:53:20.674 [7m115[0m         await this.prisma.postTag.deleteMany({});
23:53:20.674 [7m   [0m [91m                          ~~~~~~~[0m
23:53:20.674 [96msrc/core/database/seeder/post/seed-posts.ts[0m:[93m116[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'postCategory' does not exist on type 'PrismaService'.
23:53:20.674 
23:53:20.674 [7m116[0m         await this.prisma.postCategory.deleteMany({});
23:53:20.674 [7m   [0m [91m                          ~~~~~~~~~~~~[0m
23:53:20.674 [96msrc/core/database/seeder/seed-data.ts[0m:[93m103[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'userRoleAssignment' does not exist on type 'PrismaService'.
23:53:20.674 
23:53:20.674 [7m103[0m       await this.prisma.userRoleAssignment.deleteMany({});
23:53:20.674 [7m   [0m [91m                        ~~~~~~~~~~~~~~~~~~[0m
23:53:20.674 [96msrc/core/database/seeder/seed-data.ts[0m:[93m104[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'userGroup' does not exist on type 'PrismaService'.
23:53:20.674 
23:53:20.674 [7m104[0m       await this.prisma.userGroup.deleteMany({});
23:53:20.674 [7m   [0m [91m                        ~~~~~~~~~[0m
23:53:20.674 [96msrc/core/database/seeder/seed-data.ts[0m:[93m105[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'roleHasPermission' does not exist on type 'PrismaService'.
23:53:20.675 
23:53:20.675 [7m105[0m       await this.prisma.roleHasPermission.deleteMany({});
23:53:20.675 [7m   [0m [91m                        ~~~~~~~~~~~~~~~~~[0m
23:53:20.675 [96msrc/core/database/seeder/seed-data.ts[0m:[93m106[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'roleContext' does not exist on type 'PrismaService'.
23:53:20.675 
23:53:20.675 [7m106[0m       await this.prisma.roleContext.deleteMany({});
23:53:20.675 [7m   [0m [91m                        ~~~~~~~~~~~[0m
23:53:20.675 [96msrc/core/database/seeder/seed-data.ts[0m:[93m107[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'menuPermission' does not exist on type 'PrismaService'.
23:53:20.675 
23:53:20.675 [7m107[0m       await this.prisma.menuPermission.deleteMany({});
23:53:20.675 [7m   [0m [91m                        ~~~~~~~~~~~~~~[0m
23:53:20.675 [96msrc/core/database/seeder/seed-data.ts[0m:[93m108[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'bookmark' does not exist on type 'PrismaService'.
23:53:20.675 
23:53:20.675 [7m108[0m       await this.prisma.bookmark.deleteMany({});
23:53:20.675 [7m   [0m [91m                        ~~~~~~~~[0m
23:53:20.675 [96msrc/core/database/seeder/seed-data.ts[0m:[93m109[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'readingHistory' does not exist on type 'PrismaService'.
23:53:20.675 
23:53:20.675 [7m109[0m       await this.prisma.readingHistory.deleteMany({});
23:53:20.675 [7m   [0m [91m                        ~~~~~~~~~~~~~~[0m
23:53:20.675 [96msrc/core/database/seeder/seed-data.ts[0m:[93m110[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'comicFollow' does not exist on type 'PrismaService'.
23:53:20.675 
23:53:20.678 [7m110[0m       await this.prisma.comicFollow.deleteMany({});
23:53:20.678 [7m   [0m [91m                        ~~~~~~~~~~~[0m
23:53:20.678 [96msrc/core/database/seeder/seed-data.ts[0m:[93m111[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'comicView' does not exist on type 'PrismaService'.
23:53:20.678 
23:53:20.678 [7m111[0m       await this.prisma.comicView.deleteMany({});
23:53:20.678 [7m   [0m [91m                        ~~~~~~~~~[0m
23:53:20.678 [96msrc/core/database/seeder/seed-data.ts[0m:[93m112[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'comicReview' does not exist on type 'PrismaService'.
23:53:20.679 
23:53:20.679 [7m112[0m       await this.prisma.comicReview.deleteMany({});
23:53:20.679 [7m   [0m [91m                        ~~~~~~~~~~~[0m
23:53:20.679 [96msrc/core/database/seeder/seed-data.ts[0m:[93m113[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'chapterPage' does not exist on type 'PrismaService'.
23:53:20.679 
23:53:20.679 [7m113[0m       await this.prisma.chapterPage.deleteMany({});
23:53:20.679 [7m   [0m [91m                        ~~~~~~~~~~~[0m
23:53:20.679 [96msrc/core/database/seeder/seed-data.ts[0m:[93m114[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'chapter' does not exist on type 'PrismaService'.
23:53:20.679 
23:53:20.679 [7m114[0m       await this.prisma.chapter.deleteMany({});
23:53:20.679 [7m   [0m [91m                        ~~~~~~~[0m
23:53:20.679 [96msrc/core/database/seeder/seed-data.ts[0m:[93m115[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'comicStats' does not exist on type 'PrismaService'.
23:53:20.679 
23:53:20.679 [7m115[0m       await this.prisma.comicStats.deleteMany({});
23:53:20.679 [7m   [0m [91m                        ~~~~~~~~~~[0m
23:53:20.679 [96msrc/core/database/seeder/seed-data.ts[0m:[93m116[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'comicComment' does not exist on type 'PrismaService'.
23:53:20.679 
23:53:20.679 [7m116[0m       await this.prisma.comicComment.deleteMany({});
23:53:20.679 [7m   [0m [91m                        ~~~~~~~~~~~~[0m
23:53:20.680 [96msrc/core/database/seeder/seed-data.ts[0m:[93m117[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'comic' does not exist on type 'PrismaService'.
23:53:20.680 
23:53:20.680 [7m117[0m       await this.prisma.comic.deleteMany({});
23:53:20.680 [7m   [0m [91m                        ~~~~~[0m
23:53:20.680 [96msrc/core/database/seeder/seed-data.ts[0m:[93m118[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'comicCategory' does not exist on type 'PrismaService'.
23:53:20.680 
23:53:20.680 [7m118[0m       await this.prisma.comicCategory.deleteMany({});
23:53:20.680 [7m   [0m [91m                        ~~~~~~~~~~~~~[0m
23:53:20.680 [96msrc/core/database/seeder/seed-data.ts[0m:[93m119[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'banner' does not exist on type 'PrismaService'.
23:53:20.680 
23:53:20.680 [7m119[0m       await this.prisma.banner.deleteMany({});
23:53:20.680 [7m   [0m [91m                        ~~~~~~[0m
23:53:20.680 [96msrc/core/database/seeder/seed-data.ts[0m:[93m120[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'bannerLocation' does not exist on type 'PrismaService'.
23:53:20.680 
23:53:20.680 [7m120[0m       await this.prisma.bannerLocation.deleteMany({});
23:53:20.680 [7m   [0m [91m                        ~~~~~~~~~~~~~~[0m
23:53:20.680 [96msrc/core/database/seeder/seed-data.ts[0m:[93m121[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'contact' does not exist on type 'PrismaService'.
23:53:20.680 
23:53:20.680 [7m121[0m       await this.prisma.contact.deleteMany({});
23:53:20.680 [7m   [0m [91m                        ~~~~~~~[0m
23:53:20.680 [96msrc/core/database/seeder/seed-data.ts[0m:[93m122[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'menu' does not exist on type 'PrismaService'.
23:53:20.681 
23:53:20.681 [7m122[0m       await this.prisma.menu.deleteMany({});
23:53:20.681 [7m   [0m [91m                        ~~~~[0m
23:53:20.681 [96msrc/core/database/seeder/seed-data.ts[0m:[93m123[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'notification' does not exist on type 'PrismaService'.
23:53:20.681 
23:53:20.682 [7m123[0m       await this.prisma.notification.deleteMany({});
23:53:20.682 [7m   [0m [91m                        ~~~~~~~~~~~~[0m
23:53:20.682 [96msrc/core/database/seeder/seed-data.ts[0m:[93m124[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.682 
23:53:20.682 [7m124[0m       await this.prisma.group.deleteMany({});
23:53:20.682 [7m   [0m [91m                        ~~~~~[0m
23:53:20.682 [96msrc/core/database/seeder/seed-data.ts[0m:[93m125[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'context' does not exist on type 'PrismaService'.
23:53:20.682 
23:53:20.682 [7m125[0m       await this.prisma.context.deleteMany({});
23:53:20.682 [7m   [0m [91m                        ~~~~~~~[0m
23:53:20.683 [96msrc/core/database/seeder/seed-data.ts[0m:[93m126[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.683 
23:53:20.683 [7m126[0m       await this.prisma.user.deleteMany({});
23:53:20.683 [7m   [0m [91m                        ~~~~[0m
23:53:20.683 [96msrc/core/database/seeder/seed-data.ts[0m:[93m127[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'role' does not exist on type 'PrismaService'.
23:53:20.683 
23:53:20.683 [7m127[0m       await this.prisma.role.deleteMany({});
23:53:20.683 [7m   [0m [91m                        ~~~~[0m
23:53:20.683 [96msrc/core/database/seeder/seed-data.ts[0m:[93m128[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'permission' does not exist on type 'PrismaService'.
23:53:20.683 
23:53:20.683 [7m128[0m       await this.prisma.permission.deleteMany({});
23:53:20.683 [7m   [0m [91m                        ~~~~~~~~~~[0m
23:53:20.683 [96msrc/core/database/seeder/seed-data.ts[0m:[93m129[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'emailConfig' does not exist on type 'PrismaService'.
23:53:20.683 
23:53:20.683 [7m129[0m       await this.prisma.emailConfig.deleteMany({});
23:53:20.683 [7m   [0m [91m                        ~~~~~~~~~~~[0m
23:53:20.683 [96msrc/core/database/seeder/seed-data.ts[0m:[93m130[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'generalConfig' does not exist on type 'PrismaService'.
23:53:20.683 
23:53:20.683 [7m130[0m       await this.prisma.generalConfig.deleteMany({});
23:53:20.683 [7m   [0m [91m                        ~~~~~~~~~~~~~[0m
23:53:20.683 [96msrc/core/database/seeder/seed-data.ts[0m:[93m131[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'contentTemplate' does not exist on type 'PrismaService'.
23:53:20.683 
23:53:20.684 [7m131[0m       await this.prisma.contentTemplate.deleteMany({});
23:53:20.684 [7m   [0m [91m                        ~~~~~~~~~~~~~~~[0m
23:53:20.684 [96msrc/core/database/seeder/seed-data.ts[0m:[93m132[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'testimonial' does not exist on type 'PrismaService'.
23:53:20.684 
23:53:20.684 [7m132[0m       await this.prisma.testimonial.deleteMany({});
23:53:20.685 [7m   [0m [91m                        ~~~~~~~~~~~[0m
23:53:20.685 [96msrc/core/database/seeder/seed-data.ts[0m:[93m133[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'project' does not exist on type 'PrismaService'.
23:53:20.685 
23:53:20.685 [7m133[0m       await this.prisma.project.deleteMany({});
23:53:20.685 [7m   [0m [91m                        ~~~~~~~[0m
23:53:20.685 [96msrc/core/database/seeder/seed-data.ts[0m:[93m134[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'gallery' does not exist on type 'PrismaService'.
23:53:20.685 
23:53:20.685 [7m134[0m       await this.prisma.gallery.deleteMany({});
23:53:20.685 [7m   [0m [91m                        ~~~~~~~[0m
23:53:20.685 [96msrc/core/database/seeder/seed-data.ts[0m:[93m135[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'certificate' does not exist on type 'PrismaService'.
23:53:20.685 
23:53:20.685 [7m135[0m       await this.prisma.certificate.deleteMany({});
23:53:20.686 [7m   [0m [91m                        ~~~~~~~~~~~[0m
23:53:20.686 [96msrc/core/database/seeder/seed-data.ts[0m:[93m136[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'faq' does not exist on type 'PrismaService'.
23:53:20.686 
23:53:20.686 [7m136[0m       await this.prisma.faq.deleteMany({});
23:53:20.686 [7m   [0m [91m                        ~~~[0m
23:53:20.686 [96msrc/core/database/seeder/seed-data.ts[0m:[93m137[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'partner' does not exist on type 'PrismaService'.
23:53:20.686 
23:53:20.686 [7m137[0m       await this.prisma.partner.deleteMany({});
23:53:20.686 [7m   [0m [91m                        ~~~~~~~[0m
23:53:20.686 [96msrc/core/database/seeder/seed-data.ts[0m:[93m138[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'staff' does not exist on type 'PrismaService'.
23:53:20.686 
23:53:20.686 [7m138[0m       await this.prisma.staff.deleteMany({});
23:53:20.686 [7m   [0m [91m                        ~~~~~[0m
23:53:20.686 [96msrc/core/database/seeder/seed-data.ts[0m:[93m139[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'aboutSection' does not exist on type 'PrismaService'.
23:53:20.686 
23:53:20.686 [7m139[0m       await this.prisma.aboutSection.deleteMany({});
23:53:20.686 [7m   [0m [91m                        ~~~~~~~~~~~~[0m
23:53:20.686 [96msrc/core/database/seeder/seed-data.ts[0m:[93m140[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'postPosttag' does not exist on type 'PrismaService'.
23:53:20.687 
23:53:20.687 [7m140[0m       await this.prisma.postPosttag.deleteMany({});
23:53:20.687 [7m   [0m [91m                        ~~~~~~~~~~~[0m
23:53:20.687 [96msrc/core/database/seeder/seed-data.ts[0m:[93m141[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'postPostcategory' does not exist on type 'PrismaService'.
23:53:20.687 
23:53:20.688 [7m141[0m       await this.prisma.postPostcategory.deleteMany({});
23:53:20.688 [7m   [0m [91m                        ~~~~~~~~~~~~~~~~[0m
23:53:20.688 [96msrc/core/database/seeder/seed-data.ts[0m:[93m142[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'post' does not exist on type 'PrismaService'.
23:53:20.688 
23:53:20.688 [7m142[0m       await this.prisma.post.deleteMany({});
23:53:20.688 [7m   [0m [91m                        ~~~~[0m
23:53:20.689 [96msrc/core/database/seeder/seed-data.ts[0m:[93m143[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'postTag' does not exist on type 'PrismaService'.
23:53:20.689 
23:53:20.689 [7m143[0m       await this.prisma.postTag.deleteMany({});
23:53:20.689 [7m   [0m [91m                        ~~~~~~~[0m
23:53:20.689 [96msrc/core/database/seeder/seed-data.ts[0m:[93m144[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'postCategory' does not exist on type 'PrismaService'.
23:53:20.690 
23:53:20.690 [7m144[0m       await this.prisma.postCategory.deleteMany({});
23:53:20.690 [7m   [0m [91m                        ~~~~~~~~~~~~[0m
23:53:20.690 [96msrc/modules/comics/bookmark/domain/bookmark.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Bookmark'.
23:53:20.690 
23:53:20.690 [7m1[0m import { Bookmark } from '@prisma/client';
23:53:20.691 [7m [0m [91m         ~~~~~~~~[0m
23:53:20.691 [96msrc/modules/comics/bookmark/infrastructure/repositories/bookmark.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Bookmark'.
23:53:20.691 
23:53:20.691 [7m2[0m import { Bookmark, Prisma } from '@prisma/client';
23:53:20.691 [7m [0m [91m         ~~~~~~~~[0m
23:53:20.691 [96msrc/modules/comics/bookmark/infrastructure/repositories/bookmark.repository.impl.ts[0m:[93m2[0m:[93m20[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.692 
23:53:20.692 [7m2[0m import { Bookmark, Prisma } from '@prisma/client';
23:53:20.692 [7m [0m [91m                   ~~~~~~[0m
23:53:20.699 [96msrc/modules/comics/bookmark/infrastructure/repositories/bookmark.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'bookmark' does not exist on type 'PrismaService'.
23:53:20.699 
23:53:20.699 [7m16[0m         super(prisma.bookmark as any);
23:53:20.699 [7m  [0m [91m                     ~~~~~~~~[0m
23:53:20.699 [96msrc/modules/comics/bookmark/user/services/bookmarks.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Bookmark'.
23:53:20.700 
23:53:20.700 [7m2[0m import { Bookmark } from '@prisma/client';
23:53:20.700 [7m [0m [91m         ~~~~~~~~[0m
23:53:20.700 [96msrc/modules/comics/chapter/admin/services/chapter-action.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Chapter'.
23:53:20.700 
23:53:20.700 [7m2[0m import { Chapter } from '@prisma/client';
23:53:20.701 [7m [0m [91m         ~~~~~~~[0m
23:53:20.701 [96msrc/modules/comics/chapter/admin/services/chapter.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Chapter'.
23:53:20.701 
23:53:20.701 [7m2[0m import { Chapter } from '@prisma/client';
23:53:20.701 [7m [0m [91m         ~~~~~~~[0m
23:53:20.701 [96msrc/modules/comics/chapter/domain/chapter-page.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ChapterPage'.
23:53:20.701 
23:53:20.702 [7m1[0m import { ChapterPage } from '@prisma/client';
23:53:20.702 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.702 [96msrc/modules/comics/chapter/domain/chapter.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Chapter'.
23:53:20.702 
23:53:20.702 [7m1[0m import { Chapter } from '@prisma/client';
23:53:20.702 [7m [0m [91m         ~~~~~~~[0m
23:53:20.703 [96msrc/modules/comics/chapter/infrastructure/repositories/chapter-page.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ChapterPage'.
23:53:20.703 
23:53:20.703 [7m2[0m import { ChapterPage, Prisma } from '@prisma/client';
23:53:20.703 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.703 [96msrc/modules/comics/chapter/infrastructure/repositories/chapter-page.repository.impl.ts[0m:[93m2[0m:[93m23[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.703 
23:53:20.703 [7m2[0m import { ChapterPage, Prisma } from '@prisma/client';
23:53:20.703 [7m [0m [91m                      ~~~~~~[0m
23:53:20.704 [96msrc/modules/comics/chapter/infrastructure/repositories/chapter-page.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'chapterPage' does not exist on type 'PrismaService'.
23:53:20.704 
23:53:20.704 [7m16[0m         super(prisma.chapterPage as any);
23:53:20.704 [7m  [0m [91m                     ~~~~~~~~~~~[0m
23:53:20.704 [96msrc/modules/comics/chapter/infrastructure/repositories/chapter-page.repository.impl.ts[0m:[93m27[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'chapterPage' does not exist on type 'PrismaService'.
23:53:20.704 
23:53:20.704 [7m27[0m         await this.prisma.chapterPage.createMany({
23:53:20.705 [7m  [0m [91m                          ~~~~~~~~~~~[0m
23:53:20.705 [96msrc/modules/comics/chapter/infrastructure/repositories/chapter.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Chapter'.
23:53:20.705 
23:53:20.705 [7m2[0m import { Chapter, Prisma } from '@prisma/client';
23:53:20.705 [7m [0m [91m         ~~~~~~~[0m
23:53:20.705 [96msrc/modules/comics/chapter/infrastructure/repositories/chapter.repository.impl.ts[0m:[93m2[0m:[93m19[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.705 
23:53:20.706 [7m2[0m import { Chapter, Prisma } from '@prisma/client';
23:53:20.706 [7m [0m [91m                  ~~~~~~[0m
23:53:20.706 [96msrc/modules/comics/chapter/infrastructure/repositories/chapter.repository.impl.ts[0m:[93m18[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'chapter' does not exist on type 'PrismaService'.
23:53:20.706 
23:53:20.706 [7m18[0m         super(prisma.chapter as any, 'chapter_index:desc');
23:53:20.706 [7m  [0m [91m                     ~~~~~~~[0m
23:53:20.706 [96msrc/modules/comics/chapter/infrastructure/repositories/chapter.repository.impl.ts[0m:[93m50[0m:[93m28[0m - [91merror[0m[90m TS2339: [0mProperty 'chapter' does not exist on type 'PrismaService'.
23:53:20.707 
23:53:20.707 [7m50[0m         return this.prisma.chapter.findUnique({
23:53:20.707 [7m  [0m [91m                           ~~~~~~~[0m
23:53:20.707 [96msrc/modules/comics/chapter/infrastructure/repositories/chapter.repository.impl.ts[0m:[93m109[0m:[93m42[0m - [91merror[0m[90m TS2339: [0mProperty 'chapter' does not exist on type 'PrismaService'.
23:53:20.707 
23:53:20.707 [7m109[0m         const result = await this.prisma.chapter.aggregate({
23:53:20.707 [7m   [0m [91m                                         ~~~~~~~[0m
23:53:20.708 [96msrc/modules/comics/chapter/public/services/chapter.service.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Chapter'.
23:53:20.708 
23:53:20.708 [7m3[0m import { Chapter } from '@prisma/client';
23:53:20.708 [7m [0m [91m         ~~~~~~~[0m
23:53:20.708 [96msrc/modules/comics/comic-category/admin/services/comic-category.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicCategory'.
23:53:20.709 
23:53:20.709 [7m2[0m import { ComicCategory } from '@prisma/client';
23:53:20.709 [7m [0m [91m         ~~~~~~~~~~~~~[0m
23:53:20.709 [96msrc/modules/comics/comic-category/domain/comic-category.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicCategory'.
23:53:20.709 
23:53:20.709 [7m1[0m import { ComicCategory } from '@prisma/client';
23:53:20.709 [7m [0m [91m         ~~~~~~~~~~~~~[0m
23:53:20.710 [96msrc/modules/comics/comic-category/infrastructure/repositories/comic-category.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicCategory'.
23:53:20.710 
23:53:20.710 [7m2[0m import { ComicCategory, Prisma } from '@prisma/client';
23:53:20.710 [7m [0m [91m         ~~~~~~~~~~~~~[0m
23:53:20.710 [96msrc/modules/comics/comic-category/infrastructure/repositories/comic-category.repository.impl.ts[0m:[93m2[0m:[93m25[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.710 
23:53:20.710 [7m2[0m import { ComicCategory, Prisma } from '@prisma/client';
23:53:20.711 [7m [0m [91m                        ~~~~~~[0m
23:53:20.711 [96msrc/modules/comics/comic-category/infrastructure/repositories/comic-category.repository.impl.ts[0m:[93m18[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'comicCategory' does not exist on type 'PrismaService'.
23:53:20.711 
23:53:20.711 [7m18[0m         super(prisma.comicCategory as any);
23:53:20.712 [7m  [0m [91m                     ~~~~~~~~~~~~~[0m
23:53:20.713 [96msrc/modules/comics/comic-category/public/services/comic-category.service.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicCategory'.
23:53:20.713 
23:53:20.713 [7m3[0m import { ComicCategory } from '@prisma/client';
23:53:20.713 [7m [0m [91m         ~~~~~~~~~~~~~[0m
23:53:20.713 [96msrc/modules/comics/comic/admin/services/comic-action.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Comic'.
23:53:20.714 
23:53:20.714 [7m2[0m import { Comic } from '@prisma/client';
23:53:20.714 [7m [0m [91m         ~~~~~[0m
23:53:20.714 [96msrc/modules/comics/comic/admin/services/comic.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Comic'.
23:53:20.714 
23:53:20.714 [7m2[0m import { Comic } from '@prisma/client';
23:53:20.715 [7m [0m [91m         ~~~~~[0m
23:53:20.715 [96msrc/modules/comics/comic/domain/comic.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Comic'.
23:53:20.715 
23:53:20.715 [7m1[0m import { Comic } from '@prisma/client';
23:53:20.715 [7m [0m [91m         ~~~~~[0m
23:53:20.716 [96msrc/modules/comics/comic/infrastructure/repositories/comic.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Comic'.
23:53:20.716 
23:53:20.716 [7m2[0m import { Comic, Prisma } from '@prisma/client';
23:53:20.716 [7m [0m [91m         ~~~~~[0m
23:53:20.716 [96msrc/modules/comics/comic/infrastructure/repositories/comic.repository.impl.ts[0m:[93m2[0m:[93m17[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.716 
23:53:20.717 [7m2[0m import { Comic, Prisma } from '@prisma/client';
23:53:20.717 [7m [0m [91m                ~~~~~~[0m
23:53:20.717 [96msrc/modules/comics/comic/infrastructure/repositories/comic.repository.impl.ts[0m:[93m21[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'comic' does not exist on type 'PrismaService'.
23:53:20.717 
23:53:20.717 [7m21[0m         super(prisma.comic as any, 'updated_at:desc');
23:53:20.718 [7m  [0m [91m                     ~~~~~[0m
23:53:20.718 [96msrc/modules/comics/comic/infrastructure/repositories/comic.repository.impl.ts[0m:[93m133[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'comicCategoryOnComic' does not exist on type 'PrismaService'.
23:53:20.718 
23:53:20.718 [7m133[0m         await this.prisma.comicCategoryOnComic.deleteMany({
23:53:20.718 [7m   [0m [91m                          ~~~~~~~~~~~~~~~~~~~~[0m
23:53:20.719 [96msrc/modules/comics/comic/infrastructure/repositories/comic.repository.impl.ts[0m:[93m139[0m:[93m31[0m - [91merror[0m[90m TS2339: [0mProperty 'comicCategoryOnComic' does not exist on type 'PrismaService'.
23:53:20.719 
23:53:20.719 [7m139[0m             await this.prisma.comicCategoryOnComic.createMany({
23:53:20.719 [7m   [0m [91m                              ~~~~~~~~~~~~~~~~~~~~[0m
23:53:20.719 [96msrc/modules/comics/comic/infrastructure/repositories/comic.repository.impl.ts[0m:[93m169[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'comicStats' does not exist on type 'PrismaService'.
23:53:20.719 
23:53:20.720 [7m169[0m         await this.prisma.comicStats.upsert({
23:53:20.720 [7m   [0m [91m                          ~~~~~~~~~~[0m
23:53:20.720 [96msrc/modules/comics/comic/infrastructure/repositories/comic.repository.impl.ts[0m:[93m206[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'chapter' does not exist on type 'PrismaService'.
23:53:20.720 
23:53:20.720 [7m206[0m             this.prisma.chapter.findMany({
23:53:20.720 [7m   [0m [91m                        ~~~~~~~[0m
23:53:20.721 [96msrc/modules/comics/comic/infrastructure/repositories/comic.repository.impl.ts[0m:[93m224[0m:[93m25[0m - [91merror[0m[90m TS2339: [0mProperty 'chapter' does not exist on type 'PrismaService'.
23:53:20.722 
23:53:20.722 [7m224[0m             this.prisma.chapter.count({
23:53:20.722 [7m   [0m [91m                        ~~~~~~~[0m
23:53:20.722 [96msrc/modules/comics/comic/public/services/comic.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Comic'.
23:53:20.722 
23:53:20.723 [7m2[0m import { Comic } from '@prisma/client';
23:53:20.723 [7m [0m [91m         ~~~~~[0m
23:53:20.723 [96msrc/modules/comics/comment/admin/services/comments.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicComment'.
23:53:20.723 
23:53:20.723 [7m2[0m import { ComicComment } from '@prisma/client';
23:53:20.723 [7m [0m [91m         ~~~~~~~~~~~~[0m
23:53:20.724 [96msrc/modules/comics/comment/domain/comment.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicComment'.
23:53:20.724 
23:53:20.724 [7m1[0m import { ComicComment } from '@prisma/client';
23:53:20.724 [7m [0m [91m         ~~~~~~~~~~~~[0m
23:53:20.724 [96msrc/modules/comics/comment/infrastructure/repositories/comment.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicComment'.
23:53:20.724 
23:53:20.724 [7m2[0m import { ComicComment, Prisma } from '@prisma/client';
23:53:20.725 [7m [0m [91m         ~~~~~~~~~~~~[0m
23:53:20.725 [96msrc/modules/comics/comment/infrastructure/repositories/comment.repository.impl.ts[0m:[93m2[0m:[93m24[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.725 
23:53:20.725 [7m2[0m import { ComicComment, Prisma } from '@prisma/client';
23:53:20.725 [7m [0m [91m                       ~~~~~~[0m
23:53:20.728 [96msrc/modules/comics/comment/infrastructure/repositories/comment.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'comicComment' does not exist on type 'PrismaService'.
23:53:20.728 
23:53:20.728 [7m16[0m         super(prisma.comicComment as any);
23:53:20.728 [7m  [0m [91m                     ~~~~~~~~~~~~[0m
23:53:20.728 [96msrc/modules/comics/comment/user/services/comments.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicComment'.
23:53:20.728 
23:53:20.728 [7m2[0m import { ComicComment } from '@prisma/client';
23:53:20.729 [7m [0m [91m         ~~~~~~~~~~~~[0m
23:53:20.729 [96msrc/modules/comics/follow/domain/follow.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicFollow'.
23:53:20.729 
23:53:20.729 [7m1[0m import { ComicFollow } from '@prisma/client';
23:53:20.729 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.729 [96msrc/modules/comics/follow/infrastructure/repositories/follow.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicFollow'.
23:53:20.729 
23:53:20.729 [7m2[0m import { ComicFollow, Prisma } from '@prisma/client';
23:53:20.730 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.730 [96msrc/modules/comics/follow/infrastructure/repositories/follow.repository.impl.ts[0m:[93m2[0m:[93m23[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.730 
23:53:20.730 [7m2[0m import { ComicFollow, Prisma } from '@prisma/client';
23:53:20.730 [7m [0m [91m                      ~~~~~~[0m
23:53:20.730 [96msrc/modules/comics/follow/infrastructure/repositories/follow.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'comicFollow' does not exist on type 'PrismaService'.
23:53:20.730 
23:53:20.731 [7m16[0m         super(prisma.comicFollow as any);
23:53:20.731 [7m  [0m [91m                     ~~~~~~~~~~~[0m
23:53:20.731 [96msrc/modules/comics/follow/infrastructure/repositories/follow.repository.impl.ts[0m:[93m29[0m:[93m41[0m - [91merror[0m[90m TS2339: [0mProperty 'comicFollow' does not exist on type 'PrismaService'.
23:53:20.731 
23:53:20.731 [7m29[0m         const count = await this.prisma.comicFollow.count({
23:53:20.733 [7m  [0m [91m                                        ~~~~~~~~~~~[0m
23:53:20.733 [96msrc/modules/comics/follow/infrastructure/repositories/follow.repository.impl.ts[0m:[93m33[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'comicStats' does not exist on type 'PrismaService'.
23:53:20.734 
23:53:20.734 [7m33[0m         await this.prisma.comicStats.upsert({
23:53:20.735 [7m  [0m [91m                          ~~~~~~~~~~[0m
23:53:20.735 [96msrc/modules/comics/follow/user/services/follows.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicFollow'.
23:53:20.735 
23:53:20.735 [7m2[0m import { ComicFollow } from '@prisma/client';
23:53:20.735 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.735 [96msrc/modules/comics/reading-history/domain/reading-history.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ReadingHistory'.
23:53:20.735 
23:53:20.735 [7m1[0m import { ReadingHistory } from '@prisma/client';
23:53:20.735 [7m [0m [91m         ~~~~~~~~~~~~~~[0m
23:53:20.735 [96msrc/modules/comics/reading-history/infrastructure/repositories/reading-history.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ReadingHistory'.
23:53:20.735 
23:53:20.735 [7m2[0m import { ReadingHistory, Prisma } from '@prisma/client';
23:53:20.735 [7m [0m [91m         ~~~~~~~~~~~~~~[0m
23:53:20.736 [96msrc/modules/comics/reading-history/infrastructure/repositories/reading-history.repository.impl.ts[0m:[93m2[0m:[93m26[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.736 
23:53:20.736 [7m2[0m import { ReadingHistory, Prisma } from '@prisma/client';
23:53:20.736 [7m [0m [91m                         ~~~~~~[0m
23:53:20.736 [96msrc/modules/comics/reading-history/infrastructure/repositories/reading-history.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'readingHistory' does not exist on type 'PrismaService'.
23:53:20.736 
23:53:20.736 [7m16[0m         super(prisma.readingHistory as any);
23:53:20.736 [7m  [0m [91m                     ~~~~~~~~~~~~~~[0m
23:53:20.736 [96msrc/modules/comics/reading-history/user/services/reading-history.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ReadingHistory'.
23:53:20.736 
23:53:20.736 [7m2[0m import { ReadingHistory } from '@prisma/client';
23:53:20.736 [7m [0m [91m         ~~~~~~~~~~~~~~[0m
23:53:20.736 [96msrc/modules/comics/review/admin/services/reviews.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicReview'.
23:53:20.736 
23:53:20.736 [7m2[0m import { ComicReview } from '@prisma/client';
23:53:20.736 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.736 [96msrc/modules/comics/review/domain/review.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicReview'.
23:53:20.736 
23:53:20.736 [7m1[0m import { ComicReview } from '@prisma/client';
23:53:20.736 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.736 [96msrc/modules/comics/review/infrastructure/repositories/review.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicReview'.
23:53:20.736 
23:53:20.737 [7m2[0m import { ComicReview, Prisma } from '@prisma/client';
23:53:20.737 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.737 [96msrc/modules/comics/review/infrastructure/repositories/review.repository.impl.ts[0m:[93m2[0m:[93m23[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.737 
23:53:20.737 [7m2[0m import { ComicReview, Prisma } from '@prisma/client';
23:53:20.737 [7m [0m [91m                      ~~~~~~[0m
23:53:20.737 [96msrc/modules/comics/review/infrastructure/repositories/review.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'comicReview' does not exist on type 'PrismaService'.
23:53:20.738 
23:53:20.739 [7m16[0m         super(prisma.comicReview as any, 'updated_at:desc');
23:53:20.739 [7m  [0m [91m                     ~~~~~~~~~~~[0m
23:53:20.740 [96msrc/modules/comics/review/infrastructure/repositories/review.repository.impl.ts[0m:[93m50[0m:[93m45[0m - [91merror[0m[90m TS2339: [0mProperty 'comicReview' does not exist on type 'PrismaService'.
23:53:20.740 
23:53:20.740 [7m50[0m         const aggregate = await this.prisma.comicReview.aggregate({
23:53:20.740 [7m  [0m [91m                                            ~~~~~~~~~~~[0m
23:53:20.740 [96msrc/modules/comics/review/infrastructure/repositories/review.repository.impl.ts[0m:[93m59[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'comicStats' does not exist on type 'PrismaService'.
23:53:20.740 
23:53:20.740 [7m59[0m         await this.prisma.comicStats.upsert({
23:53:20.740 [7m  [0m [91m                          ~~~~~~~~~~[0m
23:53:20.740 [96msrc/modules/comics/review/infrastructure/repositories/review.repository.impl.ts[0m:[93m77[0m:[93m42[0m - [91merror[0m[90m TS2339: [0mProperty 'comicReview' does not exist on type 'PrismaService'.
23:53:20.741 
23:53:20.741 [7m77[0m         const result = await this.prisma.comicReview.aggregate({
23:53:20.741 [7m  [0m [91m                                         ~~~~~~~~~~~[0m
23:53:20.741 [96msrc/modules/comics/review/infrastructure/repositories/review.repository.impl.ts[0m:[93m86[0m:[93m42[0m - [91merror[0m[90m TS2339: [0mProperty 'comicReview' does not exist on type 'PrismaService'.
23:53:20.741 
23:53:20.741 [7m86[0m         const result = await this.prisma.comicReview.groupBy({
23:53:20.741 [7m  [0m [91m                                         ~~~~~~~~~~~[0m
23:53:20.741 [96msrc/modules/comics/review/infrastructure/repositories/review.repository.impl.ts[0m:[93m92[0m:[93m27[0m - [91merror[0m[90m TS7006: [0mParameter 'r' implicitly has an 'any' type.
23:53:20.741 
23:53:20.741 [7m92[0m         return result.map(r => ({
23:53:20.741 [7m  [0m [91m                          ~[0m
23:53:20.741 [96msrc/modules/comics/review/user/services/reviews.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicReview'.
23:53:20.741 
23:53:20.741 [7m2[0m import { ComicReview } from '@prisma/client';
23:53:20.742 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.743 [96msrc/modules/comics/stats/admin/services/admin-stats.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.743 
23:53:20.744 [7m2[0m import { Prisma } from '@prisma/client';
23:53:20.744 [7m [0m [91m         ~~~~~~[0m
23:53:20.744 [96msrc/modules/comics/stats/domain/comic-stats.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicStats'.
23:53:20.745 
23:53:20.745 [7m1[0m import { ComicStats } from '@prisma/client';
23:53:20.746 [7m [0m [91m         ~~~~~~~~~~[0m
23:53:20.746 [96msrc/modules/comics/stats/domain/comic-view.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicView'.
23:53:20.746 
23:53:20.746 [7m1[0m import { ComicView } from '@prisma/client';
23:53:20.746 [7m [0m [91m         ~~~~~~~~~[0m
23:53:20.746 [96msrc/modules/comics/stats/infrastructure/repositories/comic-stats.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicStats'.
23:53:20.746 
23:53:20.746 [7m2[0m import { ComicStats, Prisma } from '@prisma/client';
23:53:20.746 [7m [0m [91m         ~~~~~~~~~~[0m
23:53:20.746 [96msrc/modules/comics/stats/infrastructure/repositories/comic-stats.repository.impl.ts[0m:[93m2[0m:[93m22[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.746 
23:53:20.746 [7m2[0m import { ComicStats, Prisma } from '@prisma/client';
23:53:20.746 [7m [0m [91m                     ~~~~~~[0m
23:53:20.751 [96msrc/modules/comics/stats/infrastructure/repositories/comic-stats.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'comicStats' does not exist on type 'PrismaService'.
23:53:20.751 
23:53:20.751 [7m16[0m         super(prisma.comicStats as any);
23:53:20.751 [7m  [0m [91m                     ~~~~~~~~~~[0m
23:53:20.752 [96msrc/modules/comics/stats/infrastructure/repositories/comic-stats.repository.impl.ts[0m:[93m34[0m:[93m42[0m - [91merror[0m[90m TS2339: [0mProperty 'comicStats' does not exist on type 'PrismaService'.
23:53:20.752 
23:53:20.752 [7m34[0m         const result = await this.prisma.comicStats.aggregate({
23:53:20.752 [7m  [0m [91m                                         ~~~~~~~~~~[0m
23:53:20.752 [96msrc/modules/comics/stats/infrastructure/repositories/comic-view.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ComicView'.
23:53:20.752 
23:53:20.752 [7m2[0m import { ComicView, Prisma } from '@prisma/client';
23:53:20.752 [7m [0m [91m         ~~~~~~~~~[0m
23:53:20.752 [96msrc/modules/comics/stats/infrastructure/repositories/comic-view.repository.impl.ts[0m:[93m2[0m:[93m21[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.752 
23:53:20.752 [7m2[0m import { ComicView, Prisma } from '@prisma/client';
23:53:20.752 [7m [0m [91m                    ~~~~~~[0m
23:53:20.752 [96msrc/modules/comics/stats/infrastructure/repositories/comic-view.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'comicView' does not exist on type 'PrismaService'.
23:53:20.752 
23:53:20.752 [7m16[0m         super(prisma.comicView as any);
23:53:20.752 [7m  [0m [91m                     ~~~~~~~~~[0m
23:53:20.752 [96msrc/modules/core/content-template/admin/services/content-template.service.ts[0m:[93m7[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ContentTemplate'.
23:53:20.753 
23:53:20.753 [7m7[0m import { ContentTemplate } from '@prisma/client';
23:53:20.753 [7m [0m [91m         ~~~~~~~~~~~~~~~[0m
23:53:20.753 [96msrc/modules/core/content-template/domain/content-template.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ContentTemplate'.
23:53:20.753 
23:53:20.753 [7m2[0m import { ContentTemplate } from '@prisma/client';
23:53:20.754 [7m [0m [91m         ~~~~~~~~~~~~~~~[0m
23:53:20.755 [96msrc/modules/core/content-template/infrastructure/repositories/content-template.repository.impl.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'ContentTemplate'.
23:53:20.755 
23:53:20.755 [7m4[0m import { ContentTemplate, Prisma } from '@prisma/client';
23:53:20.755 [7m [0m [91m         ~~~~~~~~~~~~~~~[0m
23:53:20.755 [96msrc/modules/core/content-template/infrastructure/repositories/content-template.repository.impl.ts[0m:[93m4[0m:[93m27[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.755 
23:53:20.755 [7m4[0m import { ContentTemplate, Prisma } from '@prisma/client';
23:53:20.755 [7m [0m [91m                          ~~~~~~[0m
23:53:20.756 [96msrc/modules/core/content-template/infrastructure/repositories/content-template.repository.impl.ts[0m:[93m12[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'contentTemplate' does not exist on type 'PrismaService'.
23:53:20.756 
23:53:20.756 [7m12[0m         super(prisma.contentTemplate);
23:53:20.756 [7m  [0m [91m                     ~~~~~~~~~~~~~~~[0m
23:53:20.756 [96msrc/modules/core/context/context/domain/context.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Context'.
23:53:20.756 
23:53:20.756 [7m2[0m import { Context } from '@prisma/client';
23:53:20.756 [7m [0m [91m         ~~~~~~~[0m
23:53:20.756 [96msrc/modules/core/context/context/infrastructure/repositories/context.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Context'.
23:53:20.756 
23:53:20.757 [7m3[0m import { Context, Prisma } from '@prisma/client';
23:53:20.757 [7m [0m [91m         ~~~~~~~[0m
23:53:20.757 [96msrc/modules/core/context/context/infrastructure/repositories/context.repository.impl.ts[0m:[93m3[0m:[93m19[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.757 
23:53:20.757 [7m3[0m import { Context, Prisma } from '@prisma/client';
23:53:20.757 [7m [0m [91m                  ~~~~~~[0m
23:53:20.757 [96msrc/modules/core/context/context/infrastructure/repositories/context.repository.impl.ts[0m:[93m17[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'context' does not exist on type 'PrismaService'.
23:53:20.757 
23:53:20.758 [7m17[0m         super(prisma.context as unknown as any, 'id:desc');
23:53:20.758 [7m  [0m [91m                     ~~~~~~~[0m
23:53:20.758 [96msrc/modules/core/context/group/domain/group.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Group'.
23:53:20.758 
23:53:20.758 [7m2[0m import { Group } from '@prisma/client';
23:53:20.758 [7m [0m [91m         ~~~~~[0m
23:53:20.758 [96msrc/modules/core/context/group/infrastructure/repositories/group.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Group'.
23:53:20.758 
23:53:20.759 [7m3[0m import { Group, Prisma } from '@prisma/client';
23:53:20.759 [7m [0m [91m         ~~~~~[0m
23:53:20.759 [96msrc/modules/core/context/group/infrastructure/repositories/group.repository.impl.ts[0m:[93m3[0m:[93m17[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.759 
23:53:20.759 [7m3[0m import { Group, Prisma } from '@prisma/client';
23:53:20.759 [7m [0m [91m                ~~~~~~[0m
23:53:20.759 [96msrc/modules/core/context/group/infrastructure/repositories/group.repository.impl.ts[0m:[93m17[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.759 
23:53:20.760 [7m17[0m         super(prisma.group as unknown as any, 'id:desc');
23:53:20.760 [7m  [0m [91m                     ~~~~~[0m
23:53:20.760 [96msrc/modules/core/context/group/infrastructure/repositories/group.repository.impl.ts[0m:[93m67[0m:[93m28[0m - [91merror[0m[90m TS2339: [0mProperty 'group' does not exist on type 'PrismaService'.
23:53:20.760 
23:53:20.760 [7m67[0m         return this.prisma.group.findUnique({
23:53:20.760 [7m  [0m [91m                           ~~~~~[0m
23:53:20.760 [96msrc/modules/core/iam/permission/domain/permission.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Permission'.
23:53:20.761 
23:53:20.761 [7m2[0m import { Permission } from '@prisma/client';
23:53:20.761 [7m [0m [91m         ~~~~~~~~~~[0m
23:53:20.761 [96msrc/modules/core/iam/permission/infrastructure/repositories/permission.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Permission'.
23:53:20.761 
23:53:20.761 [7m3[0m import { Permission, Prisma } from '@prisma/client';
23:53:20.761 [7m [0m [91m         ~~~~~~~~~~[0m
23:53:20.761 [96msrc/modules/core/iam/permission/infrastructure/repositories/permission.repository.impl.ts[0m:[93m3[0m:[93m22[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.762 
23:53:20.762 [7m3[0m import { Permission, Prisma } from '@prisma/client';
23:53:20.762 [7m [0m [91m                     ~~~~~~[0m
23:53:20.762 [96msrc/modules/core/iam/permission/infrastructure/repositories/permission.repository.impl.ts[0m:[93m18[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'permission' does not exist on type 'PrismaService'.
23:53:20.762 
23:53:20.762 [7m18[0m         super(prisma.permission as unknown as any);
23:53:20.762 [7m  [0m [91m                     ~~~~~~~~~~[0m
23:53:20.763 [96msrc/modules/core/iam/permission/infrastructure/repositories/permission.repository.impl.ts[0m:[93m70[0m:[93m28[0m - [91merror[0m[90m TS2339: [0mProperty 'permission' does not exist on type 'PrismaService'.
23:53:20.763 
23:53:20.763 [7m70[0m         return this.prisma.permission.findMany({
23:53:20.763 [7m  [0m [91m                           ~~~~~~~~~~[0m
23:53:20.763 [96msrc/modules/core/iam/role/domain/role.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Role'.
23:53:20.763 
23:53:20.763 [7m2[0m import { Role } from '@prisma/client';
23:53:20.763 [7m [0m [91m         ~~~~[0m
23:53:20.764 [96msrc/modules/core/iam/role/infrastructure/repositories/role.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Role'.
23:53:20.764 
23:53:20.764 [7m3[0m import { Role, Prisma } from '@prisma/client';
23:53:20.764 [7m [0m [91m         ~~~~[0m
23:53:20.764 [96msrc/modules/core/iam/role/infrastructure/repositories/role.repository.impl.ts[0m:[93m3[0m:[93m16[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.764 
23:53:20.764 [7m3[0m import { Role, Prisma } from '@prisma/client';
23:53:20.764 [7m [0m [91m               ~~~~~~[0m
23:53:20.765 [96msrc/modules/core/iam/role/infrastructure/repositories/role.repository.impl.ts[0m:[93m18[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'role' does not exist on type 'PrismaService'.
23:53:20.765 
23:53:20.765 [7m18[0m         super(prisma.role as unknown as any);
23:53:20.765 [7m  [0m [91m                     ~~~~[0m
23:53:20.765 [96msrc/modules/core/iam/role/infrastructure/repositories/role.repository.impl.ts[0m:[93m75[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'roleHasPermission' does not exist on type 'PrismaService'.
23:53:20.765 
23:53:20.765 [7m75[0m         await this.prisma.roleHasPermission.deleteMany({
23:53:20.766 [7m  [0m [91m                          ~~~~~~~~~~~~~~~~~[0m
23:53:20.766 [96msrc/modules/core/iam/role/infrastructure/repositories/role.repository.impl.ts[0m:[93m80[0m:[93m31[0m - [91merror[0m[90m TS2339: [0mProperty 'roleHasPermission' does not exist on type 'PrismaService'.
23:53:20.766 
23:53:20.766 [7m80[0m             await this.prisma.roleHasPermission.createMany({
23:53:20.766 [7m  [0m [91m                              ~~~~~~~~~~~~~~~~~[0m
23:53:20.766 [96msrc/modules/core/iam/role/infrastructure/repositories/role.repository.impl.ts[0m:[93m91[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty 'roleContext' does not exist on type 'PrismaService'.
23:53:20.766 
23:53:20.766 [7m91[0m         await this.prisma.roleContext.deleteMany({
23:53:20.767 [7m  [0m [91m                          ~~~~~~~~~~~[0m
23:53:20.767 [96msrc/modules/core/iam/role/infrastructure/repositories/role.repository.impl.ts[0m:[93m96[0m:[93m31[0m - [91merror[0m[90m TS2339: [0mProperty 'roleContext' does not exist on type 'PrismaService'.
23:53:20.767 
23:53:20.767 [7m96[0m             await this.prisma.roleContext.createMany({
23:53:20.767 [7m  [0m [91m                              ~~~~~~~~~~~[0m
23:53:20.767 [96msrc/modules/core/location/country/admin/services/country.service.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Country'.
23:53:20.767 
23:53:20.767 [7m4[0m import { Country } from '@prisma/client';
23:53:20.768 [7m [0m [91m         ~~~~~~~[0m
23:53:20.768 [96msrc/modules/core/location/country/domain/country.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Country'.
23:53:20.768 
23:53:20.768 [7m2[0m import { Country } from '@prisma/client';
23:53:20.768 [7m [0m [91m         ~~~~~~~[0m
23:53:20.768 [96msrc/modules/core/location/country/infrastructure/repositories/country.repository.impl.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Country'.
23:53:20.769 
23:53:20.769 [7m4[0m import { Country, Prisma } from '@prisma/client';
23:53:20.769 [7m [0m [91m         ~~~~~~~[0m
23:53:20.769 [96msrc/modules/core/location/country/infrastructure/repositories/country.repository.impl.ts[0m:[93m4[0m:[93m19[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.769 
23:53:20.769 [7m4[0m import { Country, Prisma } from '@prisma/client';
23:53:20.769 [7m [0m [91m                  ~~~~~~[0m
23:53:20.769 [96msrc/modules/core/location/country/infrastructure/repositories/country.repository.impl.ts[0m:[93m12[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'country' does not exist on type 'PrismaService'.
23:53:20.769 
23:53:20.770 [7m12[0m         super(prisma.country as any);
23:53:20.770 [7m  [0m [91m                     ~~~~~~~[0m
23:53:20.770 [96msrc/modules/core/location/country/public/services/country.service.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Country'.
23:53:20.772 
23:53:20.772 [7m4[0m import { Country } from '@prisma/client';
23:53:20.772 [7m [0m [91m         ~~~~~~~[0m
23:53:20.772 [96msrc/modules/core/location/province/admin/services/province.service.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Province'.
23:53:20.772 
23:53:20.772 [7m4[0m import { Province } from '@prisma/client';
23:53:20.773 [7m [0m [91m         ~~~~~~~~[0m
23:53:20.773 [96msrc/modules/core/location/province/domain/province.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Province'.
23:53:20.773 
23:53:20.773 [7m2[0m import { Province } from '@prisma/client';
23:53:20.773 [7m [0m [91m         ~~~~~~~~[0m
23:53:20.773 [96msrc/modules/core/location/province/infrastructure/repositories/province.repository.impl.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Province'.
23:53:20.773 
23:53:20.774 [7m4[0m import { Province, Prisma } from '@prisma/client';
23:53:20.774 [7m [0m [91m         ~~~~~~~~[0m
23:53:20.774 [96msrc/modules/core/location/province/infrastructure/repositories/province.repository.impl.ts[0m:[93m4[0m:[93m20[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.774 
23:53:20.774 [7m4[0m import { Province, Prisma } from '@prisma/client';
23:53:20.774 [7m [0m [91m                   ~~~~~~[0m
23:53:20.774 [96msrc/modules/core/location/province/infrastructure/repositories/province.repository.impl.ts[0m:[93m12[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'province' does not exist on type 'PrismaService'.
23:53:20.774 
23:53:20.775 [7m12[0m         super(prisma.province as any);
23:53:20.775 [7m  [0m [91m                     ~~~~~~~~[0m
23:53:20.775 [96msrc/modules/core/location/province/public/services/province.service.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Province'.
23:53:20.775 
23:53:20.775 [7m4[0m import { Province } from '@prisma/client';
23:53:20.775 [7m [0m [91m         ~~~~~~~~[0m
23:53:20.775 [96msrc/modules/core/location/ward/admin/services/ward.service.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Ward'.
23:53:20.775 
23:53:20.775 [7m4[0m import { Ward } from '@prisma/client';
23:53:20.776 [7m [0m [91m         ~~~~[0m
23:53:20.776 [96msrc/modules/core/location/ward/domain/ward.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Ward'.
23:53:20.776 
23:53:20.776 [7m2[0m import { Ward } from '@prisma/client';
23:53:20.776 [7m [0m [91m         ~~~~[0m
23:53:20.776 [96msrc/modules/core/location/ward/infrastructure/repositories/ward.repository.impl.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Ward'.
23:53:20.776 
23:53:20.777 [7m4[0m import { Ward, Prisma } from '@prisma/client';
23:53:20.777 [7m [0m [91m         ~~~~[0m
23:53:20.777 [96msrc/modules/core/location/ward/infrastructure/repositories/ward.repository.impl.ts[0m:[93m4[0m:[93m16[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.777 
23:53:20.777 [7m4[0m import { Ward, Prisma } from '@prisma/client';
23:53:20.777 [7m [0m [91m               ~~~~~~[0m
23:53:20.777 [96msrc/modules/core/location/ward/infrastructure/repositories/ward.repository.impl.ts[0m:[93m12[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'ward' does not exist on type 'PrismaService'.
23:53:20.777 
23:53:20.778 [7m12[0m         super(prisma.ward as any);
23:53:20.778 [7m  [0m [91m                     ~~~~[0m
23:53:20.778 [96msrc/modules/core/location/ward/public/services/ward.service.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Ward'.
23:53:20.778 
23:53:20.778 [7m4[0m import { Ward } from '@prisma/client';
23:53:20.778 [7m [0m [91m         ~~~~[0m
23:53:20.778 [96msrc/modules/core/menu/domain/menu.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Menu'.
23:53:20.779 
23:53:20.779 [7m2[0m import { Menu } from '@prisma/client';
23:53:20.779 [7m [0m [91m         ~~~~[0m
23:53:20.779 [96msrc/modules/core/menu/infrastructure/repositories/menu.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Menu'.
23:53:20.779 
23:53:20.779 [7m3[0m import { Menu, Prisma } from '@prisma/client';
23:53:20.779 [7m [0m [91m         ~~~~[0m
23:53:20.779 [96msrc/modules/core/menu/infrastructure/repositories/menu.repository.impl.ts[0m:[93m3[0m:[93m16[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.780 
23:53:20.780 [7m3[0m import { Menu, Prisma } from '@prisma/client';
23:53:20.780 [7m [0m [91m               ~~~~~~[0m
23:53:20.780 [96msrc/modules/core/menu/infrastructure/repositories/menu.repository.impl.ts[0m:[93m18[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'menu' does not exist on type 'PrismaService'.
23:53:20.780 
23:53:20.780 [7m18[0m         super(prisma.menu as unknown as any, 'sort_order:asc');
23:53:20.780 [7m  [0m [91m                     ~~~~[0m
23:53:20.781 [96msrc/modules/core/notification/domain/notification.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Notification'.
23:53:20.781 
23:53:20.781 [7m2[0m import { Notification } from '@prisma/client';
23:53:20.781 [7m [0m [91m         ~~~~~~~~~~~~[0m
23:53:20.781 [96msrc/modules/core/notification/infrastructure/repositories/notification.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Notification'.
23:53:20.781 
23:53:20.781 [7m3[0m import { Notification, Prisma } from '@prisma/client';
23:53:20.782 [7m [0m [91m         ~~~~~~~~~~~~[0m
23:53:20.782 [96msrc/modules/core/notification/infrastructure/repositories/notification.repository.impl.ts[0m:[93m3[0m:[93m24[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.782 
23:53:20.782 [7m3[0m import { Notification, Prisma } from '@prisma/client';
23:53:20.782 [7m [0m [91m                       ~~~~~~[0m
23:53:20.782 [96msrc/modules/core/notification/infrastructure/repositories/notification.repository.impl.ts[0m:[93m17[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'notification' does not exist on type 'PrismaService'.
23:53:20.782 
23:53:20.782 [7m17[0m         super(prisma.notification as unknown as any, 'created_at:desc');
23:53:20.783 [7m  [0m [91m                     ~~~~~~~~~~~~[0m
23:53:20.783 [96msrc/modules/core/rbac/role-context/domain/role-context.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'RoleContext'.
23:53:20.783 
23:53:20.783 [7m2[0m import { RoleContext } from '@prisma/client';
23:53:20.783 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.783 [96msrc/modules/core/rbac/role-context/infrastructure/repositories/role-context.repository.impl.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'RoleContext'.
23:53:20.783 
23:53:20.783 [7m4[0m import { RoleContext } from '@prisma/client';
23:53:20.784 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.784 [96msrc/modules/core/rbac/role-context/infrastructure/repositories/role-context.repository.impl.ts[0m:[93m14[0m:[93m28[0m - [91merror[0m[90m TS2339: [0mProperty 'roleContext' does not exist on type 'PrismaService'.
23:53:20.784 
23:53:20.784 [7m14[0m         return this.prisma.roleContext.findFirst(options);
23:53:20.784 [7m  [0m [91m                           ~~~~~~~~~~~[0m
23:53:20.784 [96msrc/modules/core/rbac/role-context/infrastructure/repositories/role-context.repository.impl.ts[0m:[93m22[0m:[93m28[0m - [91merror[0m[90m TS2339: [0mProperty 'roleContext' does not exist on type 'PrismaService'.
23:53:20.784 
23:53:20.784 [7m22[0m         return this.prisma.roleContext.findMany(options);
23:53:20.784 [7m  [0m [91m                           ~~~~~~~~~~~[0m
23:53:20.785 [96msrc/modules/core/rbac/role-has-permission/domain/role-has-permission.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'RoleHasPermission'.
23:53:20.785 
23:53:20.785 [7m2[0m import { RoleHasPermission } from '@prisma/client';
23:53:20.785 [7m [0m [91m         ~~~~~~~~~~~~~~~~~[0m
23:53:20.785 [96msrc/modules/core/rbac/role-has-permission/infrastructure/repositories/role-has-permission.repository.impl.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'RoleHasPermission'.
23:53:20.785 
23:53:20.785 [7m4[0m import { RoleHasPermission } from '@prisma/client';
23:53:20.785 [7m [0m [91m         ~~~~~~~~~~~~~~~~~[0m
23:53:20.786 [96msrc/modules/core/rbac/role-has-permission/infrastructure/repositories/role-has-permission.repository.impl.ts[0m:[93m15[0m:[93m28[0m - [91merror[0m[90m TS2339: [0mProperty 'roleHasPermission' does not exist on type 'PrismaService'.
23:53:20.786 
23:53:20.786 [7m15[0m         return this.prisma.roleHasPermission.findMany(options);
23:53:20.786 [7m  [0m [91m                           ~~~~~~~~~~~~~~~~~[0m
23:53:20.786 [96msrc/modules/core/rbac/role-has-permission/infrastructure/repositories/role-has-permission.repository.impl.ts[0m:[93m20[0m:[93m40[0m - [91merror[0m[90m TS2339: [0mProperty 'roleHasPermission' does not exist on type 'PrismaService'.
23:53:20.786 
23:53:20.786 [7m20[0m         const rows = await this.prisma.roleHasPermission.findMany({
23:53:20.786 [7m  [0m [91m                                       ~~~~~~~~~~~~~~~~~[0m
23:53:20.786 [96msrc/modules/core/rbac/user-group/domain/user-group.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'UserGroup'.
23:53:20.787 
23:53:20.787 [7m1[0m import { UserGroup } from '@prisma/client';
23:53:20.787 [7m [0m [91m         ~~~~~~~~~[0m
23:53:20.787 [96msrc/modules/core/rbac/user-group/infrastructure/repositories/user-group.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'UserGroup'.
23:53:20.787 
23:53:20.787 [7m3[0m import { UserGroup, Prisma } from '@prisma/client';
23:53:20.787 [7m [0m [91m         ~~~~~~~~~[0m
23:53:20.787 [96msrc/modules/core/rbac/user-group/infrastructure/repositories/user-group.repository.impl.ts[0m:[93m3[0m:[93m21[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.788 
23:53:20.788 [7m3[0m import { UserGroup, Prisma } from '@prisma/client';
23:53:20.788 [7m [0m [91m                    ~~~~~~[0m
23:53:20.788 [96msrc/modules/core/rbac/user-group/infrastructure/repositories/user-group.repository.impl.ts[0m:[93m17[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'userGroup' does not exist on type 'PrismaService'.
23:53:20.788 
23:53:20.788 [7m17[0m         super(prisma.userGroup as unknown as any);
23:53:20.788 [7m  [0m [91m                     ~~~~~~~~~[0m
23:53:20.789 [96msrc/modules/core/rbac/user-group/infrastructure/repositories/user-group.repository.impl.ts[0m:[93m22[0m:[93m28[0m - [91merror[0m[90m TS2339: [0mProperty 'userGroup' does not exist on type 'PrismaService'.
23:53:20.789 
23:53:20.789 [7m22[0m         return this.prisma.userGroup.findUnique({
23:53:20.789 [7m  [0m [91m                           ~~~~~~~~~[0m
23:53:20.789 [96msrc/modules/core/rbac/user-role-assignment/domain/user-role-assignment.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'UserRoleAssignment'.
23:53:20.789 
23:53:20.789 [7m1[0m import { UserRoleAssignment } from '@prisma/client';
23:53:20.789 [7m [0m [91m         ~~~~~~~~~~~~~~~~~~[0m
23:53:20.790 [96msrc/modules/core/rbac/user-role-assignment/infrastructure/repositories/user-role-assignment.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'UserRoleAssignment'.
23:53:20.790 
23:53:20.790 [7m3[0m import { UserRoleAssignment, Prisma } from '@prisma/client';
23:53:20.790 [7m [0m [91m         ~~~~~~~~~~~~~~~~~~[0m
23:53:20.790 [96msrc/modules/core/rbac/user-role-assignment/infrastructure/repositories/user-role-assignment.repository.impl.ts[0m:[93m3[0m:[93m30[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.790 
23:53:20.790 [7m3[0m import { UserRoleAssignment, Prisma } from '@prisma/client';
23:53:20.791 [7m [0m [91m                             ~~~~~~[0m
23:53:20.791 [96msrc/modules/core/rbac/user-role-assignment/infrastructure/repositories/user-role-assignment.repository.impl.ts[0m:[93m17[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'userRoleAssignment' does not exist on type 'PrismaService'.
23:53:20.791 
23:53:20.791 [7m17[0m         super(prisma.userRoleAssignment as unknown as any);
23:53:20.791 [7m  [0m [91m                     ~~~~~~~~~~~~~~~~~~[0m
23:53:20.796 [96msrc/modules/core/rbac/user-role-assignment/infrastructure/repositories/user-role-assignment.repository.impl.ts[0m:[93m22[0m:[93m28[0m - [91merror[0m[90m TS2339: [0mProperty 'userRoleAssignment' does not exist on type 'PrismaService'.
23:53:20.796 
23:53:20.796 [7m22[0m         return this.prisma.userRoleAssignment.findUnique({
23:53:20.796 [7m  [0m [91m                           ~~~~~~~~~~~~~~~~~~[0m
23:53:20.796 [96msrc/modules/core/rbac/user-role-assignment/infrastructure/repositories/user-role-assignment.repository.impl.ts[0m:[93m35[0m:[93m28[0m - [91merror[0m[90m TS2339: [0mProperty 'userRoleAssignment' does not exist on type 'PrismaService'.
23:53:20.797 
23:53:20.797 [7m35[0m         return this.prisma.userRoleAssignment.createMany({
23:53:20.797 [7m  [0m [91m                           ~~~~~~~~~~~~~~~~~~[0m
23:53:20.797 [96msrc/modules/core/rbac/user-role-assignment/infrastructure/repositories/user-role-assignment.repository.impl.ts[0m:[93m42[0m:[93m40[0m - [91merror[0m[90m TS2339: [0mProperty 'userRoleAssignment' does not exist on type 'PrismaService'.
23:53:20.797 
23:53:20.799 [7m42[0m         const rows = await this.prisma.userRoleAssignment.findMany({
23:53:20.799 [7m  [0m [91m                                       ~~~~~~~~~~~~~~~~~~[0m
23:53:20.799 [96msrc/modules/core/rbac/user-role-assignment/infrastructure/repositories/user-role-assignment.repository.impl.ts[0m:[93m52[0m:[93m26[0m - [91merror[0m[90m TS7006: [0mParameter 'r' implicitly has an 'any' type.
23:53:20.799 
23:53:20.800 [7m52[0m         return rows.map((r) => r.role_id);
23:53:20.800 [7m  [0m [91m                         ~[0m
23:53:20.800 [96msrc/modules/core/rbac/user-role-assignment/infrastructure/repositories/user-role-assignment.repository.impl.ts[0m:[93m56[0m:[93m40[0m - [91merror[0m[90m TS2339: [0mProperty 'roleHasPermission' does not exist on type 'PrismaService'.
23:53:20.800 
23:53:20.800 [7m56[0m         const rows = await this.prisma.roleHasPermission.findMany({
23:53:20.800 [7m  [0m [91m                                       ~~~~~~~~~~~~~~~~~[0m
23:53:20.801 [96msrc/modules/core/rbac/user-role-assignment/infrastructure/repositories/user-role-assignment.repository.impl.ts[0m:[93m88[0m:[93m27[0m - [91merror[0m[90m TS2339: [0mProperty '$transaction' does not exist on type 'PrismaService'.
23:53:20.801 
23:53:20.801 [7m88[0m         await this.prisma.$transaction(async (tx) => {
23:53:20.801 [7m  [0m [91m                          ~~~~~~~~~~~~[0m
23:53:20.801 [96msrc/modules/core/rbac/user-role-assignment/infrastructure/repositories/user-role-assignment.repository.impl.ts[0m:[93m88[0m:[93m47[0m - [91merror[0m[90m TS7006: [0mParameter 'tx' implicitly has an 'any' type.
23:53:20.801 
23:53:20.801 [7m88[0m         await this.prisma.$transaction(async (tx) => {
23:53:20.802 [7m  [0m [91m                                              ~~[0m
23:53:20.802 [96msrc/modules/core/system-config/email/domain/repositories/email-config.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'EmailConfig'.
23:53:20.802 
23:53:20.802 [7m2[0m import { EmailConfig } from '@prisma/client';
23:53:20.802 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.802 [96msrc/modules/core/system-config/email/infrastructure/repositories/email-config.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'EmailConfig'.
23:53:20.803 
23:53:20.803 [7m2[0m import { EmailConfig, Prisma } from '@prisma/client';
23:53:20.803 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.803 [96msrc/modules/core/system-config/email/infrastructure/repositories/email-config.repository.impl.ts[0m:[93m2[0m:[93m23[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.803 
23:53:20.803 [7m2[0m import { EmailConfig, Prisma } from '@prisma/client';
23:53:20.803 [7m [0m [91m                      ~~~~~~[0m
23:53:20.804 [96msrc/modules/core/system-config/email/infrastructure/repositories/email-config.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'emailConfig' does not exist on type 'PrismaService'.
23:53:20.804 
23:53:20.804 [7m16[0m         super(prisma.emailConfig as unknown as any);
23:53:20.804 [7m  [0m [91m                     ~~~~~~~~~~~[0m
23:53:20.804 [96msrc/modules/core/system-config/email/infrastructure/repositories/email-config.repository.impl.ts[0m:[93m25[0m:[93m28[0m - [91merror[0m[90m TS2339: [0mProperty 'emailConfig' does not exist on type 'PrismaService'.
23:53:20.804 
23:53:20.804 [7m25[0m         return this.prisma.emailConfig.findFirst();
23:53:20.805 [7m  [0m [91m                           ~~~~~~~~~~~[0m
23:53:20.805 [96msrc/modules/core/system-config/general/domain/repositories/general-config.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'GeneralConfig'.
23:53:20.805 
23:53:20.805 [7m2[0m import { GeneralConfig } from '@prisma/client';
23:53:20.805 [7m [0m [91m         ~~~~~~~~~~~~~[0m
23:53:20.805 [96msrc/modules/core/system-config/general/infrastructure/repositories/general-config.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'GeneralConfig'.
23:53:20.805 
23:53:20.806 [7m2[0m import { GeneralConfig, Prisma } from '@prisma/client';
23:53:20.806 [7m [0m [91m         ~~~~~~~~~~~~~[0m
23:53:20.806 [96msrc/modules/core/system-config/general/infrastructure/repositories/general-config.repository.impl.ts[0m:[93m2[0m:[93m25[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.806 
23:53:20.807 [7m2[0m import { GeneralConfig, Prisma } from '@prisma/client';
23:53:20.807 [7m [0m [91m                        ~~~~~~[0m
23:53:20.807 [96msrc/modules/core/system-config/general/infrastructure/repositories/general-config.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'generalConfig' does not exist on type 'PrismaService'.
23:53:20.807 
23:53:20.807 [7m16[0m         super(prisma.generalConfig as unknown as any);
23:53:20.807 [7m  [0m [91m                     ~~~~~~~~~~~~~[0m
23:53:20.807 [96msrc/modules/core/system-config/general/infrastructure/repositories/general-config.repository.impl.ts[0m:[93m25[0m:[93m28[0m - [91merror[0m[90m TS2339: [0mProperty 'generalConfig' does not exist on type 'PrismaService'.
23:53:20.808 
23:53:20.808 [7m25[0m         return this.prisma.generalConfig.findFirst();
23:53:20.808 [7m  [0m [91m                           ~~~~~~~~~~~~~[0m
23:53:20.808 [96msrc/modules/core/user/domain/profile.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Profile'.
23:53:20.808 
23:53:20.808 [7m1[0m import { Profile } from '@prisma/client';
23:53:20.808 [7m [0m [91m         ~~~~~~~[0m
23:53:20.809 [96msrc/modules/core/user/domain/user.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'User'.
23:53:20.809 
23:53:20.809 [7m1[0m import { User } from '@prisma/client';
23:53:20.809 [7m [0m [91m         ~~~~[0m
23:53:20.809 [96msrc/modules/core/user/infrastructure/repositories/profile.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Profile'.
23:53:20.809 
23:53:20.809 [7m2[0m import { Profile } from '@prisma/client';
23:53:20.810 [7m [0m [91m         ~~~~~~~[0m
23:53:20.810 [96msrc/modules/core/user/infrastructure/repositories/profile.repository.impl.ts[0m:[93m15[0m:[93m24[0m - [91merror[0m[90m TS2339: [0mProperty 'profile' does not exist on type 'PrismaService'.
23:53:20.810 
23:53:20.810 [7m15[0m     return this.prisma.profile.upsert({
23:53:20.810 [7m  [0m [91m                       ~~~~~~~[0m
23:53:20.810 [96msrc/modules/core/user/infrastructure/repositories/user.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'User'.
23:53:20.810 
23:53:20.811 [7m2[0m import { User, Prisma } from '@prisma/client';
23:53:20.811 [7m [0m [91m         ~~~~[0m
23:53:20.811 [96msrc/modules/core/user/infrastructure/repositories/user.repository.impl.ts[0m:[93m2[0m:[93m16[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.811 
23:53:20.811 [7m2[0m import { User, Prisma } from '@prisma/client';
23:53:20.811 [7m [0m [91m               ~~~~~~[0m
23:53:20.812 [96msrc/modules/core/user/infrastructure/repositories/user.repository.impl.ts[0m:[93m18[0m:[93m18[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.812 
23:53:20.812 [7m18[0m     super(prisma.user as any);
23:53:20.812 [7m  [0m [91m                 ~~~~[0m
23:53:20.812 [96msrc/modules/core/user/infrastructure/repositories/user.repository.impl.ts[0m:[93m44[0m:[93m36[0m - [91merror[0m[90m TS2339: [0mProperty 'userGroup' does not exist on type 'PrismaService'.
23:53:20.812 
23:53:20.813 [7m44[0m     const rows = await this.prisma.userGroup.findMany({
23:53:20.813 [7m  [0m [91m                                   ~~~~~~~~~[0m
23:53:20.813 [96msrc/modules/core/user/infrastructure/repositories/user.repository.impl.ts[0m:[93m52[0m:[93m22[0m - [91merror[0m[90m TS7006: [0mParameter 'r' implicitly has an 'any' type.
23:53:20.813 
23:53:20.813 [7m52[0m     return rows.map((r) => r.group_id);
23:53:20.813 [7m  [0m [91m                     ~[0m
23:53:20.814 [96msrc/modules/core/user/infrastructure/repositories/user.repository.impl.ts[0m:[93m66[0m:[93m24[0m - [91merror[0m[90m TS2339: [0mProperty 'userRoleAssignment' does not exist on type 'PrismaService'.
23:53:20.814 
23:53:20.814 [7m66[0m     return this.prisma.userRoleAssignment.findMany({
23:53:20.814 [7m  [0m [91m                       ~~~~~~~~~~~~~~~~~~[0m
23:53:20.814 [96msrc/modules/core/user/infrastructure/repositories/user.repository.impl.ts[0m:[93m108[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.814 
23:53:20.814 [7m108[0m     const row = await this.prisma.user.findUnique({
23:53:20.815 [7m   [0m [91m                                  ~~~~[0m
23:53:20.815 [96msrc/modules/core/user/infrastructure/repositories/user.repository.impl.ts[0m:[93m116[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.815 
23:53:20.815 [7m116[0m     const row = await this.prisma.user.findUnique({
23:53:20.815 [7m   [0m [91m                                  ~~~~[0m
23:53:20.815 [96msrc/modules/core/user/infrastructure/repositories/user.repository.impl.ts[0m:[93m129[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.817 
23:53:20.818 [7m129[0m     const row = await this.prisma.user.findUnique({
23:53:20.818 [7m   [0m [91m                                  ~~~~[0m
23:53:20.818 [96msrc/modules/core/user/infrastructure/repositories/user.repository.impl.ts[0m:[93m137[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.818 
23:53:20.818 [7m137[0m     const row = await this.prisma.user.findUnique({
23:53:20.818 [7m   [0m [91m                                  ~~~~[0m
23:53:20.819 [96msrc/modules/core/user/infrastructure/repositories/user.repository.impl.ts[0m:[93m145[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.819 
23:53:20.819 [7m145[0m     const row = await this.prisma.user.findUnique({
23:53:20.819 [7m   [0m [91m                                  ~~~~[0m
23:53:20.819 [96msrc/modules/core/user/infrastructure/repositories/user.repository.impl.ts[0m:[93m167[0m:[93m40[0m - [91merror[0m[90m TS2339: [0mProperty 'user' does not exist on type 'PrismaService'.
23:53:20.819 
23:53:20.819 [7m167[0m     const existing = await this.prisma.user.findFirst({
23:53:20.820 [7m   [0m [91m                                       ~~~~[0m
23:53:20.820 [96msrc/modules/introduction/about/infrastructure/repositories/about.repository.impl.ts[0m:[93m9[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'aboutSection' does not exist on type 'PrismaService'.
23:53:20.820 
23:53:20.820 [7m9[0m         super(prisma.aboutSection);
23:53:20.820 [7m [0m [91m                     ~~~~~~~~~~~~[0m
23:53:20.820 [96msrc/modules/introduction/certificate/admin/services/certificate.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Certificate'.
23:53:20.821 
23:53:20.821 [7m2[0m import { Certificate } from '@prisma/client';
23:53:20.821 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.821 [96msrc/modules/introduction/certificate/domain/certificate.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Certificate'.
23:53:20.821 
23:53:20.821 [7m2[0m import { Certificate } from '@prisma/client';
23:53:20.821 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.822 [96msrc/modules/introduction/certificate/infrastructure/repositories/certificate.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Certificate'.
23:53:20.825 
23:53:20.825 [7m2[0m import { Certificate, Prisma } from '@prisma/client';
23:53:20.825 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.826 [96msrc/modules/introduction/certificate/infrastructure/repositories/certificate.repository.impl.ts[0m:[93m2[0m:[93m23[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.826 
23:53:20.826 [7m2[0m import { Certificate, Prisma } from '@prisma/client';
23:53:20.826 [7m [0m [91m                      ~~~~~~[0m
23:53:20.826 [96msrc/modules/introduction/certificate/infrastructure/repositories/certificate.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'certificate' does not exist on type 'PrismaService'.
23:53:20.826 
23:53:20.827 [7m16[0m         super(prisma.certificate as unknown as any, 'sort_order:asc');
23:53:20.827 [7m  [0m [91m                     ~~~~~~~~~~~[0m
23:53:20.827 [96msrc/modules/introduction/certificate/public/services/certificate.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Certificate'.
23:53:20.827 
23:53:20.827 [7m2[0m import { Certificate } from '@prisma/client';
23:53:20.827 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.828 [96msrc/modules/introduction/faq/admin/services/faq.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Faq'.
23:53:20.829 
23:53:20.830 [7m2[0m import { Faq } from '@prisma/client';
23:53:20.830 [7m [0m [91m         ~~~[0m
23:53:20.830 [96msrc/modules/introduction/faq/domain/faq.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Faq'.
23:53:20.830 
23:53:20.830 [7m2[0m import { Faq } from '@prisma/client';
23:53:20.830 [7m [0m [91m         ~~~[0m
23:53:20.831 [96msrc/modules/introduction/faq/infrastructure/repositories/faq.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Faq'.
23:53:20.831 
23:53:20.831 [7m2[0m import { Faq, Prisma } from '@prisma/client';
23:53:20.831 [7m [0m [91m         ~~~[0m
23:53:20.831 [96msrc/modules/introduction/faq/infrastructure/repositories/faq.repository.impl.ts[0m:[93m2[0m:[93m15[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.831 
23:53:20.831 [7m2[0m import { Faq, Prisma } from '@prisma/client';
23:53:20.832 [7m [0m [91m              ~~~~~~[0m
23:53:20.832 [96msrc/modules/introduction/faq/infrastructure/repositories/faq.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'faq' does not exist on type 'PrismaService'.
23:53:20.832 
23:53:20.832 [7m16[0m         super(prisma.faq as unknown as any, 'sort_order:asc');
23:53:20.832 [7m  [0m [91m                     ~~~[0m
23:53:20.832 [96msrc/modules/introduction/faq/public/services/faq.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Faq'.
23:53:20.833 
23:53:20.833 [7m2[0m import { Faq } from '@prisma/client';
23:53:20.833 [7m [0m [91m         ~~~[0m
23:53:20.833 [96msrc/modules/introduction/gallery/admin/services/gallery.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Gallery'.
23:53:20.833 
23:53:20.833 [7m2[0m import { Gallery } from '@prisma/client';
23:53:20.833 [7m [0m [91m         ~~~~~~~[0m
23:53:20.834 [96msrc/modules/introduction/gallery/domain/gallery.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Gallery'.
23:53:20.834 
23:53:20.834 [7m2[0m import { Gallery } from '@prisma/client';
23:53:20.834 [7m [0m [91m         ~~~~~~~[0m
23:53:20.834 [96msrc/modules/introduction/gallery/infrastructure/repositories/gallery.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Gallery'.
23:53:20.834 
23:53:20.834 [7m2[0m import { Gallery, Prisma } from '@prisma/client';
23:53:20.835 [7m [0m [91m         ~~~~~~~[0m
23:53:20.835 [96msrc/modules/introduction/gallery/infrastructure/repositories/gallery.repository.impl.ts[0m:[93m2[0m:[93m19[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.835 
23:53:20.835 [7m2[0m import { Gallery, Prisma } from '@prisma/client';
23:53:20.835 [7m [0m [91m                  ~~~~~~[0m
23:53:20.835 [96msrc/modules/introduction/gallery/infrastructure/repositories/gallery.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'gallery' does not exist on type 'PrismaService'.
23:53:20.835 
23:53:20.836 [7m16[0m         super(prisma.gallery as unknown as any, 'sort_order:asc');
23:53:20.836 [7m  [0m [91m                     ~~~~~~~[0m
23:53:20.836 [96msrc/modules/introduction/partner/admin/services/partner.service.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Partner'.
23:53:20.836 
23:53:20.836 [7m4[0m import { Partner } from '@prisma/client';
23:53:20.836 [7m [0m [91m         ~~~~~~~[0m
23:53:20.837 [96msrc/modules/introduction/partner/domain/partner.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Partner'.
23:53:20.837 
23:53:20.837 [7m2[0m import { Partner } from '@prisma/client';
23:53:20.837 [7m [0m [91m         ~~~~~~~[0m
23:53:20.837 [96msrc/modules/introduction/partner/infrastructure/repositories/partner.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Partner'.
23:53:20.837 
23:53:20.837 [7m2[0m import { Partner, Prisma } from '@prisma/client';
23:53:20.838 [7m [0m [91m         ~~~~~~~[0m
23:53:20.838 [96msrc/modules/introduction/partner/infrastructure/repositories/partner.repository.impl.ts[0m:[93m2[0m:[93m19[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.838 
23:53:20.838 [7m2[0m import { Partner, Prisma } from '@prisma/client';
23:53:20.840 [7m [0m [91m                  ~~~~~~[0m
23:53:20.841 [96msrc/modules/introduction/partner/infrastructure/repositories/partner.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'partner' does not exist on type 'PrismaService'.
23:53:20.841 
23:53:20.841 [7m16[0m         super(prisma.partner as unknown as any, 'sort_order:asc');
23:53:20.841 [7m  [0m [91m                     ~~~~~~~[0m
23:53:20.841 [96msrc/modules/introduction/project/admin/services/project.service.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Project'.
23:53:20.841 
23:53:20.841 [7m4[0m import { Project } from '@prisma/client';
23:53:20.842 [7m [0m [91m         ~~~~~~~[0m
23:53:20.842 [96msrc/modules/introduction/project/domain/project.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Project'.
23:53:20.842 
23:53:20.842 [7m2[0m import { Project } from '@prisma/client';
23:53:20.842 [7m [0m [91m         ~~~~~~~[0m
23:53:20.842 [96msrc/modules/introduction/project/infrastructure/repositories/project.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Project'.
23:53:20.842 
23:53:20.842 [7m2[0m import { Project, Prisma } from '@prisma/client';
23:53:20.843 [7m [0m [91m         ~~~~~~~[0m
23:53:20.843 [96msrc/modules/introduction/project/infrastructure/repositories/project.repository.impl.ts[0m:[93m2[0m:[93m19[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.843 
23:53:20.843 [7m2[0m import { Project, Prisma } from '@prisma/client';
23:53:20.843 [7m [0m [91m                  ~~~~~~[0m
23:53:20.843 [96msrc/modules/introduction/project/infrastructure/repositories/project.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'project' does not exist on type 'PrismaService'.
23:53:20.843 
23:53:20.844 [7m16[0m         super(prisma.project as unknown as any, 'sort_order:asc');
23:53:20.844 [7m  [0m [91m                     ~~~~~~~[0m
23:53:20.844 [96msrc/modules/introduction/staff/admin/services/staff.service.ts[0m:[93m4[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Staff'.
23:53:20.844 
23:53:20.844 [7m4[0m import { Staff } from '@prisma/client';
23:53:20.844 [7m [0m [91m         ~~~~~[0m
23:53:20.844 [96msrc/modules/introduction/staff/domain/staff.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Staff'.
23:53:20.844 
23:53:20.845 [7m2[0m import { Staff } from '@prisma/client';
23:53:20.845 [7m [0m [91m         ~~~~~[0m
23:53:20.845 [96msrc/modules/introduction/staff/infrastructure/repositories/staff.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Staff'.
23:53:20.845 
23:53:20.845 [7m2[0m import { Staff, Prisma } from '@prisma/client';
23:53:20.845 [7m [0m [91m         ~~~~~[0m
23:53:20.845 [96msrc/modules/introduction/staff/infrastructure/repositories/staff.repository.impl.ts[0m:[93m2[0m:[93m17[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.845 
23:53:20.846 [7m2[0m import { Staff, Prisma } from '@prisma/client';
23:53:20.846 [7m [0m [91m                ~~~~~~[0m
23:53:20.846 [96msrc/modules/introduction/staff/infrastructure/repositories/staff.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'staff' does not exist on type 'PrismaService'.
23:53:20.846 
23:53:20.846 [7m16[0m         super(prisma.staff as unknown as any, 'sort_order:asc');
23:53:20.846 [7m  [0m [91m                     ~~~~~[0m
23:53:20.846 [96msrc/modules/introduction/staff/public/services/staff.service.ts[0m:[93m5[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Staff'.
23:53:20.846 
23:53:20.847 [7m5[0m import { Staff } from '@prisma/client';
23:53:20.847 [7m [0m [91m         ~~~~~[0m
23:53:20.847 [96msrc/modules/introduction/testimonial/admin/services/testimonial.service.ts[0m:[93m5[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Testimonial'.
23:53:20.847 
23:53:20.847 [7m5[0m import { Testimonial } from '@prisma/client';
23:53:20.847 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.847 [96msrc/modules/introduction/testimonial/domain/testimonial.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Testimonial'.
23:53:20.847 
23:53:20.848 [7m2[0m import { Testimonial } from '@prisma/client';
23:53:20.848 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.848 [96msrc/modules/introduction/testimonial/infrastructure/repositories/testimonial.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Testimonial'.
23:53:20.848 
23:53:20.848 [7m2[0m import { Testimonial, Prisma } from '@prisma/client';
23:53:20.848 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.848 [96msrc/modules/introduction/testimonial/infrastructure/repositories/testimonial.repository.impl.ts[0m:[93m2[0m:[93m23[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.848 
23:53:20.849 [7m2[0m import { Testimonial, Prisma } from '@prisma/client';
23:53:20.849 [7m [0m [91m                      ~~~~~~[0m
23:53:20.849 [96msrc/modules/introduction/testimonial/infrastructure/repositories/testimonial.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'testimonial' does not exist on type 'PrismaService'.
23:53:20.849 
23:53:20.849 [7m16[0m         super(prisma.testimonial as unknown as any, 'sort_order:asc');
23:53:20.849 [7m  [0m [91m                     ~~~~~~~~~~~[0m
23:53:20.849 [96msrc/modules/marketing/banner-location/admin/services/banner-location.service.ts[0m:[93m5[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'BannerLocation'.
23:53:20.849 
23:53:20.849 [7m5[0m import { BannerLocation } from '@prisma/client';
23:53:20.850 [7m [0m [91m         ~~~~~~~~~~~~~~[0m
23:53:20.850 [96msrc/modules/marketing/banner-location/domain/banner-location.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'BannerLocation'.
23:53:20.850 
23:53:20.850 [7m2[0m import { BannerLocation } from '@prisma/client';
23:53:20.850 [7m [0m [91m         ~~~~~~~~~~~~~~[0m
23:53:20.850 [96msrc/modules/marketing/banner-location/infrastructure/repositories/banner-location.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'BannerLocation'.
23:53:20.850 
23:53:20.850 [7m3[0m import { BannerLocation, Prisma } from '@prisma/client';
23:53:20.851 [7m [0m [91m         ~~~~~~~~~~~~~~[0m
23:53:20.851 [96msrc/modules/marketing/banner-location/infrastructure/repositories/banner-location.repository.impl.ts[0m:[93m3[0m:[93m26[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.851 
23:53:20.851 [7m3[0m import { BannerLocation, Prisma } from '@prisma/client';
23:53:20.851 [7m [0m [91m                         ~~~~~~[0m
23:53:20.851 [96msrc/modules/marketing/banner-location/infrastructure/repositories/banner-location.repository.impl.ts[0m:[93m17[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'bannerLocation' does not exist on type 'PrismaService'.
23:53:20.851 
23:53:20.852 [7m17[0m         super(prisma.bannerLocation as unknown as any);
23:53:20.852 [7m  [0m [91m                     ~~~~~~~~~~~~~~[0m
23:53:20.852 [96msrc/modules/marketing/banner/admin/services/banner.service.ts[0m:[93m5[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Banner'.
23:53:20.852 
23:53:20.852 [7m5[0m import { Banner } from '@prisma/client';
23:53:20.852 [7m [0m [91m         ~~~~~~[0m
23:53:20.852 [96msrc/modules/marketing/banner/domain/banner.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Banner'.
23:53:20.852 
23:53:20.853 [7m2[0m import { Banner } from '@prisma/client';
23:53:20.853 [7m [0m [91m         ~~~~~~[0m
23:53:20.854 [96msrc/modules/marketing/banner/infrastructure/repositories/banner.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Banner'.
23:53:20.854 
23:53:20.854 [7m3[0m import { Banner, Prisma } from '@prisma/client';
23:53:20.854 [7m [0m [91m         ~~~~~~[0m
23:53:20.855 [96msrc/modules/marketing/banner/infrastructure/repositories/banner.repository.impl.ts[0m:[93m3[0m:[93m18[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.858 
23:53:20.859 [7m3[0m import { Banner, Prisma } from '@prisma/client';
23:53:20.859 [7m [0m [91m                 ~~~~~~[0m
23:53:20.859 [96msrc/modules/marketing/banner/infrastructure/repositories/banner.repository.impl.ts[0m:[93m18[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'banner' does not exist on type 'PrismaService'.
23:53:20.859 
23:53:20.859 [7m18[0m         super(prisma.banner as unknown as any, 'sort_order:asc');
23:53:20.859 [7m  [0m [91m                     ~~~~~~[0m
23:53:20.859 [96msrc/modules/marketing/banner/public/services/banner.service.ts[0m:[93m6[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Banner'.
23:53:20.859 
23:53:20.859 [7m6[0m import { Banner } from '@prisma/client';
23:53:20.859 [7m [0m [91m         ~~~~~~[0m
23:53:20.859 [96msrc/modules/marketing/contact/admin/services/contact.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Contact'.
23:53:20.859 
23:53:20.859 [7m2[0m import { Contact } from '@prisma/client';
23:53:20.859 [7m [0m [91m         ~~~~~~~[0m
23:53:20.859 [96msrc/modules/marketing/contact/domain/contact.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Contact'.
23:53:20.859 
23:53:20.859 [7m2[0m import { Contact } from '@prisma/client';
23:53:20.859 [7m [0m [91m         ~~~~~~~[0m
23:53:20.859 [96msrc/modules/marketing/contact/infrastructure/repositories/contact.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Contact'.
23:53:20.859 
23:53:20.859 [7m2[0m import { Contact, Prisma } from '@prisma/client';
23:53:20.859 [7m [0m [91m         ~~~~~~~[0m
23:53:20.859 [96msrc/modules/marketing/contact/infrastructure/repositories/contact.repository.impl.ts[0m:[93m2[0m:[93m19[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.859 
23:53:20.860 [7m2[0m import { Contact, Prisma } from '@prisma/client';
23:53:20.860 [7m [0m [91m                  ~~~~~~[0m
23:53:20.860 [96msrc/modules/marketing/contact/infrastructure/repositories/contact.repository.impl.ts[0m:[93m16[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'contact' does not exist on type 'PrismaService'.
23:53:20.860 
23:53:20.860 [7m16[0m         super(prisma.contact as unknown as any, 'created_at:desc');
23:53:20.860 [7m  [0m [91m                     ~~~~~~~[0m
23:53:20.860 [96msrc/modules/post/comment/admin/services/comment.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostComment'.
23:53:20.860 
23:53:20.860 [7m2[0m import { PostComment } from '@prisma/client';
23:53:20.860 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.860 [96msrc/modules/post/comment/domain/post-comment.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostComment'.
23:53:20.860 
23:53:20.860 [7m2[0m import { PostComment } from '@prisma/client';
23:53:20.860 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.860 [96msrc/modules/post/comment/infrastructure/repositories/post-comment.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostComment'.
23:53:20.860 
23:53:20.860 [7m3[0m import { PostComment, Prisma } from '@prisma/client';
23:53:20.860 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.860 [96msrc/modules/post/comment/infrastructure/repositories/post-comment.repository.impl.ts[0m:[93m3[0m:[93m23[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.860 
23:53:20.860 [7m3[0m import { PostComment, Prisma } from '@prisma/client';
23:53:20.860 [7m [0m [91m                      ~~~~~~[0m
23:53:20.860 [96msrc/modules/post/comment/infrastructure/repositories/post-comment.repository.impl.ts[0m:[93m18[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'postComment' does not exist on type 'PrismaService'.
23:53:20.860 
23:53:20.860 [7m18[0m         super(prisma.postComment as unknown as any);
23:53:20.860 [7m  [0m [91m                     ~~~~~~~~~~~[0m
23:53:20.860 [96msrc/modules/post/comment/user/services/comments.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostComment'.
23:53:20.860 
23:53:20.860 [7m2[0m import { PostComment } from '@prisma/client';
23:53:20.860 [7m [0m [91m         ~~~~~~~~~~~[0m
23:53:20.861 [96msrc/modules/post/post-category/admin/services/post-category.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostCategory'.
23:53:20.861 
23:53:20.861 [7m2[0m import { PostCategory } from '@prisma/client';
23:53:20.861 [7m [0m [91m         ~~~~~~~~~~~~[0m
23:53:20.861 [96msrc/modules/post/post-category/domain/post-category.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostCategory'.
23:53:20.861 
23:53:20.861 [7m2[0m import { PostCategory } from '@prisma/client';
23:53:20.861 [7m [0m [91m         ~~~~~~~~~~~~[0m
23:53:20.861 [96msrc/modules/post/post-category/infrastructure/repositories/post-category.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostCategory'.
23:53:20.861 
23:53:20.861 [7m3[0m import { PostCategory, Prisma } from '@prisma/client';
23:53:20.861 [7m [0m [91m         ~~~~~~~~~~~~[0m
23:53:20.861 [96msrc/modules/post/post-category/infrastructure/repositories/post-category.repository.impl.ts[0m:[93m3[0m:[93m24[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.861 
23:53:20.861 [7m3[0m import { PostCategory, Prisma } from '@prisma/client';
23:53:20.861 [7m [0m [91m                       ~~~~~~[0m
23:53:20.861 [96msrc/modules/post/post-category/infrastructure/repositories/post-category.repository.impl.ts[0m:[93m17[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'postCategory' does not exist on type 'PrismaService'.
23:53:20.861 
23:53:20.861 [7m17[0m         super(prisma.postCategory as unknown as any);
23:53:20.861 [7m  [0m [91m                     ~~~~~~~~~~~~[0m
23:53:20.861 [96msrc/modules/post/post-category/public/services/post-category.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostCategory'.
23:53:20.861 
23:53:20.861 [7m2[0m import { PostCategory } from '@prisma/client';
23:53:20.861 [7m [0m [91m         ~~~~~~~~~~~~[0m
23:53:20.861 [96msrc/modules/post/post-tag/admin/services/post-tag.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostTag'.
23:53:20.861 
23:53:20.861 [7m2[0m import { PostTag } from '@prisma/client';
23:53:20.861 [7m [0m [91m         ~~~~~~~[0m
23:53:20.862 [96msrc/modules/post/post-tag/domain/post-tag.repository.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostTag'.
23:53:20.862 
23:53:20.862 [7m2[0m import { PostTag } from '@prisma/client';
23:53:20.862 [7m [0m [91m         ~~~~~~~[0m
23:53:20.862 [96msrc/modules/post/post-tag/infrastructure/repositories/post-tag.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostTag'.
23:53:20.862 
23:53:20.862 [7m3[0m import { PostTag, Prisma } from '@prisma/client';
23:53:20.862 [7m [0m [91m         ~~~~~~~[0m
23:53:20.862 [96msrc/modules/post/post-tag/infrastructure/repositories/post-tag.repository.impl.ts[0m:[93m3[0m:[93m19[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.862 
23:53:20.862 [7m3[0m import { PostTag, Prisma } from '@prisma/client';
23:53:20.862 [7m [0m [91m                  ~~~~~~[0m
23:53:20.862 [96msrc/modules/post/post-tag/infrastructure/repositories/post-tag.repository.impl.ts[0m:[93m17[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'postTag' does not exist on type 'PrismaService'.
23:53:20.863 
23:53:20.863 [7m17[0m         super(prisma.postTag as unknown as any);
23:53:20.863 [7m  [0m [91m                     ~~~~~~~[0m
23:53:20.863 [96msrc/modules/post/post-tag/public/services/post-tag.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostTag'.
23:53:20.863 
23:53:20.863 [7m2[0m import { PostTag } from '@prisma/client';
23:53:20.863 [7m [0m [91m         ~~~~~~~[0m
23:53:20.863 [96msrc/modules/post/post/admin/services/post-action.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Post'.
23:53:20.863 
23:53:20.863 [7m2[0m import { Post } from '@prisma/client';
23:53:20.863 [7m [0m [91m         ~~~~[0m
23:53:20.863 [96msrc/modules/post/post/admin/services/post.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Post'.
23:53:20.864 
23:53:20.864 [7m2[0m import { Post } from '@prisma/client';
23:53:20.864 [7m [0m [91m         ~~~~[0m
23:53:20.864 [96msrc/modules/post/post/domain/post.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Post'.
23:53:20.864 
23:53:20.864 [7m1[0m import { Post } from '@prisma/client';
23:53:20.864 [7m [0m [91m         ~~~~[0m
23:53:20.864 [96msrc/modules/post/post/infrastructure/repositories/post.repository.impl.ts[0m:[93m3[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Post'.
23:53:20.864 
23:53:20.864 [7m3[0m import { Post, Prisma } from '@prisma/client';
23:53:20.864 [7m [0m [91m         ~~~~[0m
23:53:20.864 [96msrc/modules/post/post/infrastructure/repositories/post.repository.impl.ts[0m:[93m3[0m:[93m16[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.864 
23:53:20.865 [7m3[0m import { Post, Prisma } from '@prisma/client';
23:53:20.865 [7m [0m [91m               ~~~~~~[0m
23:53:20.865 [96msrc/modules/post/post/infrastructure/repositories/post.repository.impl.ts[0m:[93m24[0m:[93m22[0m - [91merror[0m[90m TS2339: [0mProperty 'post' does not exist on type 'PrismaService'.
23:53:20.865 
23:53:20.865 [7m24[0m         super(prisma.post as unknown as any);
23:53:20.865 [7m  [0m [91m                     ~~~~[0m
23:53:20.865 [96msrc/modules/post/post/infrastructure/repositories/post.repository.impl.ts[0m:[93m163[0m:[93m31[0m - [91merror[0m[90m TS2339: [0mProperty 'postPosttag' does not exist on type 'PrismaService'.
23:53:20.865 
23:53:20.865 [7m163[0m             await this.prisma.postPosttag.deleteMany({ where: { post_id: id } });
23:53:20.865 [7m   [0m [91m                              ~~~~~~~~~~~[0m
23:53:20.865 [96msrc/modules/post/post/infrastructure/repositories/post.repository.impl.ts[0m:[93m165[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'postPosttag' does not exist on type 'PrismaService'.
23:53:20.865 
23:53:20.865 [7m165[0m                 await this.prisma.postPosttag.createMany({
23:53:20.866 [7m   [0m [91m                                  ~~~~~~~~~~~[0m
23:53:20.866 [96msrc/modules/post/post/infrastructure/repositories/post.repository.impl.ts[0m:[93m173[0m:[93m31[0m - [91merror[0m[90m TS2339: [0mProperty 'postPostcategory' does not exist on type 'PrismaService'.
23:53:20.866 
23:53:20.866 [7m173[0m             await this.prisma.postPostcategory.deleteMany({ where: { post_id: id } });
23:53:20.866 [7m   [0m [91m                              ~~~~~~~~~~~~~~~~[0m
23:53:20.866 [96msrc/modules/post/post/infrastructure/repositories/post.repository.impl.ts[0m:[93m175[0m:[93m35[0m - [91merror[0m[90m TS2339: [0mProperty 'postPostcategory' does not exist on type 'PrismaService'.
23:53:20.866 
23:53:20.866 [7m175[0m                 await this.prisma.postPostcategory.createMany({
23:53:20.866 [7m   [0m [91m                                  ~~~~~~~~~~~~~~~~[0m
23:53:20.866 [96msrc/modules/post/post/public/services/post.service.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Post'.
23:53:20.866 
23:53:20.867 [7m2[0m import { Post } from '@prisma/client';
23:53:20.867 [7m [0m [91m         ~~~~[0m
23:53:20.867 [96msrc/modules/post/stats/domain/post-stats.repository.ts[0m:[93m1[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostStats'.
23:53:20.867 
23:53:20.867 [7m1[0m import { PostStats } from '@prisma/client';
23:53:20.867 [7m [0m [91m         ~~~~~~~~~[0m
23:53:20.867 [96msrc/modules/post/stats/infrastructure/repositories/post-stats.repository.impl.ts[0m:[93m2[0m:[93m10[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'PostStats'.
23:53:20.867 
23:53:20.867 [7m2[0m import { PostStats, Prisma } from '@prisma/client';
23:53:20.867 [7m [0m [91m         ~~~~~~~~~[0m
23:53:20.867 [96msrc/modules/post/stats/infrastructure/repositories/post-stats.repository.impl.ts[0m:[93m2[0m:[93m21[0m - [91merror[0m[90m TS2305: [0mModule '"@prisma/client"' has no exported member 'Prisma'.
23:53:20.867 
23:53:20.867 [7m2[0m import { PostStats, Prisma } from '@prisma/client';
23:53:20.868 [7m [0m [91m                    ~~~~~~[0m
23:53:20.868 
23:53:20.868 Error: Command "npm run build" exited with 1
23:53:20.895 Found 462 error(s).
23:53:20.895 