// Instruments virtuels pour Studio DAW

class InstrumentsManager {
    constructor() {
        this.instruments = new Map();
        this.audioContext = null;
        this.synths = {};
        this.samplers = {};
        
        // Liste des instruments supportés
        this.supportedInstruments = [
            { id: 'piano', name: 'Piano', type: 'polyphonic', category: 'acoustic' },
            { id: 'synth', name: 'Synthé', type: 'polyphonic', category: 'synthetic' },
            { id: 'bass', name: 'Basse', type: 'polyphonic', category: 'bass' },
            { id: 'strings', name: 'Cordes', type: 'polyphonic', category: 'orchestral' },
            { id: 'organ', name: 'Orgue', type: 'polyphonic', category: 'keyboard' },
            { id: 'guitar', name: 'Guitare', type: 'polyphonic', category: 'string' },
            { id: 'drums', name: 'Batterie', type: 'drum', category: 'percussion' },
            { id: 'brass', name: 'Cuivres', type: 'polyphonic', category: 'brass' },
            { id: 'woodwind', name: 'Bois', type: 'polyphonic', category: 'woodwind' },
            { id: 'choir', name: 'Chœur', type: 'polyphonic', category: 'vocal' }
        ];
        
        // Initialisation
        this.init();
    }
    
    init() {
        const audioEngine = getAudioEngine();
        if (audioEngine && audioEngine.audioContext) {
            this.audioContext = audioEngine.audioContext;
            this.synths = audioEngine.synths;
            this.samplers = audioEngine.samplers;
        }
        
        // Créer les instruments par défaut
        this.createDefaultInstruments();
        
        console.log('Gestionnaire d\'instruments initialisé');
    }
    
    createDefaultInstruments() {
        // Les synthés sont déjà créés dans le moteur audio
        // On les référence simplement ici
        
        this.supportedInstruments.forEach(instrument => {
            this.instruments.set(instrument.id, {
                ...instrument,
                synth: this.synths[instrument.id],
                sampler: this.samplers[instrument.id]
            });
        });
    }
    
    getInstrument(instrumentId) {
        return this.instruments.get(instrumentId);
    }
    
    getInstrumentsByCategory(category) {
        return Array.from(this.instruments.values()).filter(
            instrument => instrument.category === category
        );
    }
    
    getAllInstruments() {
        return Array.from(this.instruments.values());
    }
    
    playNote(instrumentId, note, velocity = 100, duration = 1) {
        const instrument = this.getInstrument(instrumentId);
        if (!instrument) {
            console.warn(`Instrument ${instrumentId} non trouvé`);
            return;
        }
        
        if (instrument.type === 'drum') {
            // Pour les instruments de batterie, jouer le son directement
            if (instrument.sampler) {
                const soundMapping = {
                    'kick': 'kick',
                    'snare': 'snare',
                    'hihat-closed': 'hihat-closed',
                    'hihat-open': 'hihat-open',
                    'clap': 'clap',
                    '808': '808',
                    'cymbal': 'cymbal',
                    'tom': 'tom'
                };
                const sound = soundMapping[note] || note;
                return instrument.sampler.play(sound, 1, velocity);
            }
        } else if (instrument.type === 'polyphonic') {
            // Pour les instruments polyphoniques
            if (instrument.synth) {
                const frequency = midiToFrequency(note);
                return instrument.synth.play(frequency, velocity);
            }
        }
        
        return null;
    }
    
    stopNote(instrumentId, note) {
        const instrument = this.getInstrument(instrumentId);
        if (!instrument) return;
        
        if (instrument.type === 'polyphonic' && instrument.synth) {
            instrument.synth.stopAll();
        }
    }
    
    createInstrumentSynth(instrumentId, options = {}) {
        if (!this.audioContext) return null;
        
        const synth = createPolySynth(this.audioContext, options.maxVoices || 8);
        synth.output.connect(this.audioContext.destination);
        
        this.synths[instrumentId] = synth;
        
        // Mettre à jour l'instrument
        const instrument = this.instruments.get(instrumentId);
        if (instrument) {
            instrument.synth = synth;
            this.instruments.set(instrumentId, instrument);
        }
        
        return synth;
    }
    
    createInstrumentSampler(instrumentId, samples = {}) {
        if (!this.audioContext) return null;
        
        const sampler = createSampler(this.audioContext);
        
        // Charger les samples
        Object.entries(samples).forEach(([name, buffer]) => {
            sampler.loadSample(name, buffer);
        });
        
        sampler.output.connect(this.audioContext.destination);
        
        this.samplers[instrumentId] = sampler;
        
        // Mettre à jour l'instrument
        const instrument = this.instruments.get(instrumentId);
        if (instrument) {
            instrument.sampler = sampler;
            this.instruments.set(instrumentId, instrument);
        }
        
        return sampler;
    }
    
    // Création de sons d'instruments spécifiques
    createPianoSynth(maxVoices = 16) {
        if (!this.audioContext) return null;
        
        const synth = createPolySynth(this.audioContext, maxVoices);
        synth.output.connect(this.audioContext.destination);
        
        this.synths.piano = synth;
        
        return synth;
    }
    
