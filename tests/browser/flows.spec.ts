import { test, expect } from "@playwright/test";
async function demo(page: any) {
  await page.goto("/");
  await page.getByRole("button", { name: "Explorar demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: /Olá, Gerson/ }),
  ).toBeVisible();
}
async function nav(page: any, name: string) {
  await page
    .locator(".sidebar")
    .getByRole("button", { name, exact: true })
    .click();
}
test("fluxo completo: dose, consulta, dor e recebimento do SOS pelo cuidador", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await demo(page);
  await page.screenshot({
    path: "docs/screenshots/desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await nav(page, "Medicamentos");
  await page
    .getByRole("button", { name: "Adicionar medicamento", exact: true })
    .click();
  await page.getByLabel("Nome do medicamento").fill("Medicamento de teste");
  await page.getByLabel("Dosagem prescrita").fill("10 mg");
  await page.getByLabel("Horário", { exact: true }).fill("09:30");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(
    page.getByRole("heading", { name: "Medicamento de teste", exact: true }),
  ).toBeVisible();
  const med = page
    .locator(".medication-card")
    .filter({
      has: page.getByRole("heading", {
        name: "Medicamento de teste",
        exact: true,
      }),
    });
  await med.getByRole("button", { name: "Registrar dose de hoje" }).click();
  await page.getByRole("button", { name: "Sim, já tomei" }).click();
  await expect(med.getByText("Tomado", { exact: true })).toBeVisible();
  await page.reload();
  await nav(page, "Medicamentos");
  await expect(
    page
      .locator(".medication-card")
      .filter({
        has: page.getByRole("heading", {
          name: "Medicamento de teste",
          exact: true,
        }),
      })
      .getByText("Tomado", { exact: true }),
  ).toBeVisible();
  await nav(page, "Consultas");
  await page.getByRole("button", { name: "Agendar consulta" }).click();
  await page.getByLabel("Nome do profissional").fill("Dr. Teste");
  await page.getByLabel("Especialidade").fill("Clínica geral");
  await page.getByLabel("Clínica e endereço").fill("Clínica Central");
  await page.getByRole("button", { name: "Salvar cadastro" }).click();
  await expect(
    page.getByRole("heading", { name: "Dr. Teste", exact: true }),
  ).toBeVisible();
  await nav(page, "Registro de dores");
  await page.getByLabel("Região do corpo").selectOption("Joelho esquerdo");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Forte", exact: true }).click();
  await page.getByRole("button", { name: "Enviar para o cuidador" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu relato foi registrado" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar para meu dia" }).click();
  await page.locator(".sidebar-sos").click();
  await page
    .getByRole("button", { name: "Pedir ajuda SOS — abrir confirmação" })
    .click();
  await page.getByRole("button", { name: "Sim, preciso de ajuda" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu pedido foi registrado" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver como cuidador" }).click();
  await expect(
    page.getByRole("heading", { name: /Cuidando de Gerson/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver pedido", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar recebimento" }).click();
  await expect(page.getByText("Visualizado", { exact: true })).toBeVisible();
});
test("celular: navegação, texto ampliado, assistente e ausência de rolagem horizontal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({
    path: "docs/screenshots/boas-vindas-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await demo(page);
  await page.screenshot({
    path: "docs/screenshots/mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Aumentar tamanho do texto" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Assistente" })
    .click();
  await page
    .getByRole("button", { name: "Meus remédios", exact: true })
    .click();
  await expect(page.locator(".chat-message.assistant")).toContainText(
    "Losartana",
  );
  await page.getByRole("button", { name: "Aumentar tamanho do texto" }).click();
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "Registro de dores", exact: true })
    .click();
  await page.getByLabel("Região do corpo").selectOption("Cabeça");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Conte mais sobre a dor" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("relógio: ações offline, reenvio único, confirmação compartilhada e formatos", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1100, height: 1000 });
  await demo(page);
  await page.goto("/relogio");
  await expect(
    page.getByText("Protótipo web conectado à mesma API do aplicativo."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ativar sincronização deste protótipo" })
    .click();
  await page.screenshot({
    path: "docs/screenshots/relogio.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Circular", exact: true }).click();
  await expect(page.locator(".watch-hardware")).toHaveClass(/round/);
  await page.getByRole("button", { name: "Retangular", exact: true }).click();
  await page
    .getByRole("button", { name: "SEU LEMBRETE", exact: false })
    .click();
  await page
    .locator(".watch-med-item")
    .filter({ hasText: "Losartana" })
    .click();
  await context.setOffline(true);
  await page.getByRole("button", { name: "Sim, já tomei" }).click();
  await expect(
    page.getByText("1 ação(ões) pendente(s)", { exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
  await expect(
    page.getByText("1 ação(ões) pendente(s)", { exact: true }),
  ).toHaveCount(0, { timeout: 20000 });
  await expect(
    page.locator(".watch-med-item").filter({ hasText: "Losartana" }),
  ).toContainText("Tomado");
  const result = await page.evaluate(async () => {
    const r = await fetch("/api/state");
    return r.json();
  });
  expect(
    result.confirmations.filter((c: any) => c.name === "Losartana"),
  ).toHaveLength(1);
  await page
    .getByRole("button", { name: "Voltar ao início do relógio" })
    .click();
  await page.getByRole("button", { name: "SOS · Pedir ajuda" }).click();
  await context.setOffline(true);
  await page.getByRole("button", { name: "SOS", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(
    page.getByText("Pendente neste aparelho. O pedido não foi transmitido."),
  ).toBeVisible();
  await context.setOffline(false);
  await expect(
    page.getByText("1 ação(ões) pendente(s)", { exact: true }),
  ).toHaveCount(0, { timeout: 20000 });
});
test("cadastro e login reais, validação e autorização do cuidador", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Começar meu cuidado" }).click();
  await page.getByRole("button", { name: "Sou o idoso", exact: false }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Nome completo", { exact: true }).fill("Maria Teste");
  await page.getByLabel("Data de nascimento").fill("1950-01-01");
  await page.getByLabel("Telefone com DDD").fill("11999999999");
  const email = `maria-${Date.now()}@example.test`;
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Segura123456");
  await page.getByLabel("Confirme sua senha").fill("Segura123456");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByRole("heading", { name: /Olá, Maria/ })).toBeVisible();
  await nav(page, "Perfil e ajustes");
  await page.getByRole("button", { name: "Convidar cuidador" }).click();
  const code = await page.locator(".invite-code strong").innerText();
  const second = await browser.newContext();
  const care = await second.newPage();
  await care.goto("/");
  await care.getByRole("button", { name: "Começar meu cuidado" }).click();
  await care
    .getByRole("button", { name: "Sou o cuidador(a)", exact: false })
    .click();
  await care.getByRole("button", { name: "Continuar", exact: true }).click();
  await care.getByLabel("Nome completo", { exact: true }).fill("Ana Teste");
  await care.getByLabel("Telefone com DDD").fill("11888888888");
  await care
    .getByLabel("E-mail", { exact: true })
    .fill(`ana-${Date.now()}@example.test`);
  await care.getByLabel("Senha", { exact: true }).fill("Segura123456");
  await care.getByLabel("Confirme sua senha").fill("Segura123456");
  await care.getByRole("checkbox").check();
  await care.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(
    care.getByRole("heading", { name: "Vamos formar sua rede de cuidado?" }),
  ).toBeVisible();
  await care.getByLabel("Código de autorização").fill(code);
  await care.getByRole("button", { name: "Conectar ao idoso" }).click();
  await expect(
    care.getByRole("heading", { name: /Cuidando de Maria/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Revogar acesso de Ana Teste" })
    .click();
  await page
    .getByRole("button", { name: "Revogar acesso", exact: true })
    .click();
  await care.reload();
  await expect(
    care.getByRole("heading", { name: "Vamos formar sua rede de cuidado?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await page.getByRole("button", { name: "Já tenho uma conta" }).click();
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Segura123456");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Olá, Maria/ })).toBeVisible();
  await second.close();
});
