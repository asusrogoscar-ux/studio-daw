// Fonctions utilitaires pour Studio DAW

/**
 * Génère un ID unique
 */
function generateId(prefix = '') {
    return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formate le temps en secondes au format MM:SS ou HH:MM:SS
 */
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

/**
 * Formate le temps en mesures et beats
 */
function formatTimeInBeats(timeInSeconds, bpm) {
    const beatsPerSecond = bpm / 60;
    const totalBeats = timeInSeconds * beatsPerSecond;
    const measures = Math.floor(totalBeats / 4);
    const beats = Math.floor(totalBeats % 4);
    const fractions = (totalBeats % 1).toFixed(2).substring(2);
    
    return `${measures}:${beats}.${fractions}`;
}

/**
 * Convertit les beats en secondes
 */
function beatsToSeconds(beats, bpm) {
    return (beats * 60) / bpm;
}

/**
 * Convertit les secondes en beats
 */
function secondsToBeats(seconds, bpm) {
    return (seconds * bpm) / 60;
}

/**
 * Convertit la fréquence en note MIDI
 */
function frequencyToMidiNote(frequency) {
    return Math.round(69 + 12 * Math.log2(frequency / 440));
}

/**
 * Convertit la note MIDI en fréquence
 */
function midiNoteToFrequency(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * Convertit la note MIDI en nom de note
 */
function midiNoteToNoteName(note) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(note / 12) - 1;
    const noteIndex = note % 12;
    return `${notes[noteIndex]}${octave}`;
}

/**
 * Convertit le nom de note en note MIDI
 */
function noteNameToMidiNote(noteName) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const match = noteName.match(/^([A-G](#|b)?)(\d+)$/i);
    if (!match) return null;
    
    let note = match[1].toUpperCase().replace('B', '#').replace('#B', '#').replace('B#', '#');
    const octave = parseInt(match[2]);
    
    let noteIndex = notes.indexOf(note);
    if (noteIndex === -1) {
        // Essayer avec bémol
        note = note.replace('#', 'b');
        noteIndex = notes.indexOf(note);
    }
    
    if (noteIndex === -1) return null;
    
    return (octave + 1) * 12 + noteIndex;
}

/**
 * Clamp une valeur entre min et max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Map une valeur d'une plage à une autre
 */
function mapValue(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

/**
 * Convertit dB en gain linéaire
 */
function dbToGain(db) {
    return Math.pow(10, db / 20);
}

/**
 * Convertit gain linéaire en dB
 */
function gainToDb(gain) {
    return 20 * Math.log10(gain);
}

/**
 * Convertit la vélocité MIDI (0-127) en gain (0-1)
 */
function velocityToGain(velocity, curve = 'linear') {
    const normalized = velocity / 127;
    
    switch (curve) {
        case 'logarithmic':
            return Math.pow(normalized, 2);
        case 'exponential':
            return Math.sqrt(normalized);
        default: // linear
            return normalized;
    }
}

/**
 * Applique une courbe de vélocité
 */
function applyVelocityCurve(velocity, curve = 'linear') {
    switch (curve) {
        case 'logarithmic':
            return Math.round(velocity * velocity / 127);
        case 'exponential':
            return Math.round(Math.sqrt(velocity / 127) * 127);
        default: // linear
            return velocity;
    }
}

/**
 * Vérifie si une fonctionnalité est supportée par le navigateur
 */
function isSupported(feature) {
    const features = {
        webAudio: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
        webMidi: typeof navigator.requestMIDIAccess === 'function',
        mediaRecorder: typeof MediaRecorder !== 'undefined',
        indexedDB: typeof indexedDB !== 'undefined',
        audioWorklet: typeof AudioWorklet !== 'undefined' || typeof webkitAudioWorklet !== 'undefined',
        getUserMedia: typeof navigator.mediaDevices?.getUserMedia === 'function'
    };
    
    return features[feature] || false;
}

/**
 * Affiche un message de notification
 */
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

/**
 * Affiche une erreur
 */
function showError(message, error = null) {
    console.error(message, error);
    showToast(message, 'error', 5000);
}

/**
 * Affiche un avertissement
 */
function showWarning(message) {
    console.warn(message);
    showToast(message, 'warning', 4000);
}

/**
 * Affiche une confirmation
 */
function showConfirm(title, message, confirmAction, cancelAction = null) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-action');
    
    if (!modal) return;
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    
    confirmBtn.onclick = () => {
        closeModal('confirm-modal');
        if (confirmAction) confirmAction();
    };
    
    if (cancelAction) {
        const cancelBtn = modal.querySelector('.btn-secondary');
        cancelBtn.onclick = () => {
            closeModal('confirm-modal');
            cancelAction();
        };
    }
    
    modal.classList.remove('hidden');
}

/**
 * Ferme une modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * Ferme les paramètres
 */
function closeSettings() {
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel) {
        settingsPanel.classList.add('hidden');
    }
}

/**
 * Formate un nombre avec un suffixe d'unité
 */
function formatWithUnit(value, unit, decimals = 2) {
    return `${value.toFixed(decimals)} ${unit}`;
}

/**
 * Génère une couleur aléatoire
 */
function randomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

/**
 * Génère une couleur basée sur une chaîne
 */
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += value.toString(16).padStart(2, '0');
    }
    return color;
}

