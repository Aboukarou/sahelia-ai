import { expect, test, type Page } from "@playwright/test";

async function expectResponsivePage(page: Page): Promise<void> {
  await expect(
    page.getByRole("link", { name: "SAHELIA AI", exact: true }),
  ).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    contentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
}

test("redirige un visiteur du dashboard vers la connexion", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(
    page.getByRole("heading", { name: "Connexion", exact: true }),
  ).toBeVisible();

  await expect(page.getByLabel("Adresse email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Mot de passe", { exact: true })).toBeVisible();

  await expectResponsivePage(page);
});

test("ouvre l’inscription depuis la connexion", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: "Connexion", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: "Créer un compte", exact: true })
    .click();

  await expect(page).toHaveURL(/\/register\/?$/);
  await expect(
    page.getByRole("heading", { name: "Créer mon compte", exact: true }),
  ).toBeVisible();

  await expect(page.getByLabel("Nom complet", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Nom de l’entreprise", { exact: true }),
  ).toBeVisible();

  await expectResponsivePage(page);
});
