import { expect, test, type Page } from "@playwright/test";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";

const executeFile = promisify(execFile);
const apiUrl = "http://localhost:5100/api";

async function expectDashboard(page: Page, name: string): Promise<void> {
  await expect(page).toHaveURL(/\/dashboard\/?$/);

  await expect(
    page.getByRole("heading", {
      name: `Bonjour, ${name}.`,
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "SAHELIA AI", exact: true }),
  ).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    contentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
}

test("connecte le propriétaire, restaure son dashboard et le déconnecte", async ({
  page,
  request,
}) => {
  const runId = randomUUID();
  const email = `e2e.browser.${runId}@example.com`;
  const password = randomUUID();
  const name = "Propriétaire navigateur";
  const businessName = `E2E navigateur ${runId}`;

  try {
    const registration = await request.post(`${apiUrl}/auth/register`, {
      data: {
        email,
        password,
        name,
        businessName,
      },
    });

    expect(registration.status()).toBe(201);

    // Ferme la session créée par l’inscription API.
    // La connexion dans le navigateur créera sa propre session.
    const initialLogout = await request.post(`${apiUrl}/auth/logout`);
    expect(initialLogout.status()).toBe(204);

    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Connexion", exact: true }),
    ).toBeVisible();

    await page.getByLabel("Adresse email", { exact: true }).fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Me connecter", exact: true })
      .click();

    await expectDashboard(page, name);

    const members = page.getByRole("region", {
      name: "Membres de l’entreprise",
      exact: true,
    });
    const memberList = members.getByRole("list", {
      name: "Liste des membres",
      exact: true,
    });

    await expect(memberList.getByRole("listitem")).toHaveCount(1);
    await expect(memberList.getByText(name, { exact: true })).toBeVisible();
    await expect(memberList.getByText(email, { exact: true })).toBeVisible();
    await expect(
      memberList.getByText("Propriétaire", { exact: true }),
    ).toBeVisible();

    await expect(
      members.getByRole("button", {
        name: "Afficher la page précédente des membres",
        exact: true,
      }),
    ).toBeDisabled();

    await expect(
      members.getByRole("button", {
        name: "Afficher la page suivante des membres",
        exact: true,
      }),
    ).toBeDisabled();

    const sessions = page.getByRole("region", {
      name: "Mes sessions",
      exact: true,
    });
    const sessionList = sessions.getByRole("list", {
      name: "Sessions actives du compte",
      exact: true,
    });

    await expect(sessionList.getByRole("listitem")).toHaveCount(1);
    await expect(
      sessionList.getByText("Cet appareil", { exact: true }),
    ).toBeVisible();

    await expect(
      sessionList.getByRole("button", {
        name: /^Déconnecter la session /,
      }),
    ).toHaveCount(0);

    await expectNoHorizontalOverflow(page);

    // Le rechargement perd l’access token en mémoire :
    // le cookie doit permettre de restaurer la session.
    await page.reload();

    await expectDashboard(page, name);
    await expect(memberList.getByRole("listitem")).toHaveCount(1);
    await expect(sessionList.getByRole("listitem")).toHaveCount(1);
    await expect(
      sessionList.getByText("Cet appareil", { exact: true }),
    ).toBeVisible();

    await expectNoHorizontalOverflow(page);

    await page
      .getByRole("button", { name: "Se déconnecter", exact: true })
      .click();

    await expect(page).toHaveURL(/\/login\/?$/);
    await expect(
      page.getByRole("heading", { name: "Connexion", exact: true }),
    ).toBeVisible();

    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login\/?$/);
    await expect(
      page.getByRole("heading", { name: "Connexion", exact: true }),
    ).toBeVisible();
  } finally {
    const cleanupScript = path.resolve(
      process.cwd(),
      "../api/test/cleanup-browser-account.cjs",
    );

    await executeFile(process.execPath, [cleanupScript, email], {
      timeout: 30_000,
    });
  }
});