/**
 * Vérifie si on est en mode développement
 */
function isDevMode() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:';
}

/**
 * Debounce une fonction
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle une fonction
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone un objet
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj);
    }
    
    if (obj instanceof Array) {
        const arrCopy = [];
        for (let i = 0; i < obj.length; i++) {
            arrCopy[i] = deepClone(obj[i]);
        }
        return arrCopy;
    }
    
    const objCopy = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            objCopy[key] = deepClone(obj[key]);
        }
    }
    return objCopy;
}

/**
 * Fusionne deux objets profondément
 */
function deepMerge(target, source) {
    const output = { ...target };
    
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] instanceof Object && key in target) {
                output[key] = deepMerge(target[key], source[key]);
            } else {
                output[key] = source[key];
            }
        }
    }
    
    return output;
}

/**
 * Convertit HSL en RGB
 */
function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    
    let r, g, b;
    
    if (h >= 0 && h < 60) {
        [r, g, b] = [c, x, 0];
    } else if (h >= 60 && h < 120) {
        [r, g, b] = [x, c, 0];
    } else if (h >= 120 && h < 180) {
        [r, g, b] = [0, c, x];
    } else if (h >= 180 && h < 240) {
        [r, g, b] = [0, x, c];
    } else if (h >= 240 && h < 300) {
        [r, g, b] = [x, 0, c];
    } else {
        [r, g, b] = [c, 0, x];
    }
    
    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    ];
}

/**
 * Convertit RGB en HSL
 */
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        
        h *= 60;
    }
    
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Génère un nom de projet par défaut
 */
function generateDefaultProjectName() {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `Projet_${year}${month}${day}_${hours}${minutes}`;
}

/**
 * Vérifie si un nom de fichier est valide
 */
