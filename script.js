// static/script.js
const PIXELS_PER_SECOND = 100;
const WORD_ZOOM_THRESHOLD = 2.5; // Nível de zoom para mostrar palavras
const CHAR_ZOOM_THRESHOLD = 20; // Nível de zoom BEM ALTO para mostrar caracteres

document.addEventListener('DOMContentLoaded', () => {
    // --- Referências ao DOM ---
    const app = document.querySelector('.app');
    const importJsonBtn = document.getElementById('import-json');
    const importMediaBtn = document.getElementById('import-media');
    const addSubtitleBtn = document.getElementById('add-subtitle');
    const saveJsonBtn = document.getElementById('save-json');
    const playPauseBtn = document.getElementById('play-pause');
    const timelineFrame = document.getElementById('timeline-frame');
    const timelineContent = document.getElementById('timeline-content');
    const timelineRuler = document.getElementById('timeline-ruler');
    const timelineScrollContainer = document.getElementById('timeline-scroll-container');
    const cursor = document.getElementById('cursor');
    const mediaPlayer = document.getElementById('media-player');
    const videoPlaceholder = document.getElementById('video-placeholder');
    const subtitleOverlay = document.getElementById('subtitle-overlay');
    const previewArea = document.getElementById('preview-area');
    const contextMenu = document.getElementById('context-menu');
    const waveformCanvas = document.getElementById('waveform-canvas');
    const waveformCtx = waveformCanvas.getContext('2d');
    const autoGenerateCharsCheckbox = document.getElementById('auto-generate-chars');
    const zoomIndicator = document.getElementById('zoom-indicator');
    const trackSelector = document.getElementById('track-selector');
    const addTrackBtn = document.getElementById('add-track');

    // Referências do Modal de Exportação
    const exportModal = document.getElementById('export-modal');
    const exportFormatSelect = document.getElementById('export-format');
    const exportTrackModeSelect = document.getElementById('export-track-mode');
    const confirmExportBtn = document.getElementById('confirm-export');
    const cancelExportBtn = document.getElementById('cancel-export');

    const resizerH = document.getElementById('resizer-h');
    const resizerV = document.getElementById('resizer-v');
    const workspace = document.getElementById('workspace');
    const editorPane = document.getElementById('editor-pane');
    const toggleLayoutBtn = document.getElementById('toggle-layout');
    const videoPreview = document.getElementById('video-preview');
    const languageSelector = document.getElementById('language-selector');
    const splitPunctuationBtn = document.getElementById('split-by-punctuation');

    // Referências do Modal de Busca/Substituição
    const findModal = document.getElementById('find-modal');
    const findInput = document.getElementById('find-input');
    const findNextBtn = document.getElementById('find-next-btn');
    const findPreviousBtn = document.getElementById('find-previous-btn');
    const findStatus = document.getElementById('find-status');
    const closeFindBtn = document.getElementById('close-find');

    const replaceModal = document.getElementById('replace-modal');
    const replaceFindInput = document.getElementById('replace-find-input');
    const replaceWithInput = document.getElementById('replace-with-input');
    const replaceNextBtn = document.getElementById('replace-next-btn');
    const replacePreviousBtn = document.getElementById('replace-previous-btn');
    const replaceOneBtn = document.getElementById('replace-one-btn');
    const replaceAllBtn = document.getElementById('replace-all-btn');
    const replaceStatus = document.getElementById('replace-status');
    const closeReplaceBtn = document.getElementById('close-replace');

    // --- Estado da Aplicação ---
    let state = {
        subtitles: [],
        selectedSubtitles: [],
        history: [],
        historyIndex: -1,
        copiedSubtitles: [],
        zoomLevel: 1,
        cursorPosition: 0,
        isPlaying: false,
        mediaUrl: null,
        mediaDuration: 0,
        lastSelected: null,
        isDraggingCursor: false,
        lastAdjustRequest: null,
        waveformData: null,
        audioDuration: 0,
        autoGenerateChars: true,
        tracks: ['Track 1', 'Track 2'],
        activeTrack: 'Track 1',
        hiddenTracks: [], // Trilhas ocultas no preview
        language: 'pt-br'
    };

    // --- Internacionalização (i18n) ---
    let translations = {};

    async function initI18n() {
        // 1. Tenta carregar da variável global (languages.js) - Funciona localmente sem server
        if (typeof I18N_DATA !== 'undefined') {
            translations = I18N_DATA;
            console.log('Traduções carregadas via languages.js (Global)');
        } else {
            // 2. Fallback: tenta fetch no JSON (caso use servidor)
            try {
                const response = await fetch('languages.json');
                if (response.ok) {
                    translations = await response.json();
                }
            } catch (error) {
                console.warn('Não foi possível carregar traduções.', error);
            }
        }

        // Popula o seletor de idiomas dinamicamente
        if (languageSelector) {
            languageSelector.innerHTML = ''; // Limpa opções existentes
            Object.keys(translations).forEach(lang => {
                const option = document.createElement('option');
                option.value = lang;
                option.textContent = lang.toUpperCase();
                languageSelector.appendChild(option);
            });
        }

        // Tenta detectar o idioma do navegador ou usa o padrão
        const browserLang = navigator.language.toLowerCase();
        let defaultLang = 'en';

        // Verifica se temos tradução para a lingua exata ou só para o prefixo (pt-br vs pt)
        if (translations[browserLang]) defaultLang = browserLang;
        else if (translations[browserLang.split('-')[0]]) defaultLang = browserLang.split('-')[0];
        else if (translations['pt-br']) defaultLang = 'pt-br'; // Preferência por PT-BR se disponível

        // Garante que o idioma selecionado existe nas traduções, senão usa o primeiro disponível
        if (!translations[defaultLang]) {
            defaultLang = Object.keys(translations)[0];
        }

        updateState({ language: defaultLang });
        if (languageSelector) languageSelector.value = defaultLang;

        applyTranslations();
    }

    function t(key) {
        if (translations[state.language] && translations[state.language][key]) {
            return translations[state.language][key];
        }
        // Fallback para inglês se não houver na lingua selecionada
        if (translations['en'] && translations['en'][key]) {
            return translations['en'][key];
        }
        return key;
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = t(key);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = t(key);
        });

        updateIndicators();
    }

    function updateIndicators() {
        // Atualiza indicadores dinâmicos
        if (zoomIndicator) {
            zoomIndicator.innerHTML = `<span data-i18n="zoom">${t('zoom')}</span>: ${state.zoomLevel.toFixed(1)}x`;
        }

        if (toggleLayoutBtn) {
            const is916 = workspace.classList.contains('layout-916');
            toggleLayoutBtn.textContent = is916 ? t('mode_169') : t('mode_916');
        }
    }

    // --- Funções de Atualização de Estado e Renderização ---

    function updateState(newState) {
        // Debug: rastreia mudanças no waveformData
        if ('waveformData' in newState && newState.waveformData !== state.waveformData) {
            console.log('[State] waveformData mudou:', {
                antes: state.waveformData ? state.waveformData.length + ' peaks' : 'null',
                depois: newState.waveformData ? newState.waveformData.length + ' peaks' : 'null',
                zoom: state.zoomLevel
            });
        }

        Object.assign(state, newState);

        // Atualiza indicadores e traduções se a linguagem mudar
        if (newState.language) {
            applyTranslations();
        } else {
            updateIndicators();
        }

        // Atualiza seletor de tracks se necessário
        if (newState.tracks || newState.activeTrack || newState.hiddenTracks) {
            renderTrackSelector();
        }
    }

    function recordHistory() {
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(state.subtitles))); // Deep copy
        updateState({ history: newHistory, historyIndex: newHistory.length - 1 });
    }

    function updateSubtitles(newSubs, record = true) {
        updateState({ subtitles: newSubs });
        if (record) {
            recordHistory();
        }
        renderTimeline();
        renderPreviewArea();
    }

    function renderTrackSelector() {
        if (!trackSelector) return;
        trackSelector.innerHTML = '';
        state.tracks.forEach(track => {
            const option = document.createElement('option');
            option.value = track;
            option.textContent = track;
            option.selected = (track === state.activeTrack);
            trackSelector.appendChild(option);
        });
    }



    // --- Lógica de Renderização ---

    function generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // Gera caracteres automaticamente a partir das palavras
    function generateCharsFromWords(subtitle) {
        // Lista de pontuações que devem receber menos tempo
        const punctuationChars = '.,;:!?¡¿‽⁇⁈⁉…-–—―()[]{}«»""\'\'`´';
        if (!subtitle.words || subtitle.words.length === 0) {
            // Se não tem words, gera chars do texto uniformemente
            const chars = [];
            const text = subtitle.text || '';
            const duration = subtitle.end - subtitle.start;

            // Calcula pesos: pontuação = 0.05, letras/números/espaços = 1.0
            const weights = [];
            let totalWeight = 0;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const isPunctuation = punctuationChars.includes(char);
                const weight = isPunctuation ? 0.05 : 1.0;
                weights.push(weight);
                totalWeight += weight;
            }

            let currentTime = subtitle.start;
            for (let i = 0; i < text.length; i++) {
                const charDuration = (weights[i] / totalWeight) * duration;
                chars.push({
                    char: text[i],
                    start: currentTime,
                    end: currentTime + charDuration
                });
                currentTime += charDuration;
            }
            return chars;
        }

        // Gera chars a partir das palavras
        const chars = [];
        subtitle.words.forEach(word => {
            const wordText = word.word || '';
            const wordDuration = word.end - word.start;

            // Calcula pesos para cada caractere da palavra
            const weights = [];
            let totalWeight = 0;
            for (let i = 0; i < wordText.length; i++) {
                const char = wordText[i];
                const isPunctuation = punctuationChars.includes(char);
                const weight = isPunctuation ? 0.05 : 1.0;
                weights.push(weight);
                totalWeight += weight;
            }

            let currentTime = word.start;
            for (let i = 0; i < wordText.length; i++) {
                const charDuration = (weights[i] / totalWeight) * wordDuration;
                chars.push({
                    char: wordText[i],
                    start: currentTime,
                    end: currentTime + charDuration
                });
                currentTime += charDuration;
            }
        });

        return chars;
    }

    function renderTimeline() {
        // Limpa a timeline
        timelineContent.innerHTML = '';
        timelineContent.appendChild(cursor);

        const totalDuration = Math.max(...state.subtitles.map(s => s.end), 10) + 60;
        const totalTracks = state.tracks.length;
        const rowHeight = 60; // Altura de cada "camada"

        timelineFrame.style.width = `${totalDuration * PIXELS_PER_SECOND * state.zoomLevel}px`;
        timelineFrame.style.height = `${75 + totalTracks * rowHeight}px`; // Ajusta altura total
        timelineContent.style.height = `${totalTracks * rowHeight}px`;

        // Renderiza fundos das camadas
        state.tracks.forEach((track, i) => {
            const isHidden = state.hiddenTracks.includes(track);
            const trackBg = document.createElement('div');
            trackBg.className = 'track-bg';
            if (track === state.activeTrack) {
                trackBg.classList.add('active');
            }
            // Não aplica mais opacity - hidden afeta APENAS o preview
            trackBg.style.top = `${i * rowHeight}px`;
            trackBg.style.height = `${rowHeight}px`;
            trackBg.style.pointerEvents = 'auto'; // Permite clique

            // Toggle de camada ao clicar no fundo
            trackBg.addEventListener('click', (e) => {
                // Impede que o clique no fundo mude o cursor de tempo (seek)
                e.stopPropagation();
                updateState({ activeTrack: track });
                renderTimeline();
            });

            const trackLabel = document.createElement('div');
            trackLabel.className = 'track-label-container';
            trackLabel.style.display = 'flex';
            trackLabel.style.alignItems = 'center';
            trackLabel.style.gap = '8px';
            trackLabel.style.padding = '4px 8px';
            trackLabel.style.position = 'absolute'; // Muda para absolute
            trackLabel.style.left = '0'; // Será atualizado pelo scroll
            trackLabel.style.top = '0';
            trackLabel.style.zIndex = '1000';
            trackLabel.style.background = '#2f3136';
            trackLabel.style.boxShadow = '2px 0 4px rgba(0,0,0,0.3)';
            trackLabel.style.width = 'fit-content';
            trackLabel.style.pointerEvents = 'none';
            trackLabel.dataset.trackLabel = 'true'; // Marca para atualizar no scroll

            const visibilityBtn = document.createElement('span');
            visibilityBtn.innerHTML = isHidden ? '❌' : '👁️';
            visibilityBtn.style.cursor = 'pointer';
            visibilityBtn.style.pointerEvents = 'auto'; // Reativa cliques no botão
            visibilityBtn.title = isHidden ? 'Mostrar no preview' : 'Ocultar no preview';
            visibilityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                let newHidden = [...state.hiddenTracks];
                if (isHidden) {
                    newHidden = newHidden.filter(t => t !== track);
                } else {
                    newHidden.push(track);
                }
                updateState({ hiddenTracks: newHidden });
                renderTimeline();
                renderCursor();
            });

            const textLabel = document.createElement('span');
            textLabel.className = 'track-label';
            textLabel.textContent = track;
            textLabel.style.pointerEvents = 'auto'; // Reativa cliques no texto

            trackLabel.appendChild(visibilityBtn);
            trackLabel.appendChild(textLabel);
            trackBg.appendChild(trackLabel);
            timelineContent.appendChild(trackBg);
        });

        // Renderiza legendas
        state.subtitles.forEach((sub, index) => {
            const block = document.createElement('div');
            block.className = 'subtitle-block';
            if (state.selectedSubtitles.includes(sub)) {
                block.classList.add('selected');
            }

            const trackIndex = state.tracks.indexOf(sub.track || state.tracks[0]);
            block.style.top = `${trackIndex * rowHeight + 10}px`; // 10px de margem interna
            block.style.left = `${sub.start * PIXELS_PER_SECOND * state.zoomLevel}px`;
            block.style.width = `${(sub.end - sub.start) * PIXELS_PER_SECOND * state.zoomLevel}px`;

            // Handles de redimensionamento do bloco
            const leftHandle = document.createElement('div');
            leftHandle.className = 'resize-handle left';
            leftHandle.addEventListener('mousedown', (e) => handleResizeStart(e, index, 'left'));

            const rightHandle = document.createElement('div');
            rightHandle.className = 'resize-handle right';
            rightHandle.addEventListener('mousedown', (e) => handleResizeStart(e, index, 'right'));

            // Área de arrastar que conterá a visualização apropriada
            const dragArea = document.createElement('div');
            dragArea.className = 'drag-area';
            dragArea.addEventListener('mousedown', (e) => handleMoveStart(e, index));

            // --- LÓGICA DE VISUALIZAÇÃO DE 3 NÍVEIS ---
            const showCharLevel = state.zoomLevel >= CHAR_ZOOM_THRESHOLD;
            const showWordLevel = state.zoomLevel >= WORD_ZOOM_THRESHOLD && sub.words && sub.words.length > 0;

            // Se deve mostrar chars mas não existem, gera automaticamente (se habilitado)
            let charsToShow = sub.chars;
            if (showCharLevel && state.autoGenerateChars && (!sub.chars || sub.chars.length === 0)) {
                charsToShow = generateCharsFromWords(sub);
            }

            if (showCharLevel && charsToShow && charsToShow.length > 0) {
                // NÍVEL 3: CARACTERES
                const charContainer = document.createElement('div');
                charContainer.className = 'char-container';

                charsToShow.forEach((char, charIdx) => {
                    if (char.start === undefined || char.end === undefined) return; // Ignora caracteres sem tempo

                    const charEl = document.createElement('div');
                    charEl.className = 'char';
                    charEl.textContent = char.char;

                    const charWidth = (char.end - char.start) * PIXELS_PER_SECOND * state.zoomLevel;
                    charEl.style.width = `${charWidth}px`;

                    // Adiciona handle entre caracteres
                    if (charIdx < charsToShow.length - 1) {
                        const nextChar = charsToShow[charIdx + 1];
                        if (nextChar.start !== undefined && nextChar.end !== undefined) {
                            const charHandle = document.createElement('div');
                            charHandle.className = 'char-handle';
                            charHandle.addEventListener('mousedown', (e) => handleCharResizeStart(e, index, charIdx));
                            charEl.appendChild(charHandle);
                        }
                    }
                    charContainer.appendChild(charEl);
                });
                dragArea.appendChild(charContainer);
            } else if (showWordLevel) {
                // NÍVEL 2: PALAVRAS
                const wordContainer = document.createElement('div');
                wordContainer.className = 'word-container';

                sub.words.forEach((word, wordIdx) => {
                    const wordEl = document.createElement('div');
                    wordEl.className = 'word';
                    wordEl.textContent = word.word;

                    const wordWidth = (word.end - word.start) * PIXELS_PER_SECOND * state.zoomLevel;
                    wordEl.style.width = `${wordWidth}px`;

                    // Adiciona handle entre palavras
                    if (wordIdx < sub.words.length - 1) {
                        const wordHandle = document.createElement('div');
                        wordHandle.className = 'word-handle';
                        wordHandle.addEventListener('mousedown', (e) => handleWordResizeStart(e, index, wordIdx));
                        wordEl.appendChild(wordHandle);
                    }
                    wordContainer.appendChild(wordEl);
                });
                dragArea.appendChild(wordContainer);
            } else {
                // NÍVEL 1: TEXTO COMPLETO
                const plainText = document.createElement('div');
                plainText.className = 'plain-text';
                plainText.textContent = sub.text;
                dragArea.appendChild(plainText);
            }

            block.appendChild(leftHandle);
            block.appendChild(dragArea);
            block.appendChild(rightHandle);

            block.addEventListener('click', (e) => handleSelectSubtitle(e, sub));
            block.addEventListener('contextmenu', (e) => handleContextMenu(e, sub));

            timelineContent.appendChild(block);
        });

        renderRuler(totalDuration);
        renderWaveform();

        // Atualiza posição dos labels de track baseado no scroll atual
        const scrollLeft = timelineScrollContainer.scrollLeft;
        document.querySelectorAll('[data-track-label="true"]').forEach(label => {
            label.style.left = `${scrollLeft}px`;
        });
    }

    function renderRuler(duration) {
        timelineRuler.innerHTML = '';
        for (let i = 0; i <= duration; i += 1) {
            const marker = document.createElement('div');
            marker.className = 'time-marker';
            marker.style.left = `${i * PIXELS_PER_SECOND * state.zoomLevel}px`;
            marker.textContent = `${i}s`;
            timelineRuler.appendChild(marker);
        }
    }

    function renderCursor() {
        const cursorPx = state.cursorPosition * PIXELS_PER_SECOND * state.zoomLevel;
        cursor.style.left = `${cursorPx}px`;

        // Sincroniza video/audio
        if (mediaPlayer.src) {
            const diff = Math.abs(mediaPlayer.currentTime - state.cursorPosition);
            if (diff > 0.1 || (!state.isPlaying && diff > 0.01)) {
                mediaPlayer.currentTime = state.cursorPosition;
            }
        }

        // Atualiza overlay (Mostra legendas de TODAS as tracks juntas, exceto ocultas)
        const activeSubs = state.subtitles.filter(s => {
            const track = s.track || 'Track 1';
            return state.cursorPosition >= s.start && state.cursorPosition <= s.end && !state.hiddenTracks.includes(track);
        });

        if (activeSubs.length > 0) {
            // Ordena por track para manter consistência visual
            activeSubs.sort((a, b) => {
                const idxA = state.tracks.indexOf(a.track || 'Track 1');
                const idxB = state.tracks.indexOf(b.track || 'Track 1');
                return idxA - idxB;
            });

            subtitleOverlay.innerHTML = activeSubs.map(s => s.text).join('<br>');
            subtitleOverlay.style.display = 'block';
        } else {
            subtitleOverlay.style.display = 'none';
        }
    }

    function renderPreviewArea() {
        if (state.selectedSubtitles.length !== 1) {
            previewArea.innerHTML = t('no_selection');
            return;
        }

        // Tenta pegar sempre a versão mais atualizada da legenda pelo ID
        const selectedId = state.selectedSubtitles[0].id;
        const subtitle = state.subtitles.find(s => s.id === selectedId) || state.selectedSubtitles[0];

        if (!previewArea.querySelector('textarea')) {
            previewArea.innerHTML = '';
            const textarea = document.createElement('textarea');
            textarea.rows = 4;
            textarea.style.width = '100%';
            textarea.addEventListener('input', handleTextChange);
            previewArea.appendChild(textarea);
        }

        const textarea = previewArea.querySelector('textarea');
        if (textarea && textarea !== document.activeElement && textarea.value !== subtitle.text) {
            textarea.value = subtitle.text;
        }
    }

    // --- Lógica de Waveform ---

    async function processAudioForWaveform(audioBuffer) {
        console.warn('[Audio] Iniciando processamento para waveform...', {
            canais: audioBuffer.numberOfChannels,
            amostras: audioBuffer.length,
            duração: audioBuffer.duration.toFixed(2) + 's',
            sampleRate: audioBuffer.sampleRate + 'Hz'
        });

        const rawData = audioBuffer.getChannelData(0); // Canal mono ou primeiro canal
        const samples = audioBuffer.length;
        const duration = audioBuffer.duration;

        // Calcula quantas amostras por pixel no zoom 1x
        const samplesPerPixel = Math.floor(samples / (duration * PIXELS_PER_SECOND));
        console.warn('[Audio] samplesPerPixel:', samplesPerPixel);

        const peaks = [];

        for (let i = 0; i < samples; i += samplesPerPixel) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < samplesPerPixel && i + j < samples; j++) {
                const val = rawData[i + j];
                if (val < min) min = val;
                if (val > max) max = val;
            }
            peaks.push({ min, max });
        }

        console.warn('[Audio] Waveform processado com sucesso!', {
            totalPeaks: peaks.length,
            primeiroPeak: peaks[0],
            ultimoPeak: peaks[peaks.length - 1]
        });

        updateState({
            waveformData: peaks,
            audioDuration: duration
        });
        renderWaveform();
    }

    function renderWaveform() {
        if (!state.waveformData || !waveformCanvas || !waveformCtx) {
            // Log apenas se já tivermos duração (já importou algo)
            if (state.audioDuration > 0) {
                console.warn('[Waveform] Dados não disponíveis:', {
                    hasData: !!state.waveformData,
                    hasCanvas: !!waveformCanvas,
                    hasCtx: !!waveformCtx
                });
            }
            return;
        }

        try {
            const scrollLeft = timelineScrollContainer.scrollLeft || 0;
            const viewportWidth = timelineScrollContainer.clientWidth || 1000;
            const height = 60;

            // --- OTIMIZAÇÃO CRÍTICA PARA ZOOM ALTO ---
            // Em vez de criar um canvas gigante (que crasha o browser > 32k px),
            // criamos um canvas do tamanho da tela e o movemos conforme o scroll.
            waveformCanvas.width = viewportWidth;
            waveformCanvas.height = height;
            waveformCanvas.style.width = `${viewportWidth}px`;
            waveformCanvas.style.left = `${scrollLeft}px`; // Segue o scroll

            waveformCtx.clearRect(0, 0, viewportWidth, height);
            waveformCtx.fillStyle = '#7289da';

            const peaks = state.waveformData;
            const middleY = height / 2;
            const amplitudeScale = height / 2;

            // Calcula a escala de tempo
            const totalWidth = state.audioDuration * PIXELS_PER_SECOND * state.zoomLevel;
            const pixelsPerPeak = totalWidth / peaks.length;

            if (!isFinite(pixelsPerPeak) || pixelsPerPeak <= 0) return;

            // Determina quais picos desenhar baseado no scroll
            const startIndex = Math.max(0, Math.floor(scrollLeft / pixelsPerPeak));
            const endIndex = Math.min(peaks.length, Math.ceil((scrollLeft + viewportWidth) / pixelsPerPeak));

            console.log('[Waveform] Renderizando viewport:', {
                zoom: state.zoomLevel.toFixed(1) + 'x',
                totalWidth: totalWidth.toFixed(0) + 'px',
                viewportWidth,
                peaksInRange: endIndex - startIndex
            });

            for (let i = startIndex; i < endIndex; i++) {
                // Posição X relativa ao início da timeline
                const xTimeline = i * pixelsPerPeak;
                // Posição X relativa ao canvas (viewport)
                const xCanvas = xTimeline - scrollLeft;

                const peak = peaks[i];
                if (!peak) continue;

                const minY = middleY + (peak.min * amplitudeScale);
                const maxY = middleY + (peak.max * amplitudeScale);
                const peakHeight = Math.max(1, maxY - minY);

                waveformCtx.fillRect(xCanvas, minY, Math.max(1, pixelsPerPeak), peakHeight);
            }
        } catch (err) {
            console.error('[Waveform] Erro fatal na renderização:', err);
        }
    }

    // --- Handlers de Eventos ---

    importJsonBtn.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            let json = JSON.parse(event.target.result);

            // Detecta formato e converte se for Premiere
            const format = detectJSONFormat(json);
            if (format === 'premiere') {
                console.log('[Import] Detectado formato Premiere, convertendo...');
                json = convertPremiereToWhisperX(json);
            }

            const newSubs = (json.segments || []).map((s, i) => ({
                ...s,
                id: generateId() + "_import_" + Date.now() + i, // ID único para evitar conflitos no merge
                track: state.activeTrack // Força a importação para a camada ativa
            }));

            // Mantém legendas das OUTRAS tracks, mas limpa a track ATIVA para evitar sobreposição
            const otherTracksSubs = state.subtitles.filter(s => (s.track || 'Track 1') !== state.activeTrack);
            const mergedSubs = [...otherTracksSubs, ...newSubs].sort((a, b) => a.start - b.start);

            updateSubtitles(mergedSubs);

            // Limpa o input para permitir importar o mesmo arquivo novamente se necessário
            importJsonBtn.value = '';
        };
        reader.readAsText(file);
    });

    importMediaBtn.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        console.log('[Media] Arquivo selecionado:', {
            nome: file.name,
            tipo: file.type,
            tamanho: (file.size / 1024 / 1024).toFixed(2) + 'MB'
        });

        const url = URL.createObjectURL(file);
        updateState({ mediaUrl: url });
        mediaPlayer.src = url;
        mediaPlayer.style.display = 'block';
        videoPlaceholder.style.display = 'none';

        mediaPlayer.addEventListener('loadedmetadata', () => {
            console.log('[Media] Metadata carregado:', {
                duração: mediaPlayer.duration.toFixed(2) + 's'
            });
            updateState({ mediaDuration: mediaPlayer.duration });
            renderTimeline();
        });

        // Processa o áudio para gerar o waveform
        console.log('[Media] Iniciando processamento de áudio...');
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            await processAudioForWaveform(audioBuffer);
        } catch (err) {
            console.error('[Media] ERRO ao processar waveform:', err);
        }
    });

    saveJsonBtn.addEventListener('click', () => {
        exportModal.style.display = 'flex';
    });

    cancelExportBtn.addEventListener('click', () => {
        exportModal.style.display = 'none';
    });

    confirmExportBtn.addEventListener('click', () => {
        const format = exportFormatSelect.value;
        const trackMode = exportTrackModeSelect.value;

        let segmentsToSave = state.subtitles;
        if (trackMode === 'active') {
            segmentsToSave = state.subtitles.filter(s => (s.track || 'Track 1') === state.activeTrack);
        }

        // Ordena por tempo de início para garantir integridade em formatos sequenciais
        segmentsToSave.sort((a, b) => a.start - b.start);

        let content = '';
        let mimeType = '';
        let fileName = '';

        if (format === 'json') {
            const cleanSegments = segmentsToSave.map(({ id, ...rest }) => ({
                ...rest,
                track: undefined
            }));
            content = JSON.stringify({ segments: cleanSegments }, null, 2);
            mimeType = 'application/json';
            fileName = (trackMode === 'active' ? `subtitles-whisperx-${state.activeTrack}` : 'subtitles-whisperx-all') + '.json';
        } else if (format === 'premiere') {
            const premiereData = convertWhisperXToPremiere({ segments: segmentsToSave });
            content = JSON.stringify(premiereData, null, 2);
            mimeType = 'application/json';
            fileName = (trackMode === 'active' ? `subtitles-premiere-${state.activeTrack}` : 'subtitles-premiere-all') + '.json';
        } else if (format === 'srt') {
            content = convertToSRT(segmentsToSave);
            mimeType = 'text/plain';
            fileName = (trackMode === 'active' ? `subtitles-${state.activeTrack}` : 'subtitles-all') + '.srt';
        } else if (format === 'tsv') {
            content = convertToTSV(segmentsToSave);
            mimeType = 'text/tab-separated-values';
            fileName = (trackMode === 'active' ? `subtitles-${state.activeTrack}` : 'subtitles-all') + '.tsv';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        exportModal.style.display = 'none';
    });

    function formatTimeSRT(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    }

    function convertToSRT(segments) {
        return segments.map((s, i) => {
            return `${i + 1}\n${formatTimeSRT(s.start)} --> ${formatTimeSRT(s.end)}\n${s.text}\n`;
        }).join('\n');
    }

    function convertToTSV(segments) {
        const header = "start\tend\ttext\n";
        const rows = segments.map(s => `${s.start.toFixed(3)}\t${s.end.toFixed(3)}\t${s.text.replace(/\t/g, ' ').replace(/\n/g, ' ')}`);
        return header + rows.join('\n');
    }

    // --- Helpers de Conversão de Formato (Adobe Premiere) ---

    function detectJSONFormat(data) {
        if (!data || !data.segments || data.segments.length === 0) return 'unknown';
        const first = data.segments[0];
        if (first.words && first.words.length > 0) {
            const firstWord = first.words[0];
            if ('confidence' in firstWord && 'eos' in firstWord) return 'premiere';
            if ('score' in firstWord || 'word' in firstWord) return 'whisperx';
        }
        if (first.start !== undefined && first.end !== undefined && first.text !== undefined) return 'whisperx';
        return 'unknown';
    }

    function convertPremiereToWhisperX(data) {
        const whisperData = { segments: [] };
        data.segments.forEach(seg => {
            const words = (seg.words || []).map(w => ({
                word: w.text,
                start: w.start,
                end: Number((w.start + w.duration).toFixed(3)),
                score: w.confidence || 1.0
            }));

            if (words.length > 0) {
                whisperData.segments.push({
                    start: words[0].start,
                    end: words[words.length - 1].end,
                    text: words.map(w => w.word).join(' '),
                    words: words
                });
            }
        });
        return whisperData;
    }

    function convertWhisperXToPremiere(data) {
        const premiereData = { language: "pt-BR", segments: [] };
        const speakerId = "Speaker 1"; // Simplificado

        data.segments.forEach(seg => {
            const premWords = (seg.words || []).map((w, i, arr) => ({
                confidence: w.score || 1.0,
                duration: Number((w.end - w.start).toFixed(3)),
                eos: i === arr.length - 1,
                start: w.start,
                tags: [],
                text: w.word,
                type: "word"
            }));

            if (premWords.length > 0) {
                premiereData.segments.push({
                    duration: Number((premWords[premWords.length - 1].start + premWords[premWords.length - 1].duration - premWords[0].start).toFixed(3)),
                    language: "pt-BR",
                    speaker: speakerId,
                    start: premWords[0].start,
                    words: premWords
                });
            }
        });
        return premiereData;
    }

    addSubtitleBtn.addEventListener('click', () => {
        const newSubtitle = {
            id: generateId(),
            start: state.cursorPosition,
            end: state.cursorPosition + 2,
            text: t('new_subtitle_text'),
            track: state.activeTrack,
            words: [{ word: t('new_subtitle_text'), start: state.cursorPosition, end: state.cursorPosition + 2 }],
        };
        const newSubs = [...state.subtitles, newSubtitle];
        newSubs.sort((a, b) => a.start - b.start);
        updateSubtitles(newSubs);
    });

    playPauseBtn.addEventListener('click', handlePlayPause);

    // Listeners de Camadas (Tracks)
    trackSelector.addEventListener('change', (e) => {
        updateState({ activeTrack: e.target.value });
        renderTimeline();
    });

    addTrackBtn.addEventListener('click', () => {
        const name = prompt(t('prompt_new_track'), `${t('track_prefix')} ${state.tracks.length + 1}`);
        if (name && !state.tracks.includes(name)) {
            const newTracks = [...state.tracks, name];
            updateState({ tracks: newTracks, activeTrack: name });
            renderTimeline();
        }
    });

    // Listener para o checkbox de auto-gerar caracteres
    autoGenerateCharsCheckbox.addEventListener('change', (e) => {
        updateState({ autoGenerateChars: e.target.checked });
        renderTimeline();
    });

    // Listener para scroll da timeline (re-renderiza waveform)
    let scrollTimeout;
    timelineScrollContainer.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            renderWaveform();
        }, 16); // ~60fps
    });

    // --- Lógica de Interação da Timeline ---
    function handleWordResizeStart(e, subtitleIndex, wordIndex) {
        e.stopPropagation();
        const startX = e.clientX;
        const minDuration = 0.05; // Duração mínima para uma palavra

        // Faz uma cópia profunda para evitar mutação durante o arraste
        const originalSubs = JSON.parse(JSON.stringify(state.subtitles));
        const subtitle = originalSubs[subtitleIndex];
        const currentWord = subtitle.words[wordIndex];
        const nextWord = subtitle.words[wordIndex + 1];

        function onMouseMove(moveEvent) {
            const deltaX = (moveEvent.clientX - startX) / (PIXELS_PER_SECOND * state.zoomLevel);

            // Calcula o novo tempo de divisão, garantindo durações mínimas
            let newBoundary = currentWord.end + deltaX;
            newBoundary = Math.max(newBoundary, currentWord.start + minDuration);
            newBoundary = Math.min(newBoundary, nextWord.end - minDuration);

            // Atualiza os tempos na nossa cópia
            const tempSubs = JSON.parse(JSON.stringify(originalSubs));
            tempSubs[subtitleIndex].words[wordIndex].end = newBoundary;
            tempSubs[subtitleIndex].words[wordIndex + 1].start = newBoundary;

            // Atualiza a UI sem salvar no histórico
            updateSubtitles(tempSubs, false);
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            // Agora que a operação terminou, fazemos a atualização final
            // e salvamos no histórico
            const finalSubs = JSON.parse(JSON.stringify(state.subtitles)); // Pega o estado mais recente
            const finalSubtitle = finalSubs[subtitleIndex];
            const finalWord = finalSubtitle.words[wordIndex];
            const finalNextWord = finalSubtitle.words[wordIndex + 1];

            // Recalcula a fronteira uma última vez
            const deltaX = (event.clientX - startX) / (PIXELS_PER_SECOND * state.zoomLevel);
            let finalBoundary = currentWord.end + deltaX;
            finalBoundary = Math.max(finalBoundary, currentWord.start + minDuration);
            finalBoundary = Math.min(finalBoundary, nextWord.end - minDuration);

            // Atualiza o objeto final
            finalWord.end = finalBoundary;
            finalNextWord.start = finalBoundary;

            // Finalmente, atualiza o estado e grava no histórico
            updateSubtitles(finalSubs, true);
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function handleCharResizeStart(e, subtitleIndex, charIndex) {
        e.stopPropagation();
        const startX = e.clientX;
        const minDuration = 0.001; // Duração mínima para um caractere

        const originalSubs = JSON.parse(JSON.stringify(state.subtitles));
        const subtitle = originalSubs[subtitleIndex];
        const currentChar = subtitle.chars[charIndex];
        const nextChar = subtitle.chars[charIndex + 1];

        function onMouseMove(moveEvent) {
            const deltaX = (moveEvent.clientX - startX) / (PIXELS_PER_SECOND * state.zoomLevel);

            let newBoundary = currentChar.end + deltaX;
            newBoundary = Math.max(newBoundary, currentChar.start + minDuration);
            newBoundary = Math.min(newBoundary, nextChar.end - minDuration);

            const tempSubs = JSON.parse(JSON.stringify(originalSubs));
            tempSubs[subtitleIndex].chars[charIndex].end = newBoundary;
            tempSubs[subtitleIndex].chars[charIndex + 1].start = newBoundary;

            updateSubtitles(tempSubs, false); // Atualiza UI sem salvar histórico
        }

        function onMouseUp(event) {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            const finalSubs = JSON.parse(JSON.stringify(state.subtitles));
            const finalSubtitle = finalSubs[subtitleIndex];

            // Recalcula a fronteira final para precisão máxima
            const finalDeltaX = (event.clientX - startX) / (PIXELS_PER_SECOND * state.zoomLevel);
            let finalBoundary = currentChar.end + finalDeltaX;
            finalBoundary = Math.max(finalBoundary, currentChar.start + minDuration);
            finalBoundary = Math.min(finalBoundary, nextChar.end - minDuration);

            finalSubtitle.chars[charIndex].end = finalBoundary;
            finalSubtitle.chars[charIndex + 1].start = finalBoundary;

            updateSubtitles(finalSubs, true); // Salva a alteração no histórico
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function handleMoveStart(e, index) {
        e.stopPropagation();
        const startX = e.clientX;
        const initialSub = state.subtitles[index];
        const initialStart = initialSub.start;

        function onMouseMove(moveEvent) {
            const deltaX = (moveEvent.clientX - startX) / (PIXELS_PER_SECOND * state.zoomLevel);
            const newStart = Math.max(0, initialStart + deltaX);
            const duration = initialSub.end - initialSub.start;
            const newEnd = newStart + duration;

            const newSubs = [...state.subtitles];
            const movedSub = {
                ...initialSub,
                start: newStart,
                end: newEnd,
                words: (initialSub.words || []).map(w => ({
                    ...w,
                    start: w.start + (newStart - initialSub.start),
                    end: w.end + (newStart - initialSub.start)
                }))
            };
            newSubs[index] = movedSub;
            updateSubtitles(newSubs, false);
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            recordHistory();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function handleResizeStart(e, index, direction) {
        e.stopPropagation();
        const startX = e.clientX;
        const initialSub = state.subtitles[index];
        const { start, end } = initialSub;

        function onMouseMove(moveEvent) {
            const deltaX = (moveEvent.clientX - startX) / (PIXELS_PER_SECOND * state.zoomLevel);
            let newStart = start, newEnd = end;

            if (direction === 'left') {
                newStart = Math.max(0, start + deltaX);
                if (newStart >= end - 0.1) newStart = end - 0.1;
            } else {
                newEnd = Math.max(start + 0.1, end + deltaX);
            }

            const newSubs = [...state.subtitles];
            const updatedSub = { ...initialSub, start: newStart, end: newEnd };

            // Simplesmente corta as palavras que caem fora do novo intervalo,
            // sem redistribuir ou reordenar nada.
            const originalWords = initialSub.words || [];
            const clampedWords = [];
            for (const w of originalWords) {
                // Palavra completamente fora do novo intervalo: remove
                if (w.end <= newStart || w.start >= newEnd) continue;
                // Palavra parcialmente dentro: clamp nos limites
                clampedWords.push({
                    ...w,
                    start: Math.max(w.start, newStart),
                    end: Math.min(w.end, newEnd)
                });
            }
            updatedSub.words = clampedWords;
            updatedSub.text = clampedWords.map(w => w.word).join(' ');

            // Faz o mesmo para chars, se existirem
            if (initialSub.chars && initialSub.chars.length > 0) {
                const clampedChars = [];
                for (const c of initialSub.chars) {
                    if (c.end <= newStart || c.start >= newEnd) continue;
                    clampedChars.push({
                        ...c,
                        start: Math.max(c.start, newStart),
                        end: Math.min(c.end, newEnd)
                    });
                }
                updatedSub.chars = clampedChars;
            }

            newSubs[index] = updatedSub;
            updateSubtitles(newSubs, false);
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            recordHistory();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    function handleSelectSubtitle(e, subtitle) {
        e.stopPropagation();
        closeContextMenu();

        if (e.ctrlKey) {
            const newSelection = state.selectedSubtitles.includes(subtitle)
                ? state.selectedSubtitles.filter(s => s !== subtitle)
                : [...state.selectedSubtitles, subtitle];
            updateState({ selectedSubtitles: newSelection, lastSelected: subtitle });
        } else if (e.shiftKey && state.lastSelected) {
            const startIdx = state.subtitles.indexOf(state.lastSelected);
            const endIdx = state.subtitles.indexOf(subtitle);
            if (startIdx !== -1 && endIdx !== -1) {
                const selection = state.subtitles.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
                updateState({ selectedSubtitles: selection });
            }
        } else {
            updateState({ selectedSubtitles: [subtitle], lastSelected: subtitle });
        }
        renderTimeline();
        renderPreviewArea();
    }

    let adjustDebounceTimer = null;
    async function handleTextChange(e) {
        if (state.selectedSubtitles.length !== 1) return;
        const newText = e.target.value;
        const selectedId = state.selectedSubtitles[0].id;

        // Sempre busca o índice atual para evitar referências obsoletas
        const index = state.subtitles.findIndex(s => s.id === selectedId);
        if (index === -1) return;

        const oldSub = state.subtitles[index];
        const newWordsList = newText.trim().split(/\s+/).filter(w => w.length > 0);

        // Lógica de sincronização local de palavras (melhorada)
        let updatedWords = [];
        const oldWords = oldSub.words || [];

        if (newWordsList.length === oldWords.length) {
            // Mesma quantidade: preserva tempos, muda apenas o texto das palavras
            updatedWords = newWordsList.map((word, i) => ({ ...oldWords[i], word: word }));
        } else {
            // Quantidade diferente: redistribui uniformemente sobre a duração total da legenda
            const duration = oldSub.end - oldSub.start;
            const wDur = duration / Math.max(1, newWordsList.length);
            updatedWords = newWordsList.map((word, i) => ({
                word: word,
                start: oldSub.start + i * wDur,
                end: oldSub.start + (i + 1) * wDur
            }));
        }

        const updatedSub = {
            ...oldSub,
            text: newText,
            words: updatedWords,
            chars: []
        };

        const newSubs = [...state.subtitles];
        newSubs[index] = updatedSub;

        // Atualiza estado e seleção (mantendo a referência nova)
        updateState({
            subtitles: newSubs,
            selectedSubtitles: [updatedSub]
        });

        renderTimeline();

        // Debounce da API para não sobrecarregar e evitar conflitos de "save"
        clearTimeout(adjustDebounceTimer);
        adjustDebounceTimer = setTimeout(async () => {
            if (state.lastAdjustRequest) state.lastAdjustRequest.abort();
            const controller = new AbortController();
            updateState({ lastAdjustRequest: controller });

            try {
                const response = await fetch('/api/adjust-words', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        newText: newText,
                        newStart: updatedSub.start,
                        newEnd: updatedSub.end,
                        oldWords: updatedSub.words
                    })
                });

                if (response.ok) {
                    const finalWords = await response.json();
                    // Atualiza DEFINITIVO no estado
                    const currentSubs = [...state.subtitles];
                    const currentIdx = currentSubs.findIndex(s => s.id === updatedSub.id);
                    if (currentIdx !== -1) {
                        currentSubs[currentIdx] = { ...currentSubs[currentIdx], words: finalWords };
                        // Se ainda estivermos com essa legenda selecionada, atualiza a seleção também
                        const newSelection = state.selectedSubtitles[0]?.id === updatedSub.id
                            ? [currentSubs[currentIdx]]
                            : state.selectedSubtitles;

                        updateState({ subtitles: currentSubs, selectedSubtitles: newSelection });
                        renderTimeline();
                    }
                }
            } catch (err) {
                if (err.name !== 'AbortError') console.error("Erro API:", err);
            }
        }, 300); // 300ms de debounce
    }

    // Adiciona evento para gravar histórico quando terminar de editar
    previewArea.addEventListener('focusout', (e) => {
        if (e.target.tagName === 'TEXTAREA') {
            recordHistory();
        }
    });

    // --- Lógica do Cursor e Playback ---

    function setCursorPosition(pos) {
        updateState({ cursorPosition: Math.max(0, pos) });
        renderCursor();
    }

    function handlePlayPause() {
        updateState({ isPlaying: !state.isPlaying });
        playPauseBtn.textContent = state.isPlaying ? t('pause') : t('play');

        if (state.isPlaying) {
            if (mediaPlayer.src) mediaPlayer.play();
            playbackLoop();
        } else {
            if (mediaPlayer.src) mediaPlayer.pause();
        }
    }

    let lastTime = Date.now();
    function playbackLoop() {
        if (!state.isPlaying) return;

        if (mediaPlayer.src) {
            if (!state.isDraggingCursor) {
                setCursorPosition(mediaPlayer.currentTime);
            }
        } else {
            if (!state.isDraggingCursor) {
                const now = Date.now();
                const delta = (now - lastTime) / 1000;
                setCursorPosition(state.cursorPosition + delta);
                lastTime = now;
            }
        }

        // Auto-scroll da timeline
        const cursorPx = state.cursorPosition * PIXELS_PER_SECOND * state.zoomLevel;
        const containerWidth = timelineScrollContainer.clientWidth;
        const scrollLeft = timelineScrollContainer.scrollLeft;

        if (cursorPx < scrollLeft || cursorPx > scrollLeft + containerWidth) {
            timelineScrollContainer.scrollLeft = cursorPx - containerWidth / 2;
        }

        requestAnimationFrame(playbackLoop);
    }

    if (mediaPlayer.src) {
        mediaPlayer.addEventListener('timeupdate', () => {
            if (state.isPlaying) {
                setCursorPosition(mediaPlayer.currentTime);
            }
        });
        mediaPlayer.addEventListener('ended', () => handlePlayPause());
    }

    // --- Lógica de Teclado e Contexto ---

    window.addEventListener('keydown', async (e) => {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        let handled = true;
        switch (e.key) {
            case ' ': e.preventDefault(); handlePlayPause(); break;
            case 'Delete': handleDelete(); break;
            case 'k': case 'K': await handleSplit(); break;
            case 'g': case 'G': handleMerge(); break;
            case 'c': if (e.ctrlKey) handleCopy(); break;
            case 'v': if (e.ctrlKey) handlePaste(); break;
            case 'z': if (e.ctrlKey) handleUndo(); break;
            case 'y': if (e.ctrlKey) handleRedo(); break;
            case 'ArrowLeft': setCursorPosition(state.cursorPosition - (e.shiftKey ? 1 : 0.1)); break;
            case 'ArrowRight': setCursorPosition(state.cursorPosition + (e.shiftKey ? 1 : 0.1)); break;
            default: handled = false; break;
        }
        if (handled) e.preventDefault();
    });

    function handleDelete() {
        if (state.selectedSubtitles.length === 0) return;
        const idsToDelete = new Set(state.selectedSubtitles.map(s => state.subtitles.indexOf(s)));
        const newSubs = state.subtitles.filter((_, index) => !idsToDelete.has(index));
        updateSubtitles(newSubs);
        updateState({ selectedSubtitles: [] });
    }

    async function handleSplit() {
        const subtitleToSplit = state.selectedSubtitles.length === 1
            ? state.selectedSubtitles[0]
            : state.subtitles.find(sub => state.cursorPosition > sub.start && state.cursorPosition < sub.end);

        if (!subtitleToSplit) return;

        const response = await fetch('/api/split-subtitle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subtitle: subtitleToSplit,
                splitTime: state.cursorPosition,
                charLevel: state.zoomLevel >= CHAR_ZOOM_THRESHOLD
            })
        });

        if (!response.ok) {
            console.error("Falha ao dividir a legenda");
            return;
        }

        const [before, after] = await response.json();

        // Atribui novos IDs únicos para evitar colisão
        before.id = generateId();
        after.id = generateId();

        const index = state.subtitles.findIndex(s => s.id === subtitleToSplit.id);
        if (index === -1) return;

        const newSubs = [...state.subtitles];
        newSubs.splice(index, 1, before, after);

        // Atualiza as legendas e limpa a seleção para forçar o usuário a re-selecionar o lado que deseja editar
        updateSubtitles(newSubs);
        updateState({ selectedSubtitles: [] });
    }

    function handleMerge() {
        if (state.selectedSubtitles.length < 2) return;
        const sorted = [...state.selectedSubtitles].sort((a, b) => a.start - b.start);
        const merged = {
            id: generateId(),
            start: sorted[0].start,
            end: sorted[sorted.length - 1].end,
            text: sorted.map(s => s.text).join(' '),
            words: sorted.flatMap(s => s.words || []),
        };

        const idsToMerge = new Set(state.selectedSubtitles.map(s => state.subtitles.indexOf(s)));
        let newSubs = state.subtitles.filter((_, index) => !idsToMerge.has(index));
        newSubs.push(merged);
        newSubs.sort((a, b) => a.start - b.start);

        updateSubtitles(newSubs);
        updateState({ selectedSubtitles: [merged] });
    }

    function handleCopy() {
        if (state.selectedSubtitles.length === 0) return;
        updateState({ copiedSubtitles: JSON.parse(JSON.stringify(state.selectedSubtitles)) });
    }

    function handlePaste() {
        if (state.copiedSubtitles.length === 0) return;
        const firstStart = Math.min(...state.copiedSubtitles.map(s => s.start));
        const newSubsToAdd = state.copiedSubtitles.map(sub => {
            const offset = sub.start - firstStart;
            const duration = sub.end - sub.start;
            const timeShift = (state.cursorPosition + offset) - sub.start;
            return {
                ...sub,
                id: generateId(),
                start: state.cursorPosition + offset,
                end: state.cursorPosition + offset + duration,
                track: state.activeTrack, // Cola na camada ativa!
                words: (sub.words || []).map(w => ({
                    ...w,
                    start: w.start + timeShift,
                    end: w.end + timeShift
                })),
                chars: (sub.chars || []).map(c => ({
                    ...c,
                    start: c.start !== undefined ? c.start + timeShift : undefined,
                    end: c.end !== undefined ? c.end + timeShift : undefined
                }))
            };
        });

        const newSubs = [...state.subtitles, ...newSubsToAdd];
        newSubs.sort((a, b) => a.start - b.start);
        updateSubtitles(newSubs);
    }

    function handleUndo() {
        if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1;
            const subs = JSON.parse(JSON.stringify(state.history[newIndex]));
            updateState({ historyIndex: newIndex });
            updateSubtitles(subs, false); // Não grava novo histórico
            updateState({ selectedSubtitles: [] });
        }
    }

    function handleRedo() {
        if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1;
            const subs = JSON.parse(JSON.stringify(state.history[newIndex]));
            updateState({ historyIndex: newIndex });
            updateSubtitles(subs, false);
            updateState({ selectedSubtitles: [] });
        }
    }

    function handleContextMenu(e, subtitle = null) {
        e.preventDefault();
        e.stopPropagation();

        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.style.top = `${e.pageY}px`;
        contextMenu.innerHTML = ''; // Limpa

        if (subtitle && !state.selectedSubtitles.includes(subtitle)) {
            updateState({ selectedSubtitles: [subtitle] });
            renderTimeline();
            renderPreviewArea();
        }

        const actions = [];
        if (state.selectedSubtitles.length > 0) {
            if (state.selectedSubtitles.length === 1) actions.push({ label: t('split'), action: handleSplit });
            actions.push({ label: t('copy'), action: handleCopy });
            actions.push({ label: t('delete'), action: handleDelete });
            if (state.selectedSubtitles.length > 1) actions.push({ label: t('merge'), action: handleMerge });
        }
        if (state.copiedSubtitles.length > 0) {
            actions.push({ label: t('paste'), action: handlePaste });
        }
        actions.push({ label: t('undo'), action: handleUndo });
        actions.push({ label: t('redo'), action: handleRedo });

        actions.forEach(({ label, action }) => {
            const item = document.createElement('div');
            item.textContent = label;
            item.addEventListener('click', () => {
                action();
                closeContextMenu();
            });
            contextMenu.appendChild(item);
        });
    }

    function closeContextMenu() {
        contextMenu.style.display = 'none';
    }

    timelineFrame.addEventListener('contextmenu', handleContextMenu);
    app.addEventListener('click', closeContextMenu);

    timelineScrollContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.ctrlKey) {
            // --- LÓGICA DE ZOOM AVANÇADA (ZOOM EM DIREÇÃO AO CURSOR) ---

            // 1. Onde o mouse está em relação ao container que rola?
            const rect = timelineScrollContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;

            // 2. Em que ponto do tempo o cursor do mouse está?
            const timeAtMouse = (timelineScrollContainer.scrollLeft + mouseX) / (PIXELS_PER_SECOND * state.zoomLevel);

            // 3. Calcula o novo nível de zoom (com limites maiores)
            const delta = e.deltaY > 0 ? -0.2 : 0.2; // Aumenta a sensibilidade
            const newZoom = Math.max(0.2, Math.min(100, state.zoomLevel + delta)); // Limites: 0.2x até 100x

            // Se o zoom não mudou (atingiu o limite), não faz mais nada.
            if (newZoom === state.zoomLevel) return;

            updateState({ zoomLevel: newZoom });

            // 4. Após o zoom, a posição do tempo sob o mouse (timeAtMouse) agora corresponde a um novo valor em pixels.
            const newMousePxPos = timeAtMouse * PIXELS_PER_SECOND * state.zoomLevel;

            // 5. Ajusta a posição da barra de rolagem para que o ponto do tempo sob o mouse permaneça no mesmo lugar na tela.
            timelineScrollContainer.scrollLeft = newMousePxPos - mouseX;

        } else {
            // Scroll horizontal normal (Shift + Scroll ou touchpad)
            timelineScrollContainer.scrollLeft += e.deltaY;
        }
        renderTimeline();
        renderCursor();
    }, { passive: false });

    // Atualiza a posição dos labels das tracks quando rola
    timelineScrollContainer.addEventListener('scroll', () => {
        const scrollLeft = timelineScrollContainer.scrollLeft;
        document.querySelectorAll('[data-track-label="true"]').forEach(label => {
            label.style.left = `${scrollLeft}px`;
        });
    });

    timelineFrame.addEventListener('mousedown', (e) => {
        // Se clicar em um bloco de legenda, handle OU no fundo de uma track, 
        // não inicia o arraste do cursor (seek) se quisermos apenas trocar de track.
        // Mas o trackBg.addEventListener já tem stopPropagation, então aqui só filtramos o resto.
        if (e.target.closest('.subtitle-block') || e.target.closest('.resize-handle') || e.target.closest('.word-handle') || e.target.closest('.char-handle') || e.target.closest('.track-bg')) {
            return;
        }

        const rect = timelineFrame.getBoundingClientRect();
        const updateCursorFromEvent = (event) => {
            const x = event.clientX - rect.left;
            const pos = Math.max(0, x / (PIXELS_PER_SECOND * state.zoomLevel));
            setCursorPosition(pos);
        };

        updateCursorFromEvent(e);
        updateState({ isDraggingCursor: true });

        const onMouseMove = (moveEvent) => {
            updateCursorFromEvent(moveEvent);
        };

        const onMouseUp = () => {
            updateState({ isDraggingCursor: false });
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        if (!e.ctrlKey && !e.shiftKey) {
            updateState({ selectedSubtitles: [] });
            renderTimeline();
            renderPreviewArea();
        }
    });

    cursor.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const rect = timelineFrame.getBoundingClientRect();
        updateState({ isDraggingCursor: true });

        const onMouseMove = (moveEvent) => {
            const x = moveEvent.clientX - rect.left;
            const pos = Math.max(0, x / (PIXELS_PER_SECOND * state.zoomLevel));
            setCursorPosition(pos);
        };

        const onMouseUp = () => {
            updateState({ isDraggingCursor: false });
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // --- Inicialização ---
    initI18n(); // Carrega traduções primeiro
    renderTrackSelector();
    initResizers();
    updateSubtitles([]); // Grava o estado inicial no histórico

    if (languageSelector) {
        languageSelector.addEventListener('change', (e) => {
            updateState({ language: e.target.value });
        });
    }

    if (splitPunctuationBtn) {
        splitPunctuationBtn.addEventListener('click', handleSplitByPunctuation);
    }

    function handleSplitByPunctuation() {
        const punctuation = ['.', '!', '?', ')', 'よ', 'ね', 'の', 'さ', 'ぞ', 'な', 'か', '！', '。', '」', '…', ','];
        const input = prompt(t('prompt_max_chars'), "80");
        if (input === null) return;

        const maxLen = parseInt(input) || 0;
        let hasChanged = false;
        let newSubtitles = [];

        state.subtitles.forEach(sub => {
            const splitResults = smartSplitSubtitle(sub, punctuation, maxLen);
            if (splitResults.length > 1) hasChanged = true;
            newSubtitles = newSubtitles.concat(splitResults);
        });

        if (hasChanged) {
            updateSubtitles(newSubtitles.sort((a, b) => a.start - b.start));
            renderTimeline();
            renderPreviewArea();
        }
    }

    function smartSplitSubtitle(sub, punctuation, maxLen) {
        if (maxLen > 0 && sub.text.length <= maxLen) return [sub];

        if (!sub.words || sub.words.length === 0) {
            const text = sub.text.trim();
            const splitPos = findBestSplitPosition(text, punctuation, maxLen);

            if (splitPos === -1) return [sub];

            const part1 = text.substring(0, splitPos).trim();
            const part2 = text.substring(splitPos).trim();

            if (!part1 || !part2) return [sub];

            const duration = sub.end - sub.start;
            const t1 = (part1.length / text.length) * duration;

            const sub1 = { ...sub, id: generateId(), end: sub.start + t1, text: part1, words: [] };
            const sub2 = { ...sub, id: generateId(), start: sub.start + t1, text: part2, words: [] };

            return [sub1, ...smartSplitSubtitle(sub2, punctuation, maxLen)];
        }

        const bestWordIdx = findBestWordSplitIndex(sub.words, punctuation, maxLen);

        if (bestWordIdx === -1 || bestWordIdx === sub.words.length - 1) return [sub];

        const part1Words = sub.words.slice(0, bestWordIdx + 1);
        const part2Words = sub.words.slice(bestWordIdx + 1);

        const sub1 = {
            ...sub,
            id: generateId(),
            end: part1Words[part1Words.length - 1].end,
            text: part1Words.map(w => w.word).join(' ').trim(),
            words: part1Words
        };

        const sub2 = {
            ...sub,
            id: generateId(),
            start: part2Words[0].start,
            text: part2Words.map(w => w.word).join(' ').trim(),
            words: part2Words
        };

        return [sub1, ...smartSplitSubtitle(sub2, punctuation, maxLen)];
    }

    function findBestSplitPosition(text, punctuation, maxLen) {
        if (maxLen === 0) {
            for (let i = 0; i < text.length; i++) {
                if (punctuation.includes(text[i]) && i < text.length - 1) return i + 1;
            }
            return -1;
        }

        let bestPos = -1;
        for (let i = 0; i < text.length; i++) {
            if (punctuation.includes(text[i])) {
                const pos = i + 1;
                if (pos <= maxLen) bestPos = pos;
                else if (bestPos === -1) return pos;
                else break;
            }
        }
        return bestPos;
    }

    function findBestWordSplitIndex(words, punctuation, maxLen) {
        let runningText = "";
        let bestIdx = -1;

        for (let i = 0; i < words.length; i++) {
            runningText += (i === 0 ? "" : " ") + words[i].word.trim();
            const wordText = words[i].word.trim();
            const endsWithPunc = punctuation.some(p => wordText.endsWith(p));

            if (endsWithPunc) {
                if (maxLen === 0) return i;

                if (runningText.length <= maxLen) {
                    bestIdx = i;
                } else {
                    return bestIdx !== -1 ? bestIdx : i;
                }
            }
        }
        return bestIdx;
    }

    function initResizers() {
        // Resizer Horizontal (Ajusta Colunas do Grid)
        resizerH.addEventListener('mousedown', (e) => {
            e.preventDefault();
            resizerH.classList.add('active');
            const onMouseMove = (moveEvent) => {
                const workspaceRect = workspace.getBoundingClientRect();
                const x = moveEvent.clientX - workspaceRect.left;
                const percentage = (x / workspaceRect.width) * 100;

                if (percentage > 10 && percentage < 90) {
                    workspace.style.gridTemplateColumns = `${percentage}% 1fr`;
                    resizerH.style.left = `${percentage}%`;
                }
            };
            const onMouseUp = () => {
                resizerH.classList.remove('active');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Resizer Vertical (Ajusta Linhas do Grid)
        resizerV.addEventListener('mousedown', (e) => {
            e.preventDefault();
            resizerV.classList.add('active');
            const onMouseMove = (moveEvent) => {
                const workspaceRect = workspace.getBoundingClientRect();
                const y = moveEvent.clientY - workspaceRect.top;
                const percentage = (y / workspaceRect.height) * 100;

                if (percentage > 10 && percentage < 90) {
                    workspace.style.gridTemplateRows = `${percentage}% 1fr`;
                    resizerV.style.top = `${percentage}%`;
                }
            };
            const onMouseUp = () => {
                resizerV.classList.remove('active');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Toggle Modo 9:16
        toggleLayoutBtn.addEventListener('click', () => {
            workspace.classList.toggle('layout-916');
            const is916 = workspace.classList.contains('layout-916');

            if (is916) {
                // Modo 9:16: Reseta para proporção vertical padrão
                workspace.style.gridTemplateColumns = "1fr 350px";
                workspace.style.gridTemplateRows = "1fr 200px";
                resizerH.style.left = "calc(100% - 350px)";
                resizerV.style.top = "calc(100% - 200px)";
            } else {
                // Modo Normal (16:9): Reseta para proporção wide
                workspace.style.gridTemplateColumns = "1fr 1fr";
                workspace.style.gridTemplateRows = "1fr 200px";
                resizerH.style.left = "50%";
                resizerV.style.top = "calc(100% - 200px)";
            }
            updateIndicators();
        });

        // Posicionamento inicial dos resizers
        resizerH.style.left = "50%";
        resizerV.style.top = "calc(100% - 200px)";
    }

    // --- Lógica de Busca e Substituição ---

    let searchResults = [];
    let currentSearchIndex = -1;

    function performSearch(query) {
        if (!query) {
            searchResults = [];
            currentSearchIndex = -1;
            return [];
        }

        const results = [];
        const lowerQuery = query.toLowerCase();

        state.subtitles.forEach((sub, index) => {
            if (sub.text.toLowerCase().includes(lowerQuery)) {
                results.push({ subtitle: sub, index: index });
            }
        });

        return results;
    }

    function updateSearchStatus(statusElement, count) {
        if (count === 0) {
            statusElement.textContent = t('no_results');
        } else {
            statusElement.textContent = `${currentSearchIndex + 1} / ${count} ${t('results_count')}`;
        }
    }

    function navigateToResult(index) {
        if (searchResults.length === 0) return;

        currentSearchIndex = index;
        if (currentSearchIndex < 0) currentSearchIndex = searchResults.length - 1;
        if (currentSearchIndex >= searchResults.length) currentSearchIndex = 0;

        const result = searchResults[currentSearchIndex];
        updateState({ selectedSubtitles: [result.subtitle] });

        // Não move mais o cursor - apenas seleciona a legenda
        // setCursorPosition(result.subtitle.start);

        // Scroll automático até o bloco na timeline
        const blockPx = result.subtitle.start * PIXELS_PER_SECOND * state.zoomLevel;
        const containerWidth = timelineScrollContainer.clientWidth;
        const scrollTarget = blockPx - (containerWidth / 2); // Centraliza o bloco
        timelineScrollContainer.scrollLeft = Math.max(0, scrollTarget);

        renderTimeline();
        renderPreviewArea();

        // Destaca o texto encontrado no preview
        highlightSearchTerm();
    }

    function highlightSearchTerm() {
        const textarea = previewArea.querySelector('textarea');
        if (!textarea || state.selectedSubtitles.length !== 1) return;

        const findText = findInput?.value || replaceFindInput?.value;
        if (!findText) return;

        const subtitle = state.selectedSubtitles[0];
        const text = subtitle.text;

        // Cria um elemento temporário para mostrar o destaque
        const highlightDiv = document.createElement('div');
        highlightDiv.style.padding = '10px';
        highlightDiv.style.background = '#2f3136';
        highlightDiv.style.borderRadius = '4px';
        highlightDiv.style.color = 'white';
        highlightDiv.style.marginBottom = '10px';
        highlightDiv.style.fontSize = '14px';
        highlightDiv.style.lineHeight = '1.5';

        // Destaca o termo de busca
        const regex = new RegExp(`(${findText})`, 'gi');
        const highlightedText = text.replace(regex, '<span class="search-highlight">$1</span>');
        highlightDiv.innerHTML = highlightedText;

        // Insere antes do textarea
        if (previewArea.querySelector('.search-highlight-container')) {
            previewArea.querySelector('.search-highlight-container').remove();
        }
        highlightDiv.className = 'search-highlight-container';
        previewArea.insertBefore(highlightDiv, textarea);
    }

    function replaceInSubtitle(subtitle, findText, replaceText) {
        const newText = subtitle.text.replace(new RegExp(findText, 'gi'), replaceText);

        // Se o texto não mudou, retorna sem modificar
        if (newText === subtitle.text) {
            return subtitle;
        }

        // Reconstrói as palavras a partir do novo texto
        const newWordsList = newText.trim().split(/\s+/).filter(w => w.length > 0);
        const duration = subtitle.end - subtitle.start;
        const wordDuration = duration / Math.max(1, newWordsList.length);

        const newWords = newWordsList.map((word, i) => ({
            word: word,
            start: subtitle.start + (i * wordDuration),
            end: subtitle.start + ((i + 1) * wordDuration),
            score: 1.0 // Define score padrão para palavras substituídas
        }));

        return {
            ...subtitle,
            text: newText,
            words: newWords,
            chars: [] // Limpa chars para regenerar
        };
    }

    // Event Listeners para Find Modal
    if (closeFindBtn) {
        closeFindBtn.addEventListener('click', () => {
            findModal.style.display = 'none';
            searchResults = [];
            currentSearchIndex = -1;
            // Remove highlight ao fechar
            const highlightContainer = previewArea.querySelector('.search-highlight-container');
            if (highlightContainer) highlightContainer.remove();
        });
    }

    if (findInput) {
        findInput.addEventListener('input', () => {
            const query = findInput.value;
            searchResults = performSearch(query);
            currentSearchIndex = searchResults.length > 0 ? 0 : -1;
            updateSearchStatus(findStatus, searchResults.length);

            if (searchResults.length > 0) {
                navigateToResult(0);
            }
        });

        findInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    navigateToResult(currentSearchIndex - 1);
                } else {
                    navigateToResult(currentSearchIndex + 1);
                }
                updateSearchStatus(findStatus, searchResults.length);
            }
        });
    }

    if (findNextBtn) {
        findNextBtn.addEventListener('click', () => {
            navigateToResult(currentSearchIndex + 1);
            updateSearchStatus(findStatus, searchResults.length);
        });
    }

    if (findPreviousBtn) {
        findPreviousBtn.addEventListener('click', () => {
            navigateToResult(currentSearchIndex - 1);
            updateSearchStatus(findStatus, searchResults.length);
        });
    }

    // Event Listeners para Replace Modal
    if (closeReplaceBtn) {
        closeReplaceBtn.addEventListener('click', () => {
            replaceModal.style.display = 'none';
            searchResults = [];
            currentSearchIndex = -1;
            // Remove highlight ao fechar
            const highlightContainer = previewArea.querySelector('.search-highlight-container');
            if (highlightContainer) highlightContainer.remove();
        });
    }

    if (replaceFindInput) {
        replaceFindInput.addEventListener('input', () => {
            const query = replaceFindInput.value;
            searchResults = performSearch(query);
            currentSearchIndex = searchResults.length > 0 ? 0 : -1;
            updateSearchStatus(replaceStatus, searchResults.length);

            if (searchResults.length > 0) {
                navigateToResult(0);
            }
        });

        replaceFindInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    navigateToResult(currentSearchIndex - 1);
                } else {
                    navigateToResult(currentSearchIndex + 1);
                }
                updateSearchStatus(replaceStatus, searchResults.length);
            }
        });
    }

    if (replaceNextBtn) {
        replaceNextBtn.addEventListener('click', () => {
            navigateToResult(currentSearchIndex + 1);
            updateSearchStatus(replaceStatus, searchResults.length);
        });
    }

    if (replacePreviousBtn) {
        replacePreviousBtn.addEventListener('click', () => {
            navigateToResult(currentSearchIndex - 1);
            updateSearchStatus(replaceStatus, searchResults.length);
        });
    }

    if (replaceOneBtn) {
        replaceOneBtn.addEventListener('click', () => {
            if (searchResults.length === 0) return;

            const findText = replaceFindInput.value;
            const replaceText = replaceWithInput.value;

            const result = searchResults[currentSearchIndex];
            const subIndex = state.subtitles.findIndex(s => s.id === result.subtitle.id);

            if (subIndex !== -1) {
                const newSubs = [...state.subtitles];
                newSubs[subIndex] = replaceInSubtitle(newSubs[subIndex], findText, replaceText);
                updateSubtitles(newSubs);

                // Atualiza a busca
                searchResults = performSearch(findText);
                if (searchResults.length > 0 && currentSearchIndex >= searchResults.length) {
                    currentSearchIndex = searchResults.length - 1;
                }
                updateSearchStatus(replaceStatus, searchResults.length);

                if (searchResults.length > 0) {
                    navigateToResult(currentSearchIndex);
                }
            }
        });
    }

    if (replaceAllBtn) {
        replaceAllBtn.addEventListener('click', () => {
            if (searchResults.length === 0) return;

            const findText = replaceFindInput.value;
            const replaceText = replaceWithInput.value;

            const newSubs = state.subtitles.map(sub => {
                if (sub.text.toLowerCase().includes(findText.toLowerCase())) {
                    return replaceInSubtitle(sub, findText, replaceText);
                }
                return sub;
            });

            updateSubtitles(newSubs);

            // Atualiza a busca
            searchResults = performSearch(findText);
            currentSearchIndex = -1;
            updateSearchStatus(replaceStatus, searchResults.length);
        });
    }

    // Atalhos de teclado Ctrl+F e Ctrl+H
    window.addEventListener('keydown', (e) => {
        // Verifica se está digitando em algum input/textarea
        const tag = e.target.tagName;
        const isTyping = (tag === 'INPUT' || tag === 'TEXTAREA');

        // Ctrl+F para buscar (não abre se estiver digitando, exceto nos campos de busca)
        if (e.ctrlKey && e.key === 'f') {
            if (!isTyping || e.target === findInput || e.target === replaceFindInput) {
                e.preventDefault();
                findModal.style.display = 'flex';
                setTimeout(() => findInput.focus(), 100);
            }
        }

        // Ctrl+H para substituir (não abre se estiver digitando, exceto nos campos de substituição)
        if (e.ctrlKey && e.key === 'h') {
            if (!isTyping || e.target === findInput || e.target === replaceFindInput || e.target === replaceWithInput) {
                e.preventDefault();
                replaceModal.style.display = 'flex';
                setTimeout(() => replaceFindInput.focus(), 100);
            }
        }

        // ESC para fechar modals
        if (e.key === 'Escape') {
            findModal.style.display = 'none';
            replaceModal.style.display = 'none';
            searchResults = [];
            currentSearchIndex = -1;
            // Remove highlight ao fechar
            const highlightContainer = previewArea.querySelector('.search-highlight-container');
            if (highlightContainer) highlightContainer.remove();
        }
    });

    // Inicialização final
    if (languageSelector) {
        languageSelector.addEventListener('change', (e) => {
            updateState({ language: e.target.value });
        });
    }

    // Carrega traduções iniciais
    initI18n();
});