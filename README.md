# 🇮🇹 Impara l'italiano

App web para aprender italiano do zero, feito para quem fala português.
Funciona no navegador do celular ou do computador, pode ser instalado como app (PWA)
e continua funcionando offline depois do primeiro acesso.

## O que tem

- **7 unidades de nível A1**: saudações, números, cores, família, comida e bebida,
  verbos *essere* e *avere*, e frases de viagem (~83 palavras e frases).
- **Lições em duas etapas**: primeiro você conhece cada palavra (com áudio),
  depois pratica com exercícios variados:
  - múltipla escolha italiano → português e português → italiano;
  - escrever em italiano (com teclas de acento e dicas; erros só de acento são aceitos com aviso);
  - ouvir e escolher o significado.
- **Áudio em italiano** usando a voz do próprio dispositivo (Web Speech API).
- **Revisão espaçada** (sistema Leitner): cada palavra volta para revisão em
  1, 2, 4, 7, 15 e 30 dias conforme você acerta; se errar, volta para o início.
- **Gamificação**: XP, sequência de dias (🔥), estrelas por unidade e desbloqueio progressivo.
- Progresso salvo no próprio navegador (`localStorage`), sem conta nem servidor.
- Atalhos de teclado: `1`–`4` escolhem a opção, `Enter` verifica/continua.

## Como rodar

Não há dependências nem build. Basta servir a pasta por HTTP:

```bash
npm start            # ou: python3 -m http.server 8000
```

e abrir <http://localhost:8000>. Para testar no celular, use o IP do computador na mesma rede.

Para publicar, qualquer hospedagem estática serve (GitHub Pages, Netlify, Vercel…).

## Testes

```bash
npm test
```

Os testes (Node ≥ 18, sem dependências) cobrem a correção de respostas, a geração
de exercícios, a repetição espaçada, a sequência de dias e a consistência do conteúdo.

## Estrutura

```
index.html            página única
css/style.css         estilos (tema claro e escuro)
js/data.js            conteúdo das unidades — edite aqui para adicionar palavras
js/logic.js           lógica pura (correção, exercícios, repetição espaçada)
js/app.js             telas e interação
sw.js                 service worker (modo offline)
manifest.webmanifest  instalação como app
tests/                testes da lógica
```

## Adicionando conteúdo

Em `js/data.js`, cada unidade tem uma lista de itens:

```js
{ it: "grazie", pt: "obrigado / obrigada", note: "Dica opcional." }
```

Separe com ` / ` as traduções aceitas; a primeira é a exibida na tela.
Ao criar uma unidade nova, ela é desbloqueada quando a anterior for concluída.

## Próximos passos possíveis

- Mais unidades (A2: passado prossimo, preposições, horas, compras…)
- Exercícios de montar frases e de falar (reconhecimento de voz)
- Áudios gravados por falantes nativos
- Conta de usuário e sincronização entre dispositivos
- Versão nativa (Capacitor/React Native) para as lojas de apps
