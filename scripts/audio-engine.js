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
        this.bufferSize = (typeof CONFIG !== 'undefined' && CONFIG.audio) ? CONFIG.audio.bufferSize : 512;
        this.sampleRate = (typeof CONFIG !== 'undefined' && CONFIG.audio) ? CONFIG.audio.sampleRate : 44100;
        this.latencyCompensation = (typeof CONFIG !== 'undefined' && CONFIG.audio) ? CONFIG.audio.latencyCompensation : 0;
        
        // NE PAS initialiser automatiquement dans le constructeur
        // L'initialisation sera faite par core.js dans le bon ordre
    }
    
    async init() {
        try {
            // Vérifier la prise en charge
            if (!window.isSupported('webAudio')) {
                throw new Error(window.ERROR_MESSAGES.audioContext.create);
            }
            
            // Créer le contexte audio
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass({
                sampleRate: this.sampleRate,
                latencyHint: this.bufferSize / this.sampleRate
            });
            
            window.APP_STATE.audioContext = this.audioContext;
            
            // Créer les nœuds principaux
            this.createMasterChain();
            
            // Créer le métronome
            this.createMetronome();
            
            // Initialiser les synthés et samplers
            this.initInstruments();
            
            this.isInitialized = true;
            this.isRunning = true;
            
            console.log('Moteur audio initialisé avec succès');
            window.showToast('Moteur audio prêt!', 'success');
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du moteur audio:', error);
            window.showError('Erreur audio: ' + error.message);
            throw error;
        }
    }
    
    createMasterChain() {
        if (!this.audioContext) return;
        
        // Créer le nœud de gain maître
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = (typeof CONFIG !== 'undefined' && CONFIG.audio) ? CONFIG.audio.masterVolume : 0.8;
        
        // Créer le compresseur maître
        this.masterCompressor = this.createCompressor(
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
    
    createCompressor(context, threshold, knee, ratio, attack, release) {
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = threshold;
        compressor.knee.value = knee;
        compressor.ratio.value = ratio;
        compressor.attack.value = attack;
        compressor.release.value = release;
        return compressor;
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
            oscillator: oscillator,
            gainNode: gainNode,
            isPlaying: false,
            bpm: 120,
            beatCount: 0
        };
        
        oscillator.start();
    }
    
    initInstruments() {
        if (!this.audioContext) return;
        
        // Initialiser les synthés
        this.initSynths();
        
        // Initialiser les samplers
        this.initSamplers();
    }
    
    initSynths() {
        // Synthé piano
        this.synths.piano = this.createPolyphonicSynth('piano');
        
        // Synthé synth
        this.synths.synth = this.createPolyphonicSynth('synth');
        
        // Synthé basse
        this.synths.bass = this.createPolyphonicSynth('bass');
        
        // Synthé cordes
        this.synths.strings = this.createPolyphonicSynth('strings');
        
        // Synthé cuivre
        this.synths.brass = this.createPolyphonicSynth('brass');
    }
    
    createPolyphonicSynth(type) {
        const voices = new Map();
        const maxVoices = 16;
        const self = this;
        
        return {
            type: type,
            play: function(frequency, velocity) {
                if (!self.audioContext) return;
                
                // Trouver une voix libre
                for (let i = 0; i < maxVoices; i++) {
                    const voiceId = `${type}-${i}`;
                    if (!voices.has(voiceId)) {
                        self.createSynthVoice(voiceId, type, frequency, velocity, voices);
                        return;
                    }
                }
                
                // Pas de voix libre, réutiliser la plus ancienne
                const firstKey = voices.keys().next().value;
                if (firstKey) {
                    const voice = voices.get(firstKey);
                    if (voice && voice.oscillator) {
                        voice.oscillator.stop();
                    }
                    voices.delete(firstKey);
                    self.createSynthVoice(firstKey, type, frequency, velocity, voices);
                }
            },
            stopAll: function() {
                voices.forEach((voice, key) => {
                    if (voice && voice.oscillator) {
                        voice.oscillator.stop();
                    }
                });
                voices.clear();
            }
        };
    }
    
    createSynthVoice(voiceId, type, frequency, velocity, voices) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Configuration selon le type
        switch (type) {
            case 'piano':
                oscillator.type = 'sine';
                filter.type = 'lowpass';
                filter.frequency.value = 5000;
                filter.Q.value = 1;
                break;
            case 'synth':
                oscillator.type = 'sawtooth';
                filter.type = 'lowpass';
                filter.frequency.value = 3000;
                filter.Q.value = 2;
                break;
            case 'bass':
                oscillator.type = 'sine';
                filter.type = 'lowpass';
                filter.frequency.value = 1000;
                filter.Q.value = 1;
                break;
            case 'strings':
                oscillator.type = 'sine';
                filter.type = 'lowpass';
                filter.frequency.value = 4000;
                filter.Q.value = 1;
                break;
            case 'brass':
                oscillator.type = 'sawtooth';
                filter.type = 'lowpass';
                filter.frequency.value = 2000;
                filter.Q.value = 1;
                break;
            default:
                oscillator.type = 'sine';
                filter.type = 'lowpass';
                filter.frequency.value = 5000;
        }
        
        oscillator.frequency.value = frequency;
        
        // Calculer le gain basé sur la vélocité
        const gain = window.velocityToGain(velocity);
        
        // Enveloppe ADSR simple
        gainNode.gain.setValueAtTime(gain, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        // Connecter
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(now);
        
        voices.set(voiceId, {
            oscillator: oscillator,
            gainNode: gainNode,
            filter: filter,
            startTime: now
        });
        
        // Arrêter automatiquement après 1 seconde
        oscillator.stop(now + 1);
        setTimeout(() => {
            voices.delete(voiceId);
        }, 1000);
    }
    
    initSamplers() {
        // Sampler de batterie
        this.samplers.drums = this.createDrumSampler();
    }
    
    createDrumSampler() {
        const drumSounds = {
            kick: { frequency: 150, duration: 0.1 },
            snare: { frequency: 200, duration: 0.1 },
            'hihat-closed': { frequency: 800, duration: 0.05 },
            'hihat-open': { frequency: 1000, duration: 0.1 },
            clap: { frequency: 300, duration: 0.05 },
            '808': { frequency: 80, duration: 0.3 },
            cymbal: { frequency: 1200, duration: 0.2 },
            tom: { frequency: 250, duration: 0.2 }
        };
        const self = this;
        
        return {
            play: function(soundName, velocity) {
                const sound = drumSounds[soundName];
                if (sound && self.audioContext) {
                    self.playDrumSound(sound.frequency, sound.duration, velocity);
                }
            }
        };
    }
    
    playDrumSound(frequency, duration, velocity) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        
        filter.type = 'lowpass';
        filter.frequency.value = 5000;
        
        const gain = window.velocityToGain(velocity) * 0.5;
        
        // Enveloppe
        gainNode.gain.setValueAtTime(gain, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    async resume() {
        if (!this.audioContext) return;
        
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            this.isRunning = true;
            console.log('Contexte audio repris');
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
    
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = volume;
        }
    }
    
    cleanup() {
        if (this.audioContext) {
            this.audioContext.close().catch(e => {
                console.error('Erreur lors de la fermeture du contexte audio:', e);
            });
        }
        
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

// Exporter pour les autres modules
window.AudioEngine = AudioEngine;
window.getAudioEngine = getAudioEngine;

// Enregistrer dans le registry CORE
if (typeof window.CORE !== 'undefined' && typeof window.CORE.registerModule === 'function') {
    window.CORE.registerModule('audio-engine', AudioEngine, getAudioEngine);
}
