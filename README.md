# Contac — site institucional

Site de uma página para um escritório de contabilidade. O foco do projeto é o design: tipografia grande, preto e branco, e movimento guiado pelo scroll.

## Demonstração

**Desktop**

https://github.com/user-attachments/assets/b0f885f8-8e0f-40ea-9d0c-f21c8e9c521f

**Celular**

https://github.com/user-attachments/assets/2b4b9223-0870-4fb9-b465-87dca56969c1

## Design

- **Preto, branco e um laranja.** A página alterna entre fundo preto e fundo branco. O laranja da marca (`#ff6a00`) aparece só em detalhes pequenos: pontos finais, linhas finas, a logo e a seleção de texto.
- **Tipografia como imagem.** Uma única família, a Archivo variável, usada em larguras e pesos diferentes. Os títulos ocupam a tela e fazem o papel que normalmente seria de fotos ou ilustrações.
- **Abertura com a logo.** A logo gira em vídeo no centro da tela e, conforme o scroll avança, viaja até o canto e encaixa no menu.
- **Texto que se revela.** No "sobre", as palavras acendem uma a uma com o scroll; títulos e listas entram linha por linha.
- **Serviços em lista.** Cada linha é preenchida a partir da borda por onde o cursor entrou, e esvazia pela borda por onde ele saiu.
- **Carrossel de palavras.** Duas faixas com os serviços passam devagar em sentidos opostos, uma cheia e outra só em contorno.
- **Processo na horizontal.** A seção fica fixa e as etapas correm de lado enquanto a página rola.
- **Cursor próprio.** Um ponto branco com cauda que estica conforme a velocidade do mouse.
- **Responsivo e acessível.** No celular as seções fixas viram rolagem normal, e quem prefere movimento reduzido recebe a página estática.

## Tecnologias

HTML, CSS e JavaScript puros, sem framework nem biblioteca de animação, com [Vite](https://vite.dev) para desenvolvimento e build.

```bash
npm install
npm run dev
```
