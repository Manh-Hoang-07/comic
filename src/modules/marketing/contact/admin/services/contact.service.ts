import { Injectable, Inject } from '@nestjs/common';
import { Contact } from '@prisma/client';
import { IContactRepository, CONTACT_REPOSITORY } from '@/modules/marketing/contact/domain/contact.repository';
import { ContactStatus } from '@/shared/enums/types/contact-status.enum';
import { BaseService } from '@/common/core/services';
import { getCurrentUserId } from '@/common/auth/utils/auth-context.helper';

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

  async replyToContact(id: number | bigint, reply: string) {
    const userId = getCurrentUserId();
    const data = {
      reply,
      status: ContactStatus.Replied as any,
      replied_at: new Date(),
      replied_by: userId ? BigInt(userId) : null,
    };
    return this.update(id, data);
  }

  async markAsRead(id: number | bigint) {
    const contact = await this.getOne(id);
    if (contact && (contact as any).status === ContactStatus.Pending) {
      return this.update(id, { status: ContactStatus.Read as any });
    }
    return contact;
  }

  async closeContact(id: number | bigint) {
    return this.update(id, { status: ContactStatus.Closed as any });
  }

  // ── Transformation ─────────────────────────────────────────────────────────

  protected override transform(contact: any) {
    return this.deepConvertBigInt(contact);
  }
}
