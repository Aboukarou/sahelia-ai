import { expect, test } from "@playwright/test";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";

const executeFile = promisify(execFile);

test("valide le formulaire et inscrit le propriétaire depuis le navigateur", async ({
  page,
}) => {
  const runId = randomUUID();
  const email = `e2e.browser.${runId}@example.com`;
  const password = `Sahelia-${randomUUID()}`;
  const name = "Propriétaire inscription";
  const businessName = `E2E navigateur ${runId}`;

  try {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", {
        name: "Créer mon compte",
        exact: true,
      }),
    ).toBeVisible();

    await page.getByLabel("Nom complet", { exact: true }).fill(name);
    await page
      .getByLabel("Nom de l’entreprise", { exact: true })
      .fill(businessName);
    await page.getByLabel("Adresse email", { exact: true }).fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page
      .getByLabel("Confirmer le mot de passe", { exact: true })
      .fill(`${password}-different`);

    const submit = page.getByRole("button", {
      name: "Créer mon compte",
      exact: true,
    });

    await submit.click();

    const passwordMismatch = page.getByRole("alert").filter({
      hasText: "Les deux mots de passe doivent être identiques.",
    });

    await expect(passwordMismatch).toHaveCount(1);
    await expect(passwordMismatch).toHaveText(
      "Les deux mots de passe doivent être identiques.",
    );
    await expect(page).toHaveURL(/\/register$/);

    await expect(page.getByLabel("Nom complet", { exact: true })).toHaveValue(
      name,
    );
    await expect(page.getByLabel("Adresse email", { exact: true })).toHaveValue(
      email,
    );

    await page
      .getByLabel("Confirmer le mot de passe", { exact: true })
      .fill(password);

    const registrationResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url() === "http://localhost:5100/api/auth/register",
    );

    await submit.click();

    expect((await registrationResponse).status()).toBe(201);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", {
        name: `Bonjour, ${name}.`,
        exact: true,
      }),
    ).toBeVisible();

    const members = page
      .getByRole("region", {
        name: "Membres de l’entreprise",
        exact: true,
      })
      .getByRole("list", {
        name: "Liste des membres",
        exact: true,
      });

    await expect(members.getByRole("listitem")).toHaveCount(1);
    await expect(members.getByText(name, { exact: true })).toBeVisible();
    await expect(members.getByText(email, { exact: true })).toBeVisible();
    await expect(
      members.getByText("Propriétaire", { exact: true }),
    ).toBeVisible();

    const sessions = page
      .getByRole("region", {
        name: "Mes sessions",
        exact: true,
      })
      .getByRole("list", {
        name: "Sessions actives du compte",
        exact: true,
      });

    await expect(sessions.getByRole("listitem")).toHaveCount(1);
    await expect(
      sessions.getByText("Cet appareil", { exact: true }),
    ).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", {
        name: `Bonjour, ${name}.`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(members.getByRole("listitem")).toHaveCount(1);
    await expect(sessions.getByRole("listitem")).toHaveCount(1);

    await page
      .getByRole("button", {
        name: "Se déconnecter",
        exact: true,
      })
      .click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", {
        name: "Connexion",
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    await executeFile(
      process.execPath,
      [
        path.resolve(process.cwd(), "../api/test/cleanup-browser-account.cjs"),
        email,
      ],
      { timeout: 30_000 },
    );
  }
});
