import { expect, test, type Page } from "@playwright/test";

async function createFirstShot(page: Page) {
  await page.getByPlaceholder("예: 시고 끝맛이 떫다").fill("너무 시다");
  await page.getByPlaceholder("18.0").fill("18");
  await page.getByPlaceholder("36.0").fill("36");
  await page.getByPlaceholder("28").fill("22");
  await page.getByRole("button", { name: "추천 받기" }).click();
  await expect(page).toHaveURL(/\/shot\//);
}

async function fillShotAfterArchive(page: Page) {
  await page.getByPlaceholder("예: 시고 끝맛이 떫다").last().fill("너무 시다");
  await page.getByPlaceholder("18.0").last().fill("18");
  await page.getByPlaceholder("36.0").last().fill("36");
  await page.getByPlaceholder("28").last().fill("22");
}

test("archives a session out of diagnosis and restores it from session detail", async ({
  page,
}) => {
  await page.goto("/");
  await createFirstShot(page);

  await page.goBack();
  await page.getByRole("link", { name: "전체 세션 보기" }).click();
  await page.getByRole("button", { name: /보관$/ }).click();

  await expect(page.getByText("보관된 세션")).toBeVisible();
  await expect(page.getByRole("button", { name: /진단에 사용$/ })).toHaveCount(0);

  await page.goBack();
  await fillShotAfterArchive(page);
  await page.getByRole("button", { name: "추천 받기" }).last().click();
  await expect(
    page.getByText(
      "보관된 세션에서는 샷을 저장할 수 없습니다. 세션 목록에서 복원한 뒤 다시 시도하세요.",
    ),
  ).toBeVisible();
  await expect(page.getByPlaceholder("18.0").last()).toHaveValue("18");

  await page.getByRole("link", { name: "전체 세션 보기" }).last().click();
  await page.getByRole("link", { name: /세션 상세$/ }).click();
  await expect(page.getByText("보관됨").last()).toBeVisible();
  await page.getByRole("button", { name: "세션 복원" }).click();

  await expect(page.getByRole("button", { name: "세션 보관" })).toBeVisible();
  await page.goBack();
  await page.goBack();
  await page.getByRole("link", { name: "전체 세션 보기" }).last().click();
  await expect(page.getByText("진행 중 세션")).toBeVisible();
  await expect(page.getByRole("button", { name: /진단에 사용$/ })).toBeVisible();
});