    createSynthSynth(maxVoices = 8) {
        if (!this.audioContext) return null;
        
        const synth = createPolySynth(this.audioContext, maxVoices);
        synth.output.connect(this.audioContext.destination);
        
        this.synths.synth = synth;
        
        return synth;
    }
    
    createBassSynth(maxVoices = 8) {
        if (!this.audioContext) return null;
        
        const synth = createPolySynth(this.audioContext, maxVoices);
        synth.output.connect(this.audioContext.destination);
        
        this.synths.bass = synth;
        
        return synth;
    }
    
    createStringsSynth(maxVoices = 16) {
        if (!this.audioContext) return null;
        
        const synth = createPolySynth(this.audioContext, maxVoices);
        synth.output.connect(this.audioContext.destination);
        
        this.synths.strings = synth;
        
        return synth;
    }
    
    // Création d'un synthétiseur avec des paramètres personnalisés
    createCustomSynth(options = {}) {
        if (!this.audioContext) return null;
        
        const maxVoices = options.maxVoices || 8;
        const synth = createPolySynth(this.audioContext, maxVoices);
        
        // Appliquer les paramètres personnalisés
        synth.customSettings = options.settings || {};
        
        synth.output.connect(this.audioContext.destination);
        
        return synth;
    }
    
    // Création d'un instrument avec des oscillateurs personnalisés
    createOscillatorInstrument(type = 'sine', options = {}) {
        if (!this.audioContext) return null;
        
        const maxVoices = options.maxVoices || 8;
        const synth = createPolySynth(this.audioContext, maxVoices);
        
        // Personnaliser le type d'oscillateur
        synth.oscillatorType = type;
        
        synth.output.connect(this.audioContext.destination);
        
        return synth;
    }
    
    // Nettoyage
    cleanup() {
        this.instruments.clear();
        this.synths = {};
        this.samplers = {};
        this.audioContext = null;
        
        console.log('Gestionnaire d\'instruments nettoyé');
    }
}

// Classe pour un instrument personnalisé
class CustomInstrument {
    constructor(audioContext, options = {}) {
        this.audioContext = audioContext;
        this.id = options.id || generateId('instrument-');
        this.name = options.name || 'Instrument personnalisé';
        this.type = options.type || 'polyphonic';
        this.category = options.category || 'custom';
        
        // Paramètres audio
        this.maxVoices = options.maxVoices || 8;
        this.oscillatorType = options.oscillatorType || 'sine';
        this.attack = options.attack || 0.01;
        this.decay = options.decay || 0.3;
        this.sustain = options.sustain || 0.5;
        this.release = options.release || 0.2;
        
        // Synthé
        this.synth = null;
        
        // Effets
        this.effects = [];
        
        // Initialisation
        this.init();
    }
    
    init() {
        // Créer le synthé
        this.synth = createPolySynth(this.audioContext, this.maxVoices);
        
        // Appliquer les paramètres
        this.synth.oscillatorType = this.oscillatorType;
        
        // Connecter à la sortie
        this.synth.output.connect(this.audioContext.destination);
    }
    
    play(note, velocity = 100) {
        if (!this.synth) return;
        
        const frequency = midiToFrequency(note);
        return this.synth.play(frequency, velocity, this.oscillatorType, 
                               this.attack, this.decay, this.sustain, this.release);
    }
    
    stop(note) {
        if (this.synth) {
            this.synth.stopAll();
        }
    }
    
    setOscillatorType(type) {
        this.oscillatorType = type;
        if (this.synth) {
            this.synth.oscillatorType = type;
        }
    }
    
    setEnvelope(attack, decay, sustain, release) {
        this.attack = attack;
        this.decay = decay;
        this.sustain = sustain;
        this.release = release;
    }
    
    addEffect(effect) {
        this.effects.push(effect);
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            category: this.category,
            maxVoices: this.maxVoices,
            oscillatorType: this.oscillatorType,
            attack: this.attack,
            decay: this.decay,
            sustain: this.sustain,
            release: this.release
        };
    }
    
    static fromJSON(data, audioContext) {
        const instrument = new CustomInstrument(audioContext, {
            id: data.id,
            name: data.name,
            type: data.type,
            category: data.category,
            maxVoices: data.maxVoices,
            oscillatorType: data.oscillatorType,
            attack: data.attack,
            decay: data.decay,
            sustain: data.sustain,
            release: data.release
        });
        
        return instrument;
    }
    
    cleanup() {
        if (this.synth) {
            this.synth.stopAll();
            this.synth = null;
        }
        
        this.effects = [];
    }
}

// Singleton du gestionnaire d'instruments
let instrumentsManagerInstance = null;

function getInstrumentsManager() {
    if (!instrumentsManagerInstance) {
        instrumentsManagerInstance = new InstrumentsManager();
    }
    return instrumentsManagerInstance;
}

// Exporter pour les autres modules
window.InstrumentsManager = InstrumentsManager;
window.CustomInstrument = CustomInstrument;
window.getInstrumentsManager = getInstrumentsManager;
window._instrumentsManagerInstance = instrumentsManagerInstance;
