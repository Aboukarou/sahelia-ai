require("./setup-e2e.cjs");

const { PrismaClient } = require("@sahelia/database");

const email = process.argv[2];
const match = /^e2e\.browser\.([0-9a-f-]{36})@example\.com$/.exec(email ?? "");

if (!match) {
  throw new Error(
    "Seule une adresse dédiée aux tests navigateur est autorisée.",
  );
}

const expectedBusinessName = `E2E navigateur ${match[1]}`;
const prisma = new PrismaClient();

async function cleanup() {
  try {
    const databases = await prisma.$queryRaw`
      SELECT current_database() AS name
    `;

    if (databases[0]?.name !== "sahelia_ai_test") {
      throw new Error("Le nettoyage exige la base sahelia_ai_test.");
    }

    await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { email },
        select: {
          id: true,
          memberships: {
            select: {
              business: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!user) return;

      if (
        user.memberships.some(
          (membership) => membership.business.name !== expectedBusinessName,
        )
      ) {
        throw new Error("Entreprise inattendue : nettoyage interrompu.");
      }

      const businessIds = user.memberships.map(
        (membership) => membership.business.id,
      );

      const foreignMemberships = await transaction.membership.count({
        where: {
          businessId: { in: businessIds },
          userId: { not: user.id },
        },
      });

      if (foreignMemberships !== 0) {
        throw new Error("Autres membres présents : nettoyage interrompu.");
      }

      await transaction.auditLog.deleteMany({
        where: {
          OR: [{ actorId: user.id }, { businessId: { in: businessIds } }],
        },
      });

      await transaction.refreshSession.deleteMany({
        where: { userId: user.id },
      });

      await transaction.membership.deleteMany({
        where: { userId: user.id },
      });

      await transaction.user.delete({
        where: { id: user.id },
      });

      await transaction.business.deleteMany({
        where: { id: { in: businessIds } },
      });
    });
  } finally {
    await prisma.$disconnect();
  }
}

cleanup().catch(() => {
  console.error(
    "Nettoyage du compte navigateur échoué. Vérifiez la connexion et les données de test.",
  );
  process.exitCode = 1;
});
