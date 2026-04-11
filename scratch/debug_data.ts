
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.group.findMany({
    where: { id: { in: [29, 30] } },
    select: { id: true, name: true, context_id: true, context: { select: { id: true, name: true, type: true, code: true } } }
  });
  console.log('Groups:', JSON.stringify(groups, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  const roleContexts = await prisma.roleContext.findMany({
    select: { role_id: true, context_id: true, role: { select: { name: true } } }
  });
  console.log('RoleContexts:', JSON.stringify(roleContexts, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

  const assignments = await prisma.userRoleAssignment.findMany({
    where: { group_id: { in: [29, 30] } },
    select: { user_id: true, group_id: true, role_id: true }
  });
  console.log('Assignments:', JSON.stringify(assignments, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
