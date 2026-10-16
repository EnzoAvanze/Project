import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("acessibilidade automatizada: boas-vindas, início e formulário de dor", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  let result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole("button", { name: "Explorar demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: /Olá, Gerson/ }),
  ).toBeVisible();
  result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Registro de dores", exact: true })
    .click();
  await page.getByLabel("Região do corpo").selectOption("Cabeça");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
