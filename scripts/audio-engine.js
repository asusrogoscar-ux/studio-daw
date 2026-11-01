// Moteur audio principal pour Studio DAW

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.masterCompressor = null;
        this.masterMeter = null;
        this.metronome = null;
        this.destination = null;
        this.synths = {};
        this.samplers = {};
        this.effects = {};
        this.isInitialized = false;
        this.isRunning = false;
        this.resumePromise = null;
        
        // Paramètres
        this.bufferSize = CONFIG.audio.bufferSize;
        this.sampleRate = CONFIG.audio.sampleRate;
        this.latencyCompensation = CONFIG.audio.latencyCompensation;
        
        // Initialisation
        this.init();
    }
    
    async init() {
        try {
            // Vérifier la prise en charge
            if (!isSupported('webAudio')) {
                throw new Error(ERROR_MESSAGES.audioContext.create);
            }
            
            // Créer le contexte audio
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass({
                sampleRate: this.sampleRate,
                latencyHint: this.bufferSize / this.sampleRate
            });
            
            APP_STATE.audioContext = this.audioContext;
            
            // Créer les nœuds principaux
            this.createMasterChain();
            
            // Créer le métronome
            this.createMetronome();
            
            // Initialiser les synthés et samplers
            this.initInstruments();
            
            this.isInitialized = true;
            this.isRunning = true;
            
            console.log('Moteur audio initialisé avec succès');
            showToast('Moteur audio prêt!', 'success');
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du moteur audio:', error);
            showError('Erreur audio: ' + error.message);
            throw error;
        }
    }
    
    createMasterChain() {
        if (!this.audioContext) return;
        
        // Créer le nœud de gain maître
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = CONFIG.audio.masterVolume;
        
        // Créer le compresseur maître
        this.masterCompressor = createCompressor(
            this.audioContext,
            -1,  // threshold
            1,   // knee
            4,   // ratio
            0.003, // attack
            0.25  // release
        );
        
        // Créer l'analyseur de niveau maître
        this.masterMeter = this.audioContext.createAnalyser();
        this.masterMeter.fftSize = 256;
        this.masterMeter.smoothingTimeConstant = 0.8;
        
        // Créer le nœud de destination final
        this.destination = this.audioContext.destination;
        
        // Connecter la chaîne
        this.masterGain.connect(this.masterCompressor);
        this.masterCompressor.connect(this.masterMeter);
        this.masterMeter.connect(this.destination);
    }
    
    createMetronome() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        this.metronome = {
            oscillator,
            gainNode,
            isPlaying: false,
            bpm: CONFIG.project.bpm,
            beatCount: 0,
            
            start: () => {
                if (this.metronome.isPlaying) return;
                
                this.metronome.isPlaying = true;
                this.metronome.beatCount = 0;
                
                const interval = 60000 / this.metronome.bpm;
                
                const playBeat = () => {
                    if (!this.metronome.isPlaying) return;
                    
                    const now = this.audioContext.currentTime;
                    
                    // Jouer le son du métronome
                    gainNode.gain.cancelScheduledValues(now);
                    gainNode.gain.setValueAtTime(0.5 * CONFIG.project.metronomeVolume, now);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                    
                    // Accentuer le premier beat
                    if (this.metronome.beatCount % 4 === 0) {
                        gainNode.gain.setValueAtTime(0.8 * CONFIG.project.metronomeVolume, now);
                    }
                    
                    this.metronome.beatCount++;
                    
                    // Planifier le prochain beat
                    setTimeout(playBeat, interval);
                };
                
                // Démarrer le métronome
                playBeat();
            },
            
            stop: () => {
                this.metronome.isPlaying = false;
                const now = this.audioContext.currentTime;
                this.metronome.gainNode.gain.cancelScheduledValues(now);
                this.metronome.gainNode.gain.setValueAtTime(0, now);
            },
            
            setBpm: (bpm) => {
                this.metronome.bpm = bpm;
            },
            
            setVolume: (volume) => {
                CONFIG.project.metronomeVolume = volume;
            }
        };
    }
    
    initInstruments() {
        // Initialiser le synthé principal
        this.synths.piano = createPolySynth(this.audioContext, 16);
        this.synths.piano.output.connect(this.masterGain);
        
        this.synths.synth = createPolySynth(this.audioContext, 8);
        this.synths.synth.output.connect(this.masterGain);
        
        this.synths.bass = createPolySynth(this.audioContext, 8);
        this.synths.bass.output.connect(this.masterGain);
        
        this.synths.strings = createPolySynth(this.audioContext, 16);
        this.synths.strings.output.connect(this.masterGain);
        
        // Initialiser le sampler pour la drum machine
        this.samplers.drums = createSampler(this.audioContext);
        this.samplers.drums.output.connect(this.masterGain);
        
        // Charger les samples par défaut (à implémenter avec des vrais samples)
        this.loadDefaultSamples();
    }
    
    loadDefaultSamples() {
        // Pour l'instant, on crée des samples simples avec des oscillateurs
        // Dans une vraie application, on chargerait des fichiers audio
        
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.1;
        const length = Math.floor(sampleRate * duration);
        
        // Kick
        const kickBuffer = this.audioContext.createBuffer(1, length, sampleRate);
        const kickData = kickBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            kickData[i] = Math.sin(2 * Math.PI * 150 * t) * Math.exp(-t * 20) +
                         Math.sin(2 * Math.PI * 50 * t) * Math.exp(-t * 15);
        }
        this.samplers.drums.loadSample('kick', kickBuffer);
        
        // Snare
        const snareBuffer = this.audioContext.createBuffer(1, length, sampleRate);
        const snareData = snareBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            snareData[i] = (Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 30) +
                          0.5 * Math.random() * Math.exp(-t * 15)) * 0.5;
        }
        this.samplers.drums.loadSample('snare', snareBuffer);
        
        // Hi-Hat fermé
        const hihatClosedBuffer = this.audioContext.createBuffer(1, length, sampleRate);
        const hihatClosedData = hihatClosedBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            hihatClosedData[i] = (Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 40) +
                                0.5 * Math.sin(2 * Math.PI * 1600 * t) * Math.exp(-t * 40)) * 0.3;
        }
        this.samplers.drums.loadSample('hihat-closed', hihatClosedBuffer);
        
        // Hi-Hat ouvert
        const hihatOpenBuffer = this.audioContext.createBuffer(1, length * 2, sampleRate);
        const hihatOpenData = hihatOpenBuffer.getChannelData(0);
        for (let i = 0; i < hihatOpenBuffer.length; i++) {
            const t = i / sampleRate;
            hihatOpenData[i] = (Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t * 15) +
                              0.3 * Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 20)) * 0.4;
        }
        this.samplers.drums.loadSample('hihat-open', hihatOpenBuffer);
        
        // Clap
        const clapBuffer = this.audioContext.createBuffer(1, length, sampleRate);
        const clapData = clapBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            clapData[i] = (Math.sin(2 * Math.PI * 300 * t) * Math.exp(-t * 30) +
                         0.3 * Math.random() * Math.exp(-t * 20)) * 0.4;
        }
        this.samplers.drums.loadSample('clap', clapBuffer);
        
        // 808 Bass
        const bass808Buffer = this.audioContext.createBuffer(1, length * 2, sampleRate);
        const bass808Data = bass808Buffer.getChannelData(0);
        for (let i = 0; i < bass808Buffer.length; i++) {
            const t = i / sampleRate;
            bass808Data[i] = (Math.sin(2 * Math.PI * 50 * t) * Math.exp(-t * 5) +
                            Math.sin(2 * Math.PI * 30 * t) * Math.exp(-t * 3)) * 0.6;
        }
        this.samplers.drums.loadSample('808', bass808Buffer);
        
        // Cymbal
        const cymbalBuffer = this.audioContext.createBuffer(1, length * 3, sampleRate);
        const cymbalData = cymbalBuffer.getChannelData(0);
        for (let i = 0; i < cymbalBuffer.length; i++) {
            const t = i / sampleRate;
            cymbalData[i] = (Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 8) +
                           0.5 * Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 10) +
                           0.3 * Math.sin(2 * Math.PI * 1600 * t) * Math.exp(-t * 12)) * 0.2;
        }
        this.samplers.drums.loadSample('cymbal', cymbalBuffer);
        
        // Tom
        const tomBuffer = this.audioContext.createBuffer(1, length * 2, sampleRate);
        const tomData = tomBuffer.getChannelData(0);
        for (let i = 0; i < tomBuffer.length; i++) {
            const t = i / sampleRate;
            tomData[i] = (Math.sin(2 * Math.PI * 100 * t) * Math.exp(-t * 10) +
                         0.5 * Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 8)) * 0.4;
        }
        this.samplers.drums.loadSample('tom', tomBuffer);
        
        console.log('Samples par défaut chargés');
    }
    
    async resume() {
        if (!this.audioContext) return;
        
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                this.isRunning = true;
                console.log('Contexte audio repris');
            } catch (error) {
                console.error('Erreur lors de la reprise du contexte audio:', error);
                showError(ERROR_MESSAGES.audioContext.resume);
                throw error;
            }
        }
    }
    
    suspend() {
        if (!this.audioContext) return;
        
        if (this.audioContext.state === 'running') {
            this.audioContext.suspend();
            this.isRunning = false;
            console.log('Contexte audio suspendu');
        }
    }
    
    getMasterVolume() {
        return this.masterGain ? this.masterGain.gain.value : 0;
    }
    
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = clamp(volume, 0, 1);
            CONFIG.audio.masterVolume = volume;
        }
    }
    
    getMasterMeterLevel() {
        if (!this.masterMeter) return 0;
        
        const bufferLength = this.masterMeter.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.masterMeter.getByteTimeDomainData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += Math.abs(dataArray[i] - 128);
        }
        
        const average = sum / bufferLength;
        return average / 128;
    }
    
    getMasterMeterPeak() {
        if (!this.masterMeter) return 0;
        
        const bufferLength = this.masterMeter.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.masterMeter.getByteTimeDomainData(dataArray);
        
        let max = 0;
        for (let i = 0; i < bufferLength; i++) {
            const value = Math.abs(dataArray[i] - 128);
            if (value > max) max = value;
        }
        
        return max / 128;
    }
    
    startMetronome(bpm) {
        if (!this.metronome) return;
        
        this.metronome.bpm = bpm || this.metronome.bpm;
        this.metronome.start();
    }
    
    stopMetronome() {
        if (this.metronome) {
            this.metronome.stop();
        }
    }
    
    playNote(instrument, note, velocity = 127, duration = 1) {
        if (!this.synths[instrument]) return;
        
        const frequency = midiToFrequency(note);
        const synth = this.synths[instrument];
        
        return synth.play(frequency, velocity);
    }
    
    playDrumSound(sound) {
        if (!this.samplers.drums) return;
        
        return this.samplers.drums.play(sound, 1, 127);
    }
    
    stopAllNotes() {
        for (const key in this.synths) {
            if (this.synths[key].stopAll) {
                this.synths[key].stopAll();
            }
        }
    }
    
    createTrackAudioNode() {
        if (!this.audioContext) return null;
        
        const gain = this.audioContext.createGain();
        gain.gain.value = 1;
        gain.connect(this.masterGain);
        
        return gain;
    }
    
    createEffectChain() {
        if (!this.audioContext) return null;
        
        const input = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        // Chaîne d'effets par défaut
        const eq = createEQ3(this.audioContext);
        const compressor = createCompressor(this.audioContext);
        const reverb = createReverb(this.audioContext);
        const delay = createDelay(this.audioContext);
        
        // Connecter les effets
        input.connect(eq.input);
        eq.connect();
        eq.output.connect(compressor);
        compressor.connect(reverb.input);
        reverb.connect();
        reverb.output.connect(delay.input);
        delay.connect();
        delay.output.connect(output);
        
        return {
            input,
            output,
            eq,
            compressor,
            reverb,
            delay,
            connect: () => {
                // Déjà connecté
            }
        };
    }
    
    createAudioBufferSource(buffer) {
        if (!this.audioContext) return null;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        return source;
    }
    
    decodeAudioData(audioData) {
        if (!this.audioContext) return Promise.reject(new Error('Audio context not initialized'));
        
        return this.audioContext.decodeAudioData(audioData);
    }
    
    createMediaStreamSource(stream) {
        if (!this.audioContext) return null;
        
        return this.audioContext.createMediaStreamSource(stream);
    }
    
    getCurrentTime() {
        if (!this.audioContext) return 0;
        return this.audioContext.currentTime - (this.latencyCompensation / 1000);
    }
    
    scheduleEvent(time, callback) {
        if (!this.audioContext) return;
        
        const scheduledTime = this.audioContext.currentTime + time;
        const oscillator = this.audioContext.createOscillator();
        oscillator.frequency.value = 0;
        oscillator.connect(this.audioContext.destination);
        oscillator.start(scheduledTime);
        
        const timer = setTimeout(() => {
            callback();
            oscillator.stop();
        }, time * 1000);
        
        return () => clearTimeout(timer);
    }
    
    cleanup() {
        this.stopMetronome();
        this.stopAllNotes();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.masterGain = null;
        this.masterCompressor = null;
        this.masterMeter = null;
        this.metronome = null;
        this.destination = null;
        this.synths = {};
        this.samplers = {};
        this.effects = {};
        this.isInitialized = false;
        this.isRunning = false;
        
        console.log('Moteur audio nettoyé');
    }
}

// Singleton du moteur audio
let audioEngineInstance = null;

function getAudioEngine() {
    if (!audioEngineInstance) {
        audioEngineInstance = new AudioEngine();
    }
    return audioEngineInstance;
}

// Initialiser le moteur audio au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        getAudioEngine();
    });
} else {
    getAudioEngine();
}

// Exporter pour les autres modules
window.AudioEngine = AudioEngine;
window.getAudioEngine = getAudioEngine;
