import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { Permission } from '@/common/auth/decorators';
import { Auth } from '@/common/auth/utils';
import { MenuService } from '@/modules/system/menu/admin/services/menu.service';
import { CreateMenuDto } from '@/modules/system/menu/admin/dtos/create-menu.dto';
import { UpdateMenuDto } from '@/modules/system/menu/admin/dtos/update-menu.dto';
import { QueryMenuDto } from '@/modules/system/menu/admin/dtos/query-menu.dto';
import { LogRequest } from '@/common/shared/decorators';

@Controller('admin/menus')
export class AdminMenuController {
  constructor(private readonly service: MenuService) {}

  @Permission('menu.manage')
  @Get()
  async getList(@Query(ValidationPipe) query: QueryMenuDto) {
    return this.service.getList(query);
  }

  @Permission('menu.manage')
  @Get('simple')
  async getSimpleList(@Query(ValidationPipe) query: QueryMenuDto) {
    return this.service.getSimpleList(query);
  }

  @Permission('menu.manage')
  @Get('tree')
  async getTree() {
    return this.service.getTree();
  }

  @Permission('menu.manage')
  @Get(':id')
  async getOne(@Param('id') id: any) {
    return this.service.getOne(id);
  }

  @LogRequest()
  @Permission('menu.manage')
  @Post()
  async create(@Body() dto: CreateMenuDto) {
    const userId = Auth.id();
    return this.service.createWithUser(dto, userId ?? undefined);
  }

  @LogRequest()
  @Permission('menu.manage')
  @Put(':id')
  async update(@Param('id') id: any, @Body() dto: UpdateMenuDto) {
    const userId = Auth.id();
    return this.service.updateById(id, dto, userId ?? undefined);
  }

  @LogRequest()
  @Permission('menu.manage')
  @Delete(':id')
  async delete(@Param('id') id: any) {
    return this.service.delete(id);
  }
}
