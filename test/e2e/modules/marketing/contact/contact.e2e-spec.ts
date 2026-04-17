import request from 'supertest';
import { TestHelper } from '../../../../test-helper';

describe('Contact E2E', () => {
  let helper: TestHelper;
  let adminToken: string;

  beforeAll(async () => {
    helper = new TestHelper();
    await helper.init();
    await helper.clearDatabase();
    await helper.seedBasicData();

    // Admin login
    const loginRes = await request(helper.getApp().getHttpServer())
      .post('/api/login')
      .send({
        email: 'systemadmin@example.com',
        password: '12345678',
      });
    adminToken = loginRes.body.data.token;
  }, 60000);

  afterAll(async () => {
    await helper.close();
  });

  describe('Public Contact API', () => {
    it('should create a contact request', async () => {
      const response = await request(helper.getApp().getHttpServer())
        .post('/api/public/contacts')
        .send({
          name: 'E2E Tester',
          email: 'e2e@example.com',
          phone: '0987654321',
          message: 'Integration test message',
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('E2E Tester');
    });
  });

  describe('Admin Contact API', () => {
    let contactId: number;

    beforeAll(async () => {
      // Ensure we have a contact to work with
      const prisma = helper.getPrisma();
      const contact = await prisma.contact.create({
        data: {
          name: 'Admin Test',
          email: 'admin-test@example.com',
          phone: '0000000000',
          message: 'Test message',
          status: 'pending',
        },
      });
      contactId = Number(contact.id);
    });

    it('should fetch list of contacts for admin', async () => {
      const response = await request(helper.getApp().getHttpServer())
        .get('/api/admin/contacts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should mark contact as read', async () => {
      await request(helper.getApp().getHttpServer())
        .put(`/api/admin/contacts/${contactId}/read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const prisma = helper.getPrisma();
      const updated = await prisma.contact.findUnique({
        where: { id: BigInt(contactId) },
      });
      expect(updated?.status).toBe('read');
    });
  });
});
