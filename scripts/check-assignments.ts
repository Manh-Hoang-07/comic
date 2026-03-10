
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    const userId = 7n;

    console.log('--- User Assignments ---');
    const assignments = await prisma.userRoleAssignment.findMany({
        where: { user_id: userId },
        include: {
            role: true,
            group: {
                include: {
                    context: true
                }
            }
        }
    });

    console.log(JSON.stringify(assignments, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value, 2));

    process.exit(0);
}

main();
