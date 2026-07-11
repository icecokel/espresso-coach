import { expect, test, type Page } from "@playwright/test";

async function fillWarningInputs(page: Page) {
  await page.getByPlaceholder("예: 시고 끝맛이 떫다").fill("너무 시다");
  await page.getByPlaceholder("18.0").fill("4");
  await page.getByPlaceholder("36.0").fill("8");
  await page.getByPlaceholder("28").fill("8");
}

async function requestWarningConfirmation(page: Page) {
  await page.getByRole("button", { name: "추천 받기" }).click();
  await expect(page.getByText("입력값 확인 필요")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("first warning submission stays on the form and requires confirmation", async ({ page }) => {
  await fillWarningInputs(page);

  await requestWarningConfirmation(page);

  await expect(page).not.toHaveURL(/\/shot\//);
  await expect(page.getByText("도징량이 일반적인 범위를 벗어났습니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "이 값으로 계속 저장" })).toBeVisible();
});

test("double-clicking continue creates one result route history entry", async ({ page }) => {
  await fillWarningInputs(page);
  await requestWarningConfirmation(page);
  const initialHistoryLength = await page.evaluate(() => window.history.length);

  await page.getByRole("button", { name: "이 값으로 계속 저장" }).dblclick();

  await expect(page).toHaveURL(/\/shot\//);
  await expect
    .poll(() => page.evaluate(() => window.history.length))
    .toBe(initialHistoryLength + 1);
});

for (const [field, placeholder, value] of [
  ["dose", "18.0", "4.5"],
  ["yield", "36.0", "9"],
  ["brew time", "28", "9"],
] as const) {
  test(`requires confirmation again after changing ${field}`, async ({ page }) => {
    await fillWarningInputs(page);
    await requestWarningConfirmation(page);

    await page.getByPlaceholder(placeholder).fill(value);

    await expect(page.getByText("입력값 확인 필요")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "추천 받기" })).toBeVisible();

    await requestWarningConfirmation(page);

    await expect(page.getByRole("button", { name: "이 값으로 계속 저장" })).toBeVisible();
  });
}
