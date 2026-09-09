[🇺🇸 Read in English](README-en.md)

# 🎞️ JSON SubLayer for WhisperX

**Desenvolvido por Rafael Godoy Ebert**

**JSON SubLayer** é um editor de legendas profissional baseado na web, projetado para preencher uma lacuna crítica no fluxo de trabalho de automação de vídeos virais: a **precisão milimétrica dos timestamps por palavra**.

### 🚀 [TESTAR ONLINE AGORA](https://rafaelgodoyebert.github.io/JSON-SubLayer/)

### Desktop

<img width="3651" height="1890" alt="JSON SubLayer em um computador" src="https://github.com/user-attachments/assets/eb72473a-8bfd-4e1f-9e44-1d67c7661bfb" />

### Mobile

<img width="660" height="1580" alt="JSON SubLayer em um celular" src="https://github.com/user-attachments/assets/5590a422-07b9-4bae-9a0b-909e5b6daba9" />

## 💡 Por que este projeto existe?

Este software nasceu de uma necessidade interna para alimentar o **[ViralCutter](https://github.com/RafaelGodoyEbert/ViralCutter)**.

O ViralCutter utiliza inteligência artificial para transformar vídeos longos em cortes virais (Shorts/TikTok), aplicando legendas dinâmicas com highlights (estilo Hormozi). Para que esse efeito funcione, o sistema precisa saber exatamente quando cada palavra começa e termina.

A IA (WhisperX) gera esses dados, mas comete erros. E é aqui que o **JSON SubLayer** entra.

### 🧠 A Filosofia: JSON vs. ASS/SRT

Você pode perguntar: *"Por que não editar o arquivo final (.ass/.srt) direto no Aegisub?"*

A resposta é **Liberdade e Escalabilidade.**

No fluxo do ViralCutter, o arquivo `.ass` (Advanced Substation Alpha) é apenas o **formato de renderização final**, já "queimado" com cores, fontes e animações de karaokê definidos pelo usuário.
*   **Editar o .ASS:** É difícil e rígido. Se você quiser mudar a cor do destaque ou a fonte depois, terá que refazer tudo manualmente ou lidar com tags complexas (`{\k15}{\c&H00FFFF&}`).
*   **Editar o JSON:** É editar a **estrutura pura**. Você corrige o tempo e o texto da palavra, e o ViralCutter pode gerar *dezenas* de estilos visuais diferentes a partir desse mesmo JSON corrigido.

**O JSON SubLayer te dá o controle da "fonte da verdade", não apenas do resultado final.**

---

## ✨ Principais Diferenciais

*   **🌐 100% Web & Offline:** Roda no navegador (GitHub Pages). Seguro e privado.
*   **🔗 Vídeo por Link:** Use um link direto de vídeo ou um vídeo público do YouTube como referência.
*   **📱 Desktop e Mobile:** Interface responsiva com controles adaptados para telas pequenas.
*   **👆 Edição por Toque:** Mova e redimensione os blocos diretamente com o dedo.
*   **🔢 Lista Numerada:** Visualize e edite todas as legendas com timestamps de início e fim.
*   **🔎 Pesquisa Rápida:** Filtre legendas instantaneamente por número, tempo ou texto.
*   **🌓 Temas Claro e Escuro:** O editor lembra o tema escolhido no navegador.
*   **⏪ Controle J/L:** Reproduza para trás ou para frente em 1x, 2x, 4x e 8x.
*   **🧱 Multi-Track:** Edite múltiplas camadas simultaneamente.
*   **🔍 Power Tools:** Busca e Substituição (Ctrl+F/H) com destaque visual.
*   **🔊 Waveform:** Sincronia perfeita com visualização de áudio.
*   **🌊 Sincronizar Áudio:** Ajusta os limites das legendas aos picos e silêncios da waveform, na camada ativa ou na seleção.
*   **🔡 Edição Granular:** Ajuste o tempo de frases, palavras ou caracteres.
*   **🔗 Mesclar por Pontuação:** Junta automaticamente fragmentos que pertencem à mesma frase, com limite opcional de caracteres.
*   **🧲 Ímã Configurável:** Alinhamento preciso aos limites das legendas, com distância e tecla modificadora configuráveis.
*   **✨ Acompanhamento de Reprodução:** Lista e prévia podem seguir o playback e destacar a palavra ativa.
*   **🔄 Round-Trip:** Importe/Exporte JSON compatível com Adobe Premiere e WhisperX.
*   **📌 Sticky Tracks:** Cabeçalhos organizados.
*   **🌍 Internacionalização:** PT-BR / EN.

## 🚀 Como Usar

Este projeto é hospedado no GitHub Pages e roda inteiramente no lado do cliente (Client-Side).

1. **Acesse o link do projeto** (ou abra o arquivo `index.html` localmente).
2. Carregue seu arquivo de mídia (Vídeo/Áudio) para referência ou use **Vídeo por link** com uma URL direta/YouTube.
3. Importe seu arquivo de legenda (`.json`).
4. Edite pela lista numerada ou pela timeline visual. No celular, arraste os blocos diretamente com o dedo. Use **Sincronizar áudio** após carregar uma mídia para refinar os limites pela waveform.
5. Exporte no formato desejado.

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
| :--- | :--- |
| `Espaço` | Play / Pause |
| `J` | Reproduzir para trás; pressione novamente para acelerar |
| `L` | Reproduzir para frente; pressione novamente para acelerar |
| `K` | Dividir legenda (Split) |
| `G` | Mesclar legendas (Merge) |
| `Delete` | Excluir seleção |
| `Ctrl + C / V` | Copiar e Colar |
| `Ctrl + Z / Y` | Desfazer / Refazer |
| `Ctrl + F` | Buscar |
| `Ctrl + H` | Substituir |
| `Ctrl + Scroll` | Zoom na Timeline |

---
**JSON SubLayer for WhisperX** - A peça chave para legendas perfeitas no [ViralCutter](https://github.com/rafaelgodoyebert/ViralCutter). 🎯🎞️
