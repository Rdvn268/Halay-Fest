import {
  ProductionCharacterView,
  type CharacterAngle,
} from "../../../packages/halay-game/src/humanoid/production-character.js";
import "./character.css";

const view = new ProductionCharacterView(
  document.querySelector<HTMLElement>("#character-stage")!,
);
const status = document.querySelector<HTMLElement>("#character-status")!;
const buttons = [
  ...document.querySelectorAll<HTMLButtonElement>("[data-angle]"),
];
const rig = document.querySelector<HTMLInputElement>("#rig")!;
for (const button of buttons) {
  button.disabled = true;
  button.addEventListener("click", () => {
    view.setAngle(button.dataset["angle"] as CharacterAngle);
    for (const b of buttons)
      b.setAttribute("aria-pressed", String(b === button));
  });
}
rig.addEventListener("change", () => view.showRig(rig.checked));
void view
  .load()
  .then(() => {
    status.textContent =
      "GLB hazır · anatomik gövde, ayrı kıyafet ve 52 kemikli rig";
    for (const b of buttons) b.disabled = false;
    buttons[0]!.setAttribute("aria-pressed", "true");
  })
  .catch((error: unknown) => {
    status.textContent = `Karakter yüklenemedi: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`;
  });
Object.defineProperty(window, "__halayCharacter", {
  value: Object.freeze({ metrics: () => view.metrics() }),
});
window.addEventListener("pagehide", () => view.dispose(), { once: true });
