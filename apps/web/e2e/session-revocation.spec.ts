import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";

const executeFile = promisify(execFile);
const apiUrl = "http://localhost:5100/api";

async function login(
  page: Page,
  email: string,
  password: string,
  name: string,
): Promise<void> {
  await page.goto("http://localhost:3100/login");

  await expect(
    page.getByRole("heading", { name: "Connexion", exact: true }),
  ).toBeVisible();

  await page.getByLabel("Adresse email", { exact: true }).fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Me connecter", exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(
    page.getByRole("heading", {
      name: `Bonjour, ${name}.`,
      exact: true,
    }),
  ).toBeVisible();
}

test("révoque une autre session sans fermer la session courante", async ({
  page,
  browser,
  request,
}) => {
  const runId = randomUUID();
  const email = `e2e.browser.${runId}@example.com`;
  const password = randomUUID();
  const name = "Propriétaire sessions";
  let otherContext: BrowserContext | undefined;

  try {
    const registration = await request.post(`${apiUrl}/auth/register`, {
      data: {
        email,
        password,
        name,
        businessName: `E2E navigateur ${runId}`,
      },
    });

    expect(registration.status()).toBe(201);
    expect((await request.post(`${apiUrl}/auth/logout`)).status()).toBe(204);

    await login(page, email, password, name);

    otherContext = await browser.newContext({
      viewport: page.viewportSize() ?? { width: 1440, height: 900 },
      locale: "fr-FR",
      timezoneId: "Africa/Ndjamena",
    });

    const otherPage = await otherContext.newPage();
    await login(otherPage, email, password, name);

    // Recharge la première fenêtre pour afficher les deux sessions.
    await page.reload();

    const sessions = page.getByRole("region", {
      name: "Mes sessions",
      exact: true,
    });
    const list = sessions.getByRole("list", {
      name: "Sessions actives du compte",
      exact: true,
    });
    const revokeButton = list.getByRole("button", {
      name: /^Déconnecter la session /,
    });

    await expect(list.getByRole("listitem")).toHaveCount(2);
    await expect(list.getByText("Cet appareil", { exact: true })).toHaveCount(
      1,
    );
    await expect(revokeButton).toHaveCount(1);

    // Annuler doit conserver les deux sessions.
    const cancelledDialogPromise = page.waitForEvent("dialog");
    const cancelledClickPromise = revokeButton.click();
    const cancelledDialog = await cancelledDialogPromise;

    expect(cancelledDialog.type()).toBe("confirm");
    expect(cancelledDialog.message()).toMatch(/^Déconnecter la session « /);

    await cancelledDialog.dismiss();
    await cancelledClickPromise;

    await sessions
      .getByRole("button", { name: "Actualiser", exact: true })
      .click();

    await expect(list.getByRole("listitem")).toHaveCount(2);

    await otherPage.reload();
    await expect(otherPage).toHaveURL(/\/dashboard\/?$/);
    await expect(
      otherPage.getByRole("heading", {
        name: `Bonjour, ${name}.`,
        exact: true,
      }),
    ).toBeVisible();

    // Confirmer doit révoquer uniquement la seconde session.
    const responsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().startsWith(`${apiUrl}/auth/sessions/`),
    );
    const confirmedDialogPromise = page.waitForEvent("dialog");
    const confirmedClickPromise = revokeButton.click();
    const confirmedDialog = await confirmedDialogPromise;

    expect(confirmedDialog.type()).toBe("confirm");
    await confirmedDialog.accept();
    await confirmedClickPromise;

    expect((await responsePromise).status()).toBe(204);

    await expect(
      sessions.getByText("La session a été déconnectée.", { exact: true }),
    ).toBeVisible();
    await expect(list.getByRole("listitem")).toHaveCount(1);
    await expect(revokeButton).toHaveCount(0);
    await expect(list.getByText("Cet appareil", { exact: true })).toBeVisible();

    // La fenêtre révoquée ne doit plus restaurer sa session.
    await otherPage.reload();

    await expect(otherPage).toHaveURL(/\/login\/?$/);
    await expect(
      otherPage.getByRole("heading", { name: "Connexion", exact: true }),
    ).toBeVisible();

    // La première fenêtre doit conserver son accès après rechargement.
    await page.reload();

    await expect(page).toHaveURL(/\/dashboard\/?$/);
    await expect(
      page.getByRole("heading", {
        name: `Bonjour, ${name}.`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(list.getByRole("listitem")).toHaveCount(1);
    await expect(list.getByText("Cet appareil", { exact: true })).toBeVisible();
  } finally {
    try {
      await otherContext?.close();
    } finally {
      const cleanupScript = path.resolve(
        process.cwd(),
        "../api/test/cleanup-browser-account.cjs",
      );

      await executeFile(process.execPath, [cleanupScript, email], {
        timeout: 30_000,
      });
    }
  }
});