function isValidFileName(name) {
    return /^[^\/:*?"<>|]+$/.test(name);
}

/**
 * Télécharge un fichier
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Lit un fichier
 */
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

/**
 * Lit un fichier audio
 */
function readAudioFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const audioContext = APP_STATE.audioContext || new (window.AudioContext || window.webkitAudioContext)();
            audioContext.decodeAudioData(e.target.result)
                .then(resolve)
                .catch(reject);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Convertit un buffer audio en WAV blob
 */
function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * numChannels * bytesPerSample;
    
    const bufferLength = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // En-tête WAV
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Données audio
    const offset = 44;
    for (let i = 0; i < numChannels; i++) {
        const channelData = buffer.getChannelData(i);
        for (let j = 0; j < channelData.length; j++) {
            const sample = Math.max(-1, Math.min(1, channelData[j]));
            const intSample = sample < 0 ? sample * 32768 : sample * 32767;
            view.setInt16(offset + j * numChannels * bytesPerSample + i * bytesPerSample, intSample, true);
        }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

/**
 * Convertit un buffer audio en MP3 blob (nécessite lamejs)
 */
async function audioBufferToMp3(buffer) {
    try {
        // Charger lamejs si nécessaire
        if (typeof lamejs === 'undefined') {
            await loadScript('https://cdn.jsdelivr.net/npm/lamejs@1.2.0/lame.all.min.js');
        }
        
        const sampleRate = buffer.sampleRate;
        const numChannels = buffer.numberOfChannels;
        const samples = [];
        
        for (let i = 0; i < numChannels; i++) {
            samples.push(buffer.getChannelData(i));
        }
        
        const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
        const samplesLength = buffer.length;
        const mp3Data = [];
        
        const chunkSize = 1152;
        for (let i = 0; i < samplesLength; i += chunkSize) {
            const chunk = samples.map(channel => channel.subarray(i, Math.min(i + chunkSize, samplesLength)));
            const mp3buf = mp3encoder.encodeBuffer(chunk);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }
        
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
        
        const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
        return mp3Blob;
    } catch (error) {
        console.error('Erreur lors de la conversion MP3:', error);
        return null;
    }
}

/**
 * Charge un script dynamiquement
 */
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Convertit MIDI note number en fréquence
 */
function midiToFrequency(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * Convertit fréquence en MIDI note number
 */
function frequencyToMidi(freq) {
    return 69 + 12 * Math.log2(freq / 440);
}

/**
 * Génère un nom de note à partir du numéro MIDI
 */
function getNoteName(midiNote) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = notes[midiNote % 12];
    return `${note}${octave}`;
}

/**
 * Génère un oscillateur simple
 */
function createOscillator(audioContext, type = 'sine', frequency = 440, gain = 0.5) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = gain;
    
    oscillator.connect(gainNode);
    
    return { oscillator, gainNode };
}

/**
 * Génère un enveloppe ADSR
 */
function createADSR(audioContext, attack = 0.1, decay = 0.3, sustain = 0.5, release = 0.2) {
    const now = audioContext.currentTime;
    const env = audioContext.createGain();
    
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now + attack);
    env.gain.linearRampToValueAtTime(sustain, now + attack + decay);
    
    return {
        gain: env,
        release: () => {
            const releaseTime = audioContext.currentTime;
            env.gain.linearRampToValueAtTime(0, releaseTime + release);
        }
    };
}

/**
 * Crée un filtre passe-bas
 */
function createLowPassFilter(audioContext, frequency = 1000, q = 1) {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequency;
    filter.Q.value = q;
    return filter;
}

/**
 * Crée un filtre passe-haut
 */
function createHighPassFilter(audioContext, frequency = 500, q = 1) {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = frequency;
    filter.Q.value = q;
    return filter;
}

/**
 * Crée un filtre passe-bande
 */
function createBandPassFilter(audioContext, frequency = 1000, q = 1) {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = q;
    return filter;
}

/**
 * Crée un compresseur
 */
function createCompressor(audioContext, threshold = -24, knee = 30, ratio = 4, attack = 0.003, release = 0.25) {
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = threshold;
    compressor.knee.value = knee;
    compressor.ratio.value = ratio;
    compressor.attack.value = attack;
    compressor.release.value = release;
    return compressor;
}

/**
 * Crée une réverbération simple
 */
function createReverb(audioContext, decay = 3, wet = 0.3) {
    const convolver = audioContext.createConvolver();
    const gain = audioContext.createGain();
    const dry = audioContext.createGain();
    const wetGain = audioContext.createGain();
    const merger = audioContext.createChannelMerger(2);
    
    // Créer un impulse response simple pour la réverb
    const duration = decay;
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
        const n = length - i;
        const value = (Math.random() * 2 - 1) * Math.pow(n / length, 2);
        left[i] = value;
        right[i] = value * 0.8;
    }
    
    convolver.buffer = impulse;
    wetGain.gain.value = wet;
    dry.gain.value = 1 - wet;
    
    return {
        input: convolver,
        dry: dry,
        wet: wetGain,
        output: merger,
        connect: () => {
            // Connexion interne
            convolver.connect(wetGain);
            wetGain.connect(merger, 0, 0);
            wetGain.connect(merger, 0, 1);
        }
    };
}

