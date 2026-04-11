
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Fixing Role-Context relations...');
  
  // Di chuyển Role 78 (Group Owner) từ Context 1 (System) sang Context 2 (Group)
  const roleId = 78n;
  const oldContextId = 1n;
  const newContextId = 2n;

  // Xóa quan hệ cũ nếu tồn tại
  await prisma.roleContext.deleteMany({
    where: {
      role_id: roleId,
      context_id: oldContextId
    }
  });

  // Tạo quan hệ mới (upsert để đảm bảo không lỗi nếu đã tồn tại)
  await prisma.roleContext.upsert({
    where: {
      role_id_context_id: {
        role_id: roleId,
        context_id: newContextId
      }
    },
    create: {
      role_id: roleId,
      context_id: newContextId
    },
    update: {}
  });

  console.log('Done mapping Role 78 (Group Owner) to Context 2 (Group).');
}

main().catch(console.error).finally(() => prisma.$disconnect());
