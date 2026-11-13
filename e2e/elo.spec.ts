import { expect, test, type Page } from "@playwright/test";

const unique = () => Date.now().toString(36);

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return errors;
}

async function demo(page: Page, who: "Indústria" | "Engenheira" | "Mentor") {
  await page.goto("/entrar");
  await page.getByRole("button", { name: who }).click();
  await page.waitForURL(who === "Indústria" ? "**/app" : "**/eng");
}

test.describe.configure({ mode: "serial" });

test("landing mostra números da rede e abre a demonstração", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Transforme resíduo industrial");
  await expect(page.getByText("dados ao vivo da conta de demonstração")).toBeVisible();
  await page.goto("/metodologia");
  await expect(page.getByRole("heading", { name: "Como calculamos" })).toBeVisible();
  await expect(page.getByText(/Greenhouse gas reporting: conversion factors 2024/).first()).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "Ver demonstração" }).click();
  await page.waitForURL("**/app");
  await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  await expect(page.getByText("Alertas do motor de cálculo")).toBeVisible();
  await page.getByRole("button", { name: /Como calculamos: Indicador/ }).click();
  await expect(page.getByText(/Ellen MacArthur Foundation/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("área logada exige login", async ({ page }) => {
  await page.goto("/app/insumos");
  await expect(page).toHaveURL(/\/entrar$/);
});

test("cadastro de indústria com onboarding gera o diagnóstico", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/cadastro");
  await page.fill("#su-name", "Teste Automatizado");
  await page.fill("#su-email", `teste-${unique()}@fabrica.com`);
  await page.fill("#su-pass", "senha12345");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/onboarding/empresa");

  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Preencha o nome da empresa")).toBeVisible();
  await page.fill("#ob-name", "Metalúrgica Automatizada");
  await page.fill("#ob-emp", "40");
  await page.selectOption("#ob-city", "Diadema");
  await page.getByRole("button", { name: "Continuar" }).click();

  const qty = page.locator('input[id^="q-"]');
  await expect(qty).toHaveCount(5);
  await qty.nth(0).fill("10000");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Prejuízo com resíduos")).toBeVisible();
  await page.getByRole("button", { name: /Concluir e ver diagnóstico/ }).click();

  await page.waitForURL("**/app?bemvindo=1");
  await expect(page.getByText("Seu diagnóstico está pronto")).toBeVisible();
  expect(errors).toEqual([]);
});

let requestUrl = "";

test("indústria: insumos, importação, detalhe, troca e convite", async ({ page }) => {
  const errors = collectErrors(page);
  await demo(page, "Indústria");

  await page.goto("/app/insumos");
  await page.getByRole("button", { name: "Novo insumo" }).first().click();
  await page.fill("#f-name", "Arame MIG");
  await page.fill("#f-qty", "200");
  await page.fill("#f-cost", "14");
  await page.fill("#f-loss", "8");
  await page.getByRole("button", { name: "Adicionar insumo" }).click();
  await expect(page.getByRole("link", { name: "Arame MIG" })).toBeVisible();

  await page.getByRole("button", { name: "Importar planilha" }).click();
  await page.setInputFiles("input[type=file]", {
    name: "insumos.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("nome,categoria,consumo_mensal,custo_unitario,perda_percentual,destino,valor_destino\nPapelão ondulado,papelao,500,4.5,30,reciclagem,0.4\nLinha ruim,xyz,1,1,1,aterro,0\n"),
  });
  await expect(page.getByText("categoria desconhecida")).toBeVisible();
  await page.getByRole("button", { name: "Importar 1 insumos" }).click();
  await expect(page.getByRole("link", { name: "Papelão ondulado" })).toBeVisible();

  const csv = await page.request.get("/app/insumos/exportar");
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(await csv.text()).toContain("Papelão ondulado");

  await page.getByRole("link", { name: "Chapa de aço SAE 1020" }).click();
  await expect(page.getByText("Registros mensais")).toBeVisible();

  await page.goto("/app/marketplace");
  await page.getByRole("button", { name: "Aceitar" }).first().click();
  await expect(page.getByText("Troca ativa. O diagnóstico foi atualizado.")).toBeVisible();
  await page.getByRole("button", { name: "Propor troca" }).first().click();
  await expect(page.getByText(/Proposta enviada/).first()).toBeVisible();

  await page.goto("/app/engenheiros");
  await page
    .locator("div")
    .filter({ hasText: "Ana Ribeiro" })
    .filter({ has: page.getByRole("button", { name: "Convidar", exact: true }) })
    .last()
    .getByRole("button", { name: "Convidar", exact: true })
    .click();
  await page.getByRole("button", { name: /^Convidar \S+/ }).last().click();
  await page.waitForURL("**/demandas/**");
  requestUrl = page.url();
  await page.fill("textarea[name=body]", "Podemos agendar uma visita na quinta?");
  await page.getByRole("button", { name: "Enviar" }).click();
  await expect(page.getByText("Podemos agendar uma visita na quinta?")).toBeVisible();

  await page.goto("/app/relatorio");
  await expect(page.getByText("Plano de ação recomendado")).toBeVisible();
  expect(errors).toEqual([]);
});

test("estudante entrega e mentor valida a demanda", async ({ browser }) => {
  test.skip(!requestUrl, "depende do teste anterior");
  const page = await (await browser.newContext()).newPage();
  const errors = collectErrors(page);
  await demo(page, "Engenheira");
  await page.goto(requestUrl);
  const assign = page.getByRole("button", { name: "Assumir demanda" });
  await expect(assign).toBeVisible();
  await assign.click();
  await expect(page.getByText("Demanda assumida")).toBeVisible();
  await page.getByRole("button", { name: "Concluir demanda" }).click();
  await page.fill("#c-out", "Novo plano de corte reduziu a perda de 22% para 15%.");
  await page.fill("#c-sav", "2500");
  await page.getByRole("button", { name: "Enviar para revisão" }).click();
  await expect(page.getByText("Aguardando a revisão de um(a) mentor(a)")).toBeVisible();

  const mentor = await (await browser.newContext()).newPage();
  const mentorErrors = collectErrors(mentor);
  await demo(mentor, "Mentor");
  await mentor.goto("/eng/revisoes");
  await expect(mentor.getByText("Reduzir perda de chapa de aço SAE 1020").first()).toBeVisible();
  await mentor.goto(requestUrl);
  await mentor.fill("#r-sav", "2300");
  await mentor.fill("#r-note", "Resultado consistente; ajustei a economia ao lote medido.");
  await mentor.getByRole("button", { name: "Validar entrega" }).click();
  await expect(mentor.getByText("Economia validada de R$ 2.300 por mês")).toBeVisible();
  await expect(mentor.getByText(/Validada por Carlos Menezes, mentor/)).toBeVisible();

  await page.goto("/eng/perfil");
  await expect(page.getByText("Horas de extensão").first()).toBeVisible();
  await page.goto("/eng/extensao");
  await expect(page.getByText("Relatório de atividades de extensão")).toBeVisible();
  await expect(page.getByText("Reduzir perda de chapa de aço SAE 1020").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  expect(mentorErrors).toEqual([]);
});

test("cadastro de engenheiro com perfil técnico", async ({ page }) => {
  await page.goto("/cadastro?perfil=engenheiro");
  await page.fill("#su-name", "Nova Engenheira");
  await page.fill("#su-email", `eng-${unique()}@usp.br`);
  await page.fill("#su-pass", "senha12345");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/onboarding/engenheiro");
  await page.fill("#eo-course", "Eng. de Produção");
  await page.fill("#eo-bio", "Estágio em manufatura enxuta e logística.");
  await page.getByRole("button", { name: "nesting" }).click();
  await page.getByRole("button", { name: "Concluir perfil" }).click();
  await page.waitForURL("**/eng");
  await expect(page.getByRole("heading", { name: "Demandas abertas" })).toBeVisible();
});

test("telas cabem no celular", async ({ browser }) => {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  for (const path of ["/", "/entrar", "/cadastro", "/impacto"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), path).toBeLessThanOrEqual(0);
  }
  await demo(page, "Indústria");
  for (const path of ["/app", "/app/insumos", "/app/simulador", "/app/marketplace", "/app/engenheiros", "/app/demandas", "/app/relatorio"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), path).toBeLessThanOrEqual(0);
  }
});