/**
 * Crée un delay
 */
function createDelay(audioContext, delayTime = 0.5, feedback = 0.5, wet = 0.3) {
    const delay = audioContext.createDelay();
    const feedbackGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    const merger = audioContext.createChannelMerger(2);
    
    delay.delayTime.value = delayTime;
    feedbackGain.gain.value = feedback;
    wetGain.gain.value = wet;
    dryGain.gain.value = 1 - wet;
    
    // Connexion du feedback
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);
    
    return {
        input: delay,
        dry: dryGain,
        wet: wetGain,
        output: merger,
        connect: () => {
            delay.connect(wetGain);
            wetGain.connect(merger, 0, 0);
            wetGain.connect(merger, 0, 1);
        },
        setDelayTime: (time) => {
            delay.delayTime.value = time;
        },
        setFeedback: (fb) => {
            feedbackGain.gain.value = fb;
        },
        setWet: (w) => {
            wetGain.gain.value = w;
            dryGain.gain.value = 1 - w;
        }
    };
}

/**
 * Crée un égaliseur 3 bandes
 */
function createEQ3(audioContext) {
    const low = createLowPassFilter(audioContext, 200);
    const mid = createBandPassFilter(audioContext, 1000, 1);
    const high = createHighPassFilter(audioContext, 2000);
    
    const lowGain = audioContext.createGain();
    const midGain = audioContext.createGain();
    const highGain = audioContext.createGain();
    
    const merger = audioContext.createChannelMerger(2);
    const splitter = audioContext.createChannelSplitter(2);
    
    return {
        input: splitter,
        output: merger,
        lowGain,
        midGain,
        highGain,
        connect: () => {
            // Connexion des filtres
            splitter.connect(low, 0);
            splitter.connect(low, 1);
            low.connect(lowGain);
            
            splitter.connect(mid, 0);
            splitter.connect(mid, 1);
            mid.connect(midGain);
            
            splitter.connect(high, 0);
            splitter.connect(high, 1);
            high.connect(highGain);
            
            // Connexion vers la sortie
            lowGain.connect(merger, 0, 0);
            lowGain.connect(merger, 0, 1);
            midGain.connect(merger, 0, 0);
            midGain.connect(merger, 0, 1);
            highGain.connect(merger, 0, 0);
            highGain.connect(merger, 0, 1);
        }
    };
}

/**
 * Crée une distorsion simple
 */
function createDistortion(audioContext, amount = 0.5) {
    const waveShaper = audioContext.createWaveShaper();
    const gain = audioContext.createGain();
    
    // Courbe de distorsion
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
        const x = (i / curve.length) * 2 - 1;
        curve[i] = (x < 0 ? -1 : 1) * Math.min(1, Math.abs(x) * (1 + amount * 10));
    }
    
    waveShaper.curve = curve;
    gain.gain.value = 1 - amount * 0.5;
    
    waveShaper.connect(gain);
    
    return {
        input: waveShaper,
        output: gain,
        setAmount: (amt) => {
            amount = clamp(amt, 0, 1);
            for (let i = 0; i < curve.length; i++) {
                const x = (i / curve.length) * 2 - 1;
                curve[i] = (x < 0 ? -1 : 1) * Math.min(1, Math.abs(x) * (1 + amount * 10));
            }
            waveShaper.curve = curve;
            gain.gain.value = 1 - amount * 0.5;
        }
    };
}

/**
 * Crée un limiteur
 */
function createLimiter(audioContext, threshold = -0.1) {
    const limiter = audioContext.createDynamicsCompressor();
    limiter.threshold.value = threshold;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.01;
    return limiter;
}

/**
 * Vérifie si un appareil est mobile
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Vérifie si l'appareil a un écran tactile
 */
function hasTouchScreen() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

/**
 * Ajoute un gestionnaire d'événement avec cleanup
 */
function addEventListenerWithCleanup(element, event, handler) {
    element.addEventListener(event, handler);
    return () => {
        element.removeEventListener(event, handler);
    };
}

/**
 * Crée un observateur de resize
 */
