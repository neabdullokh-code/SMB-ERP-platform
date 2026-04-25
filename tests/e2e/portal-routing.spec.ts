import { expect, test, type Page } from "@playwright/test";

const COMPANY_URL = process.env.COMPANY_PORTAL_URL ?? "http://localhost:3000";
const BANK_URL = process.env.BANK_PORTAL_URL ?? "http://localhost:3001";
const DEMO_OTP = "111111";

async function completeOtp(page: Page, code: string) {
  await expect(page.getByRole("button", { name: /Verify and sign in/i })).toBeVisible();
  const digits = page.locator(".auth-card input.input.mono");
  await expect(digits).toHaveCount(6);
  for (let i = 0; i < code.length; i += 1) {
    await digits.nth(i).fill(code[i]);
  }
  await page.getByRole("button", { name: /Verify and sign in/i }).click();
}

async function loginAsSmb(page: Page) {
  await page.goto(`${COMPANY_URL}/login`);
  await page.getByPlaceholder("name@company.com").fill("jasur@kamolot.uz");
  await page.getByPlaceholder("Enter your password").fill("Sqb2026!");
  await page.getByRole("button", { name: /Continue/i }).click();
  await expect(page).toHaveURL(/\/otp$/);
  await completeOtp(page, DEMO_OTP);
}

test("refresh keeps authenticated SMB route and does not fall back to login", async ({ page }) => {
  await loginAsSmb(page);

  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await page.goto(`${COMPANY_URL}/app/production`);
  await expect(page).toHaveURL(/\/app\/production$/);

  await page.reload();
  await expect(page).toHaveURL(/\/app\/production$/);
  await expect(page).not.toHaveURL(/\/login$/);
});

test("anonymous user refresh on protected route redirects to login", async ({ page }) => {
  await page.goto(`${COMPANY_URL}/app/production`);
  await expect(page).toHaveURL(/\/login$/);

  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
});

test("bank-staff auth on company portal redirects to bank origin", async ({ page }) => {
  await page.goto(`${COMPANY_URL}/login`);
  await page.getByRole("button", { name: "BANK STAFF" }).click();
  await page.getByPlaceholder("name@company.com").fill("malika.karimova@sqb.uz");
  await page.getByPlaceholder("Enter your password").fill("SqbBank2026!");
  await page.getByRole("button", { name: /Continue/i }).click();
  await expect(page).toHaveURL(/\/otp$/);
  await completeOtp(page, DEMO_OTP);

  await expect(page).toHaveURL(new RegExp(`^${BANK_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`));
});

test("SMB and Bank switching path is consistent on company login and redirects to bank after auth", async ({ page }) => {
  await page.goto(`${COMPANY_URL}/login`);
  const smbButton = page.getByRole("button", { name: /SMB customer/i });
  const bankButton = page.getByRole("button", { name: /Bank staff/i });
  await expect(smbButton).toBeVisible();
  await expect(bankButton).toBeVisible();
  await expect(smbButton).toHaveClass(/active/);

  await bankButton.click();
  await expect(bankButton).toHaveClass(/active/);

  await smbButton.click();
  await expect(smbButton).toHaveClass(/active/);

  await bankButton.click();
  await page.getByPlaceholder("name@company.com").fill("malika.karimova@sqb.uz");
  await page.getByPlaceholder("Enter your password").fill("SqbBank2026!");
  await page.getByRole("button", { name: /Continue/i }).click();
  await expect(page).toHaveURL(/\/otp$/);
  await completeOtp(page, DEMO_OTP);
  await expect(page).toHaveURL(new RegExp(`^${BANK_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`));
});
