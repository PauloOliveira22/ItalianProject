// Curriculum: each unit is a list of items with the Italian term (`it`) and the
// Portuguese meaning (`pt`). Alternatives accepted in typed answers are
// separated by " / ". The first alternative is the one shown on screen.
(function (root) {
  const UNITS = [
    {
      id: "saudacoes",
      title: "Saudações",
      emoji: "👋",
      description: "Cumprimentar, agradecer e se apresentar",
      items: [
        { it: "ciao", pt: "oi / tchau / olá", note: "Informal: serve para chegar e para sair." },
        { it: "buongiorno", pt: "bom dia" },
        { it: "buonasera", pt: "boa tarde / boa noite", note: "Usado ao chegar, a partir do meio da tarde." },
        { it: "buonanotte", pt: "boa noite", note: "Só para despedidas, antes de dormir." },
        { it: "arrivederci", pt: "até logo / tchau" },
        { it: "grazie", pt: "obrigado / obrigada" },
        { it: "prego", pt: "de nada" },
        { it: "per favore", pt: "por favor" },
        { it: "scusa", pt: "desculpa / com licença" },
        { it: "sì", pt: "sim" },
        { it: "come stai?", pt: "como você está? / como vai?" },
        { it: "sto bene", pt: "estou bem" },
        { it: "mi chiamo Marco", pt: "meu nome é Marco / eu me chamo Marco" },
      ],
    },
    {
      id: "numeros",
      title: "Números",
      emoji: "🔢",
      description: "Contar de um a dez, e mais",
      items: [
        { it: "uno", pt: "um" },
        { it: "due", pt: "dois" },
        { it: "tre", pt: "três" },
        { it: "quattro", pt: "quatro" },
        { it: "cinque", pt: "cinco" },
        { it: "sei", pt: "seis" },
        { it: "sette", pt: "sete" },
        { it: "otto", pt: "oito" },
        { it: "nove", pt: "nove" },
        { it: "dieci", pt: "dez" },
        { it: "venti", pt: "vinte" },
        { it: "cento", pt: "cem" },
      ],
    },
    {
      id: "cores",
      title: "Cores",
      emoji: "🎨",
      description: "As cores do dia a dia",
      items: [
        { it: "rosso", pt: "vermelho" },
        { it: "blu", pt: "azul" },
        { it: "verde", pt: "verde" },
        { it: "giallo", pt: "amarelo" },
        { it: "nero", pt: "preto" },
        { it: "bianco", pt: "branco" },
        { it: "arancione", pt: "laranja" },
        { it: "viola", pt: "roxo" },
        { it: "grigio", pt: "cinza" },
        { it: "marrone", pt: "marrom" },
      ],
    },
    {
      id: "familia",
      title: "Família",
      emoji: "👨‍👩‍👧",
      description: "Pais, irmãos, avós e mais",
      items: [
        { it: "la madre", pt: "a mãe", note: "No dia a dia: la mamma." },
        { it: "il padre", pt: "o pai", note: "No dia a dia: il papà." },
        { it: "il fratello", pt: "o irmão" },
        { it: "la sorella", pt: "a irmã" },
        { it: "il figlio", pt: "o filho" },
        { it: "la figlia", pt: "a filha" },
        { it: "il nonno", pt: "o avô" },
        { it: "la nonna", pt: "a avó" },
        { it: "il marito", pt: "o marido" },
        { it: "la moglie", pt: "a esposa / a mulher" },
        { it: "lo zio", pt: "o tio" },
        { it: "la zia", pt: "a tia" },
      ],
    },
    {
      id: "comida",
      title: "Comida e bebida",
      emoji: "🍝",
      description: "Para pedir no bar e no restaurante",
      items: [
        { it: "il pane", pt: "o pão" },
        { it: "l'acqua", pt: "a água" },
        { it: "il vino", pt: "o vinho" },
        { it: "il formaggio", pt: "o queijo" },
        { it: "la mela", pt: "a maçã" },
        { it: "il caffè", pt: "o café" },
        { it: "il latte", pt: "o leite" },
        { it: "la carne", pt: "a carne" },
        { it: "il pesce", pt: "o peixe" },
        { it: "il gelato", pt: "o sorvete" },
        { it: "la birra", pt: "a cerveja" },
        { it: "il pomodoro", pt: "o tomate" },
      ],
    },
    {
      id: "essere-avere",
      title: "Ser e ter",
      emoji: "🧩",
      description: "Os verbos essere e avere no presente",
      items: [
        { it: "io sono", pt: "eu sou / eu estou" },
        { it: "tu sei", pt: "você é / tu és / você está" },
        { it: "lui è", pt: "ele é / ele está" },
        { it: "noi siamo", pt: "nós somos / nós estamos" },
        { it: "voi siete", pt: "vocês são / vocês estão" },
        { it: "loro sono", pt: "eles são / elas são / eles estão" },
        { it: "io ho", pt: "eu tenho" },
        { it: "tu hai", pt: "você tem / tu tens" },
        { it: "lei ha", pt: "ela tem" },
        { it: "noi abbiamo", pt: "nós temos" },
        { it: "voi avete", pt: "vocês têm" },
        { it: "loro hanno", pt: "eles têm / elas têm" },
      ],
    },
    {
      id: "viagem",
      title: "Viagem",
      emoji: "🧳",
      description: "Frases úteis para se virar na Itália",
      items: [
        { it: "dov'è il bagno?", pt: "onde fica o banheiro? / onde é o banheiro?" },
        { it: "quanto costa?", pt: "quanto custa?" },
        { it: "non capisco", pt: "não entendo / eu não entendo" },
        { it: "parla inglese?", pt: "você fala inglês? / o senhor fala inglês?" },
        { it: "vorrei un caffè", pt: "eu gostaria de um café / queria um café" },
        { it: "il conto, per favore", pt: "a conta, por favor" },
        { it: "il biglietto", pt: "o bilhete / a passagem / o ingresso" },
        { it: "la stazione", pt: "a estação" },
        { it: "l'albergo", pt: "o hotel" },
        { it: "a destra", pt: "à direita" },
        { it: "a sinistra", pt: "à esquerda" },
        { it: "sempre dritto", pt: "sempre em frente / reto" },
      ],
    },
  ];

  // Give every item a stable id so progress survives curriculum edits.
  for (const unit of UNITS) {
    for (const item of unit.items) {
      item.id = unit.id + ":" + item.it;
      item.unitId = unit.id;
    }
  }

  const api = { UNITS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ItalianData = api;
})(this);
