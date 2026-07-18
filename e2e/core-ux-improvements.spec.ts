import { expect, test, type Page } from "@playwright/test";

async function createFirstShot(page: Page) {
  await page.goto("/");
  await page.getByLabel("맛").fill("시고 끝맛이 떫다");
  await page.getByLabel("도징량").fill("18");
  await page.getByLabel("추출량").fill("36");
  await page.getByLabel("시간").fill("28");
  await page.getByRole("button", { name: "추천 받기" }).click();
  await expect(page).toHaveURL(/\/shot\//);
}

async function openCreatedSessionDetail(page: Page) {
  await page.goBack();
  await page.getByRole("link", { name: "전체 세션 보기" }).click();
  await page.getByRole("link", { name: /세션 상세$/ }).click();
  await expect(page).toHaveURL(/\/session\//);
}

test("shows the session list before its editor for returning users", async ({ page }) => {
  await createFirstShot(page);
  await page.goBack();
  await page.getByRole("link", { name: "전체 세션 보기" }).click();

  await expect(page.getByText("진행 중 세션")).toBeVisible();
  await expect(page.getByLabel("세션 이름")).toHaveCount(0);

  await page.getByRole("button", { name: "새 세션 만들기" }).click();
  await expect(page.getByLabel("세션 이름")).toBeVisible();
});

test("keeps a long session title clear of metadata and exposes primary actions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createFirstShot(page);
  await openCreatedSessionDetail(page);

  const title = page.getByRole("heading", {
    name: /^새 원두 세션 \d{4}-\d{2}-\d{2}$/,
  });
  const metadata = page.getByLabel("세션 상태: 진행 중");
  const [titleBox, metadataBox] = await Promise.all([
    title.boundingBox(),
    metadata.boundingBox(),
  ]);

  expect(titleBox).not.toBeNull();
  expect(metadataBox).not.toBeNull();
  expect((titleBox?.y ?? 0) + (titleBox?.height ?? 0)).toBeLessThanOrEqual(
    metadataBox?.y ?? 0,
  );
  await expect(page.getByRole("link", { name: "다음 샷 기록" })).toBeVisible();
  await expect(page.getByRole("link", { name: "세션 수정" })).toBeVisible();
});

test("opens the selected session editor from session detail", async ({ page }) => {
  await createFirstShot(page);
  await openCreatedSessionDetail(page);

  const sessionName = await page
    .getByRole("heading", { name: /^새 원두 세션 / })
    .textContent();
  await page.getByRole("link", { name: "세션 수정" }).click();

  await expect(page).toHaveURL(/\/sessions\?editSessionId=/);
  await expect(page.getByLabel("세션 이름")).toHaveValue(sessionName ?? "");

  await page.getByRole("button", { name: "취소" }).click();
  await expect(page).toHaveURL(/\/sessions$/);
  await expect(page.getByLabel("세션 이름")).toHaveCount(0);
});

test("deletes the latest shot only after explicit confirmation", async ({ page }) => {
  await createFirstShot(page);

  await page.getByRole("button", { name: "최신 샷 삭제" }).click();
  await expect(
    page.getByText("이 샷과 추천 기록을 삭제합니다. 삭제 후에는 되돌릴 수 없습니다."),
  ).toBeVisible();
  await page.getByRole("button", { name: "최신 샷 삭제" }).click();

  await expect(page).toHaveURL(/\/session\//);
  await expect(page.getByText("이 세션에는 아직 저장된 샷이 없습니다.")).toBeVisible();
});

test("uses the high-contrast primary button token in dark mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  const button = page.getByRole("button", { name: "추천 받기" });
  await expect(button).toBeVisible();
  await expect
    .poll(() => button.evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe("rgb(63, 120, 105)");
});