function createResizeObserver(callback) {
    const observer = new ResizeObserver(callback);
    return {
        observe: (element) => observer.observe(element),
        unobserve: (element) => observer.unobserve(element),
        disconnect: () => observer.disconnect()
    };
}

/**
 * Crée un observateur d'intersection
 */
function createIntersectionObserver(callback, options = {}) {
    const observer = new IntersectionObserver(callback, options);
    return {
        observe: (element) => observer.observe(element),
        unobserve: (element) => observer.unobserve(element),
        disconnect: () => observer.disconnect()
    };
}

/**
 * Formate un nombre en pourcentage
 */
function formatPercentage(value, decimals = 0) {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formate un nombre en dB
 */
function formatDb(value, decimals = 1) {
    return `${value.toFixed(decimals)} dB`;
}

/**
 * Vérifie si un élément est dans le viewport
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Scroll vers un élément
 */
function scrollToElement(element, behavior = 'smooth', block = 'nearest', inline = 'nearest') {
    element.scrollIntoView({ behavior, block, inline });
}

/**
 * Crée un élément avec des attributs
 */
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    for (const [key, value] of Object.entries(attributes)) {
        if (key.startsWith('data-')) {
            element.dataset[key.substring(5)] = value;
        } else if (key === 'className') {
            element.className = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else if (typeof value === 'function') {
            element[key] = value;
        } else {
            element.setAttribute(key, value);
        }
    }
    
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
}

/**
 * Crée un bouton
 */
function createButton(text, onClick, className = '', icon = '') {
    const button = document.createElement('button');
    button.className = `btn ${className}`;
    button.onclick = onClick;
    
    if (icon) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'icon';
        iconSpan.textContent = icon;
        button.appendChild(iconSpan);
    }
    
    if (text) {
        button.textContent = text;
    }
    
    return button;
}

/**
 * Crée une input
 */
function createInput(type, value, onChange, className = '', id = '') {
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    input.onchange = onChange;
    input.className = className;
    if (id) input.id = id;
    return input;
}

/**
 * Crée un slider
 */
function createSlider(min, max, value, onChange, className = '', id = '') {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.oninput = onChange;
    slider.className = `slider ${className}`;
    if (id) slider.id = id;
    return slider;
}

/**
 * Crée un label
 */
function createLabel(text, htmlFor = '') {
    const label = document.createElement('label');
    label.textContent = text;
    if (htmlFor) label.htmlFor = htmlFor;
    return label;
}

/**
 * Crée un div avec une classe
 */
function createDiv(className = '', content = '') {
    const div = document.createElement('div');
    div.className = className;
    if (content) div.textContent = content;
    return div;
}

/**
 * Crée un span avec une classe
 */
function createSpan(className = '', content = '') {
    const span = document.createElement('span');
    span.className = className;
    if (content) span.textContent = content;
    return span;
}

/**
 * Crée un canvas
 */
function createCanvas(width, height, className = '') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.className = className;
    return canvas;
}

/**
 * Dessine un VU meter sur un canvas
 */
function drawVuMeter(canvas, value, peakValue = 0, color = '#10b981', peakColor = '#ef4444') {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);
    
    // Dessiner le fond
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);
    
    // Dessiner les graduations
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 10; i++) {
        const y = height - (i * height / 10);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Dessiner la valeur actuelle
    const barHeight = value * height;
    ctx.fillStyle = color;
    ctx.fillRect(0, height - barHeight, width, barHeight);
    
    // Dessiner le pic
    if (peakValue > 0) {
        const peakHeight = peakValue * height;
        ctx.fillStyle = peakColor;
        ctx.fillRect(0, height - peakHeight, width, 2);
    }
}

/**
 * Dessine un spectre audio sur un canvas
 */
function drawSpectrum(canvas, analyser, color = '#6366f1') {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);
    
    // Obtenir les données de fréquence
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // Dessiner le spectre
    const barWidth = width / bufferLength * 2;
    
    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;
        ctx.fillStyle = color;
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    }
}

/**
 * Dessine une forme d'onde sur un canvas
 */
