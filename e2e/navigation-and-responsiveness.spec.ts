import { expect, test, type Page } from "@playwright/test";

const sessionName = "E2E 약중배전 세션";
const noSessionsMessage =
  "저장된 세션이 없습니다. 첫 샷은 새 세션에 자동으로 저장됩니다.";

async function waitForInitialSessionLoad(page: Page) {
  await expect(page.getByText(noSessionsMessage)).toBeVisible();
}

async function fillValidShot(page: Page) {
  await page.getByPlaceholder("예: 시고 끝맛이 떫다").fill("너무 시다");
  await page.getByPlaceholder("18.0").fill("18");
  await page.getByPlaceholder("36.0").fill("36");
  await page.getByPlaceholder("28").fill("28");
}

test("empty submission stays on the diagnosis page and shows required field errors", async ({
  page,
}) => {
  await page.goto("/");
  await waitForInitialSessionLoad(page);

  await page.getByRole("button", { name: "추천 받기" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByText("맛을 한마디로 적어주세요. 예: 시다, 쓰다, 밍밍하다"),
  ).toBeVisible();
  await expect(page.getByText("숫자만 입력해주세요.")).toHaveCount(3);
});

test("creates a named session and uses it from the session list", async ({ page }) => {
  await page.goto("/");
  await waitForInitialSessionLoad(page);
  await page.getByRole("button", { name: "원두 정보 추가 또는 수정" }).click();
  await page.getByPlaceholder("예: 과테말라 7월").fill(sessionName);
  await page.getByPlaceholder("예: Guatemala Huehuetenango").fill("Colombia Huila");
  await page.getByPlaceholder("예: 동네 로스터리").fill("Seoul Roastery");
  await page.getByRole("radio", { name: "약중배전" }).click();
  await page.getByRole("button", { name: "세션 생성" }).click();

  await page.getByRole("link", { name: "전체 세션 보기" }).click();

  await expect(page.getByText("진행 중 세션")).toBeVisible();
  await expect(
    page.getByRole("link", { name: `${sessionName} 세션 상세` }),
  ).toBeVisible();
  const useSession = page.getByRole("button", { name: `${sessionName} 진단에 사용` });
  await expect(useSession).toBeEnabled();

  await useSession.click();

  await expect(page).toHaveURL(/\/?sessionId=[^&]+/);
  await expect(page.getByRole("radio", { name: sessionName })).toBeVisible();
});

test("keeps optional setup collapsed and exposes checked selection state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await waitForInitialSessionLoad(page);

  await expect(page.getByLabel("맛")).toBeVisible();
  await expect(page.getByLabel("세션 이름")).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "변경 없음" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "원두 정보 추가 또는 수정" }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("button", { name: "선택 관찰 열기" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  await page.getByRole("button", { name: "원두 정보 추가 또는 수정" }).click();
  await expect(page.getByLabel("세션 이름")).toBeVisible();
  await expect(page.getByRole("button", { name: "원두 정보 닫기" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.getByRole("radio", { name: "배전도 모름" })).toBeChecked();
});

for (const [path, message] of [
  ["/shot/not-real-shot", "샷 기록을 찾을 수 없습니다."],
  ["/session/not-real-session", "세션 기록을 찾을 수 없습니다."],
] as const) {
  test(`direct navigation to ${path} shows its Korean not-found state`, async ({ page }) => {
    await page.goto(path);

    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByText(message)).toBeVisible();
  });
}

for (const viewport of [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`quick diagnosis fits ${viewport.width}x${viewport.height} without horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await waitForInitialSessionLoad(page);

    const recommendButton = page.getByRole("button", { name: "추천 받기" });
    await expect(recommendButton).toBeVisible();
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const bounds = await recommendButton.boundingBox();

    expect(documentWidth).toBeLessThanOrEqual(viewportWidth);
    expect(bounds).not.toBeNull();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(viewport.width);
  });
}

test("a normal successful submission reaches the result without browser errors", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });

  await page.goto("/");
  await waitForInitialSessionLoad(page);
  await fillValidShot(page);
  await page.getByRole("button", { name: "추천 받기" }).click();

  await expect(page).toHaveURL(/\/shot\//);
  await expect(page.getByText("맛 기록")).toBeVisible();
  expect(browserErrors).toEqual([]);
});
