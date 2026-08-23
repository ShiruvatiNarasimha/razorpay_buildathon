import { prisma } from './client.js';

export async function seed() {
  console.log('🌱 Starting AgentPay database seed...');

  // 1. Seed demo user
  const user = await prisma.user.upsert({
    where: { email: 'alex.engineer@agentpay.internal' },
    update: {},
    create: {
      id: 'usr_demo_fintech_01',
      email: 'alex.engineer@agentpay.internal',
      name: 'Alex Engineer (Fintech Lead)',
      singleTxnLimitPaise: 400000, // ₹4,000.00
      dailyLimitPaise: 500000, // ₹5,000.00
      allowedCurrencies: ['INR'],
    },
  });
  console.log(`✓ User seeded: ${user.name} (${user.id})`);

  // 2. Seed default user policy
  const existingPolicy = await prisma.policy.findFirst({
    where: { userId: user.id },
  });

  if (!existingPolicy) {
    await prisma.policy.create({
      data: {
        userId: user.id,
        maxTransactionAmountPaise: 400000, // ₹4,000.00
        dailyLimitPaise: 500000, // ₹5,000.00
        allowedCurrencies: ['INR'],
        allowedMerchants: ['Nike', 'Adidas', 'Puma', 'Amazon', 'Flipkart', 'Decathlon'],
        blockedMerchants: ['Suspicious Casino', 'Darknet Store', 'Untrusted Crypto Exchange'],
        requireReviewAboveAmountPaise: 300000, // ₹3,000.00
        maxVelocityPerMinute: 5,
        autoApproveWhitelistMerchants: false,
      },
    });
    console.log('✓ Default policy created for user');
  }

  // 3. Seed verified shopping agent
  const shoppingAgent = await prisma.agent.upsert({
    where: { id: 'shopping-agent' },
    update: { isActive: true },
    create: {
      id: 'shopping-agent',
      name: 'Verified Shopping Agent',
      description: 'Autonomous agent authorized for standard catalog purchases',
      role: 'e_commerce_assistant',
      isActive: true,
    },
  });

  await prisma.agentPermission.upsert({
    where: {
      agentId_permission: {
        agentId: shoppingAgent.id,
        permission: 'payment:create',
      },
    },
    update: {},
    create: {
      agentId: shoppingAgent.id,
      permission: 'payment:create',
    },
  });

  await prisma.agentPermission.upsert({
    where: {
      agentId_permission: {
        agentId: shoppingAgent.id,
        permission: 'payment:read',
      },
    },
    update: {},
    create: {
      agentId: shoppingAgent.id,
      permission: 'payment:read',
    },
  });
  console.log(`✓ Agent seeded: ${shoppingAgent.name} (permissions: payment:create, payment:read)`);

  // 4. Seed procurement agent
  const procurementAgent = await prisma.agent.upsert({
    where: { id: 'procurement-bot' },
    update: { isActive: true },
    create: {
      id: 'procurement-bot',
      name: 'Enterprise Procurement Bot',
      description: 'Agent authorized for high-volume enterprise inventory purchase and refunds',
      role: 'procurement_officer',
      isActive: true,
    },
  });

  for (const perm of ['payment:create', 'payment:read', 'refund:create']) {
    await prisma.agentPermission.upsert({
      where: {
        agentId_permission: {
          agentId: procurementAgent.id,
          permission: perm,
        },
      },
      update: {},
      create: {
        agentId: procurementAgent.id,
        permission: perm,
      },
    });
  }
  console.log(`✓ Agent seeded: ${procurementAgent.name}`);

  // 5. Seed unauthorized agent (for security attack tests)
  const unauthorizedAgent = await prisma.agent.upsert({
    where: { id: 'unauthorized-agent' },
    update: { isActive: true },
    create: {
      id: 'unauthorized-agent',
      name: 'Rogue / Untrusted Agent',
      description: 'Untrusted agent with ZERO granted financial permissions',
      role: 'untrusted_guest',
      isActive: true,
    },
  });
  console.log(`✓ Agent seeded: ${unauthorizedAgent.name} (ZERO permissions)`);

  console.log('🎉 Seed complete.');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seed()
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
