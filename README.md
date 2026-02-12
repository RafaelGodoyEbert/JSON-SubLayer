[🇺🇸 Read in English](README-en.md)

# 🎞️ JSON SubLayer for WhisperX

**Desenvolvido por Rafael Godoy Ebert**

**JSON SubLayer** é um editor de legendas profissional baseado na web, projetado para preencher uma lacuna crítica no fluxo de trabalho de automação de vídeos virais: a **precisão milimétrica dos timestamps por palavra**.

### 🚀 [TESTAR ONLINE AGORA](https://rafaelgodoyebert.github.io/JSON-SubLayer/)

<img width="2507" height="950" alt="image" src="https://github.com/user-attachments/assets/9c6d0cea-6bbb-485e-a1d0-9c696d76397c" />

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
*   **🧱 Multi-Track:** Edite múltiplas camadas simultaneamente.
*   **🔍 Power Tools:** Busca e Substituição (Ctrl+F/H) com destaque visual.
*   **🔊 Waveform:** Sincronia perfeita com visualização de áudio.
*   **🔡 Edição Granular:** Ajuste o tempo de frases, palavras ou caracteres.
*   **🔄 Round-Trip:** Importe/Exporte JSON compatível com Adobe Premiere e WhisperX.
*   **📌 Sticky Tracks:** Cabeçalhos organizados.
*   **🌍 Internacionalização:** PT-BR / EN.

## 🚀 Como Usar

Este projeto é hospedado no GitHub Pages e roda inteiramente no lado do cliente (Client-Side).

1. **Acesse o link do projeto** (ou abra o arquivo `index.html` localmente).
2. Carregue seu arquivo de mídia (Vídeo/Áudio) para referência.
3. Importe seu arquivo de legenda (`.json`).
4. Edite usando a timeline visual.
5. Exporte no formato desejado.

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
| :--- | :--- |
| `Espaço` | Play / Pause |
| `K` | Dividir legenda (Split) |
| `G` | Mesclar legendas (Merge) |
| `Delete` | Excluir seleção |
| `Ctrl + C / V` | Copiar e Colar |
| `Ctrl + Z / Y` | Desfazer / Refazer |
| `Ctrl + F` | Buscar |
| `Ctrl + H` | Substituir |
| `Alt + Scroll` | Zoom na Timeline |

---
**JSON SubLayer for WhisperX** - A peça chave para legendas perfeitas no [ViralCutter](https://github.com/rafaelgodoyebert/ViralCutter). 🎯🎞️
