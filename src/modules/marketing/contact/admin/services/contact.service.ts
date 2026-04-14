import { Injectable, Inject } from '@nestjs/common';
import { Contact } from '@prisma/client';
import {
  IContactRepository,
  CONTACT_REPOSITORY,
} from '@/modules/marketing/contact/domain/contact.repository';
import { ContactStatus } from '@/shared/enums/types/contact-status.enum';
import { BaseService } from '@/common/core/services';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';
import { toPrimaryKey } from '@/common/core/repositories/prisma-query.helper';

@Injectable()
export class ContactService extends BaseService<Contact, IContactRepository> {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepo: IContactRepository,
  ) {
    super(contactRepo);
  }

  async getSimpleList(query: any) {
    return this.getList({
      ...query,
      limit: query.limit ?? 50,
    });
  }

  // ── Operations ─────────────────────────────────────────────────────────────

  async replyToContact(id: any, reply: string) {
    const userId = getCurrentUserId();
    const data = {
      reply,
      status: ContactStatus.Replied as any,
      replied_at: new Date(),
      replied_by: userId ? toPrimaryKey(userId) : null,
    };
    return this.update(id, data);
  }

  async markAsRead(id: any) {
    const contact = await this.getOne(id);
    if (contact && (contact as any).status === ContactStatus.Pending) {
      return this.update(id, { status: ContactStatus.Read as any });
    }
    return contact;
  }

  async closeContact(id: any) {
    return this.update(id, { status: ContactStatus.Closed as any });
  }

  // ── Transformation ─────────────────────────────────────────────────────────
}
