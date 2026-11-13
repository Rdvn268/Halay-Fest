export type DanceMode = "halay" | "horon";
export const MUSIC = {
  halay: {
    name: "Halay",
    meter: "2/4",
    unit: 60 / 108 / 2,
    steps: 16,
    melody: [62, 65, 67, 69, 67, 65, 64, 62, 60, 62, 64, 65, 67, 65, 64, 62],
    bass: [38, 38, 45, 45, 38, 38, 45, 45],
    accent: [0, 4, 8, 12],
  },
  horon: {
    name: "Horon",
    meter: "7/8",
    unit: 60 / 150 / 2,
    steps: 14,
    melody: [74, 76, 77, 79, 77, 76, 74, 72, 74, 76, 77, 79, 81, 79],
    bass: [43, 43, 50, 50, 43, 43, 50],
    accent: [0, 4, 8],
  },
};
