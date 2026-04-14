// ══════════════════════════════════════════════
// config.js — ONLY file the admin needs to edit
// ══════════════════════════════════════════════

const CONFIG = {
  // 1. Paste your deployed Apps Script URL here after setup
  scriptURL: "https://script.google.com/macros/s/AKfycby0Kz9M5Og9BaS8xHAE4FpI4JmdfF8sFjgcDihJx10Yz9XiphQmVePEDd4A90gNRKkQ/exec",

  // 2. Category display names — change once, used everywhere
  category1Name: "Categoría 1",
  category2Name: "Categoría 2",

  // 3. Artwork entries per category
  //    id      → must match the image filename in /images/  (e.g. cat1_p1 → images/cat1_p1.jpg)
  //    title   → artwork title shown on cards
  //    artist  → student name
  //    school  → school / grade
  categories: [
    {
      id: "cat1",
      nameKey: "category1Name",
      pieces: [
        { id: "cat1_p1", title: "Obra 1", artist: "Artista A", school: "Colegio Marymount" },
        { id: "cat1_p2", title: "Obra 2", artist: "Artista B", school: "Colegio Marymount" },
        { id: "cat1_p3", title: "Obra 3", artist: "Artista C", school: "Colegio Marymount" }
      ]
    },
    {
      id: "cat2",
      nameKey: "category2Name",
      pieces: [
        { id: "cat2_p1", title: "Obra 1", artist: "Artista D", school: "Colegio Marymount" },
        { id: "cat2_p2", title: "Obra 2", artist: "Artista E", school: "Colegio Marymount" },
        { id: "cat2_p3", title: "Obra 3", artist: "Artista F", school: "Colegio Marymount" }
      ]
    }
  ]
};