function drawWaveform(canvas, buffer, color = '#6366f1') {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);
    
    // Obtenir les données de l'onde
    const channelData = buffer.getChannelData(0);
    const step = Math.ceil(channelData.length / width);
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    for (let i = 0; i < width; i++) {
        const sample = channelData[i * step];
        const y = height / 2 - (sample * height / 2);
        
        if (i === 0) {
            ctx.moveTo(0, y);
        } else {
            ctx.lineTo(i, y);
        }
    }
    
    ctx.stroke();
}

/**
 * Crée un oscillateur avec enveloppe ADSR
 */
function createSynthVoice(audioContext, frequency = 440, type = 'sine', 
                          attack = 0.01, decay = 0.3, sustain = 0.5, release = 0.2, gain = 0.5) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gain, now + attack);
    gainNode.gain.linearRampToValueAtTime(gain * sustain, now + attack + decay);
    
    oscillator.connect(gainNode);
    
    return {
        oscillator,
        gainNode,
        start: () => oscillator.start(now),
        stop: (time) => {
            const stopTime = time || audioContext.currentTime;
            gainNode.gain.linearRampToValueAtTime(0, stopTime + release);
            oscillator.stop(stopTime + release);
        },
        setFrequency: (freq) => {
            oscillator.frequency.setTargetAtTime(freq, audioContext.currentTime, 0.01);
        },
        setGain: (g) => {
            const currentTime = audioContext.currentTime;
            const currentGain = gainNode.gain.value;
            gainNode.gain.cancelScheduledValues(currentTime);
            gainNode.gain.setValueAtTime(currentGain, currentTime);
            gainNode.gain.linearRampToValueAtTime(g, currentTime + 0.01);
        }
    };
}

/**
 * Crée un synthétiseur polyphonique simple
 */
function createPolySynth(audioContext, maxVoices = 8) {
    const voices = [];
    const output = audioContext.createGain();
    
    return {
        output,
        play: (frequency, velocity, type = 'sine', attack = 0.01, decay = 0.3, sustain = 0.5, release = 0.2) => {
            // Trouver une voix disponible
            let voice = voices.find(v => !v.oscillator);
            
            if (!voice && voices.length < maxVoices) {
                voice = {
                    oscillator: null,
                    gainNode: null,
                    note: null
                };
                voices.push(voice);
            }
            
            if (!voice) return; // Pas de voix disponible
            
            // Arrêter la voix actuelle si elle existe
            if (voice.oscillator) {
                voice.oscillator.stop();
                voice.oscillator = null;
            }
            
            // Créer une nouvelle voix
            const gain = velocityToGain(velocity);
            const voiceObj = createSynthVoice(audioContext, frequency, type, attack, decay, sustain, release, gain);
            
            voice.oscillator = voiceObj.oscillator;
            voice.gainNode = voiceObj.gainNode;
            voice.note = frequency;
            
            voiceObj.gainNode.connect(output);
            voiceObj.start();
            
            return {
                stop: () => {
                    voiceObj.stop();
                    voice.oscillator = null;
                    voice.gainNode = null;
                },
                setFrequency: (freq) => voiceObj.setFrequency(freq),
                setGain: (g) => voiceObj.setGain(g)
            };
        },
        stopAll: () => {
            voices.forEach(voice => {
                if (voice.oscillator) {
                    voice.oscillator.stop();
                    voice.oscillator = null;
                    voice.gainNode = null;
                }
            });
        }
    };
}

/**
 * Crée un sampleur simple
 */
function createSampler(audioContext) {
    const samples = {};
    const output = audioContext.createGain();
    
    return {
        output,
        loadSample: (name, buffer) => {
            samples[name] = buffer;
        },
        play: (name, pitch = 1, velocity = 127, when = 0) => {
            if (!samples[name]) {
                console.warn(`Sample ${name} non trouvé`);
                return;
            }
            
            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();
            
            source.buffer = samples[name];
            source.playbackRate.value = pitch;
            gainNode.gain.value = velocityToGain(velocity);
            
            source.connect(gainNode);
            gainNode.connect(output);
            
            source.start(when);
            
            return {
                stop: () => source.stop()
            };
        },
        getSample: (name) => samples[name]
    };
}
