import { expect, test, type Page } from "@playwright/test";

async function fillShot(
  page: Page,
  { doseGrams = "18", yieldGrams = "36" }: { doseGrams?: string; yieldGrams?: string } = {},
) {
  await page.getByPlaceholder("예: 시고 끝맛이 떫다").last().fill("너무 시다");
  await page.getByPlaceholder("18.0").last().fill(doseGrams);
  await page.getByPlaceholder("36.0").last().fill(yieldGrams);
  await page.getByPlaceholder("28").last().fill("22");
}

test("recommends a coarser grind after a finer adjustment worsens the second shot", async ({
  page,
}) => {
  await page.goto("/");
  await fillShot(page);
  await page.getByRole("button", { name: "추천 받기" }).last().click();

  await expect(page).toHaveURL(/\/shot\//);
  await page.getByRole("link", { name: "다음 샷 기록" }).click();

  await fillShot(page, { doseGrams: "19", yieldGrams: "38" });
  await expect(page.getByText("도징량 18g → 19g · 늘림")).toBeVisible();
  await expect(page.getByText("추출량 36g → 38g · 늘림")).toBeVisible();
  await page.getByRole("button", { name: "선택 관찰 열기" }).click();
  await page.getByRole("radio", { name: "분쇄도" }).last().click();
  await page.getByRole("radio", { name: "더 곱게" }).last().click();
  await page.getByRole("radio", { name: "나빠짐" }).last().click();
  await page.getByRole("button", { name: "추천 받기" }).last().click();

  await expect(page).toHaveURL(/\/shot\//);
  await expect(
    page.getByText("분쇄도를 한 단계만 굵게 조정하세요."),
  ).toBeVisible();
});
