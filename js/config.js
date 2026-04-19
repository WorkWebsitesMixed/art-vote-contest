// ══════════════════════════════════════════════
// config.js — ONLY file the admin needs to edit
// ══════════════════════════════════════════════

const CONFIG = {
  scriptURL: "https://script.google.com/macros/s/AKfycby0Kz9M5Og9BaS8xHAE4FpI4JmdfF8sFjgcDihJx10Yz9XiphQmVePEDd4A90gNRKkQ/exec",

  category1Name: "INVISIBLE PERO REAL",
  category2Name: "LO QUE EL MUNDO NECESITA ESCUCHAR DE LOS JÓVENES",

  categories: [
    {
      id: "cat1",
      nameKey: "category1Name",
      pieces: [
        { id: "cat1_p1", title: "Mi futuro", artist: "Juliana Herreros Cartagena", school: "Colegio Cumbres", technique: "Técnica mixta" },
        { id: "cat1_p2", title: "El bosque es la mente: profundo e inexplorado", artist: "Luciana Restrepo Betancur", school: "Colegio Pinares Altoverde", technique: "Acrílico sobre papel" },
        { id: "cat1_p3", title: "Una presencia silenciosa", artist: "Valeria Cabarcas Sinning", school: "Colegio Marymount Medellín", technique: "Óleo sobre papel" }
      ]
    },
    {
      id: "cat2",
      nameKey: "category2Name",
      pieces: [
        { id: "cat2_p1", title: "Lucha interior", artist: "Valentina Zambrano Restrepo", school: "Colegio Pinares Altoverde", technique: "Técnica mixta" },
        { id: "cat2_p2", title: "el grito de la tierra", artist: "Alejandra Duque Robledo", school: "Colegio Marymount Medellín", technique: "Técnica mixta" },
        { id: "cat2_p3", title: "Sin título", artist: "Mariana Posada Castrillón", school: "Colegio Montessori", technique: "Técnica mixta" }
      ]
    }
  ]
};
