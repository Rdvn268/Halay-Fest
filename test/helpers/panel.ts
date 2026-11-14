import type { Page } from "@playwright/test";
export async function openPanel(
  page: Page,
  name:
    | "Genel bakış"
    | "Bağlantı"
    | "Oyun"
    | "Müzik"
    | "Test Paneli"
    | "Yayın ekranı"
    | "Nasıl kullanılır",
) {
  await page
    .getByRole("navigation", { name: "Yayıncı kontrolleri" })
    .getByRole("button", { name: new RegExp(`^${name}(?:\\s|$)`) })
    .click();
}
