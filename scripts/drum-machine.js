// Drum Machine pour Studio DAW

class DrumMachine {
    constructor() {
        this.patterns = [];
        this.currentPatternIndex = 0;
        this.currentPattern = null;
        this.isPlaying = false;
        this.isRecording = false;
        this.bpm = CONFIG.project.bpm;
        this.patternLength = 16;
        this.stepDuration = 0.25; // en secondes
        this.currentStep = 0;
        this.lastStepTime = 0;
        
        // Samples de batterie
        this.samples = {};
        this.sampler = null;
        
        // Grille
        this.grid = [];
        this.selectedSound = 'kick';
        this.selectedStep = null;
        
        // Callbacks
        this.onStep = null;
        this.onPatternChange = null;
        this.onPlay = null;
        this.onStop = null;
        
        // Initialisation
        this.init();
    }
    
    init() {
        const audioEngine = getAudioEngine();
        if (!audioEngine || !audioEngine.samplers.drums) {
            console.warn('Moteur audio ou sampler non disponible');
            return;
        }
        
        this.sampler = audioEngine.samplers.drums;
        
        // Charger les samples
        this.loadSamples();
        
        // Créer les patterns par défaut
        this.createDefaultPatterns();
        
        // Sélectionner le premier pattern
        this.selectPattern(0);
        
        // Initialiser la grille
        this.initGrid();
        
        console.log('Drum Machine initialisée');
    }
    
    loadSamples() {
        // Les samples sont déjà chargés dans le sampler
        // On les référence simplement ici
        this.samples = {
            kick: { name: 'Kick', color: CONFIG.drumSounds.kick.color },
            snare: { name: 'Snare', color: CONFIG.drumSounds.snare.color },
            'hihat-closed': { name: 'Hi-Hat Fermé', color: CONFIG.drumSounds['hihat-closed'].color },
            'hihat-open': { name: 'Hi-Hat Ouvert', color: CONFIG.drumSounds['hihat-open'].color },
            clap: { name: 'Clap', color: CONFIG.drumSounds.clap.color },
            '808': { name: '808 Bass', color: CONFIG.drumSounds['808'].color },
            cymbal: { name: 'Cymbal', color: CONFIG.drumSounds.cymbal.color },
            tom: { name: 'Tom', color: CONFIG.drumSounds.tom.color }
        };
    }
    
    createDefaultPatterns() {
        // Pattern 1 - Basic beat
        const pattern1 = this.createPattern(16);
        pattern1.setSoundAtStep(0, 'kick');
        pattern1.setSoundAtStep(8, 'kick');
        pattern1.setSoundAtStep(4, 'snare');
        pattern1.setSoundAtStep(12, 'snare');
        pattern1.setSoundAtStep(2, 'hihat-closed');
        pattern1.setSoundAtStep(6, 'hihat-closed');
        pattern1.setSoundAtStep(10, 'hihat-closed');
        pattern1.setSoundAtStep(14, 'hihat-closed');
        this.patterns.push(pattern1);
        
        // Pattern 2 - Hip hop
        const pattern2 = this.createPattern(16);
        pattern2.setSoundAtStep(0, 'kick');
        pattern2.setSoundAtStep(4, 'kick');
        pattern2.setSoundAtStep(8, 'kick');
        pattern2.setSoundAtStep(12, 'kick');
        pattern2.setSoundAtStep(2, 'snare');
        pattern2.setSoundAtStep(6, 'snare');
        pattern2.setSoundAtStep(10, 'snare');
        pattern2.setSoundAtStep(14, 'snare');
        pattern2.setSoundAtStep(1, 'hihat-closed');
        pattern2.setSoundAtStep(3, 'hihat-closed');
        pattern2.setSoundAtStep(5, 'hihat-closed');
        pattern2.setSoundAtStep(7, 'hihat-closed');
        pattern2.setSoundAtStep(9, 'hihat-closed');
        pattern2.setSoundAtStep(11, 'hihat-closed');
        pattern2.setSoundAtStep(13, 'hihat-closed');
        pattern2.setSoundAtStep(15, 'hihat-closed');
        this.patterns.push(pattern2);
        
        // Pattern 3 - Techno
        const pattern3 = this.createPattern(16);
        pattern3.setSoundAtStep(0, 'kick');
        pattern3.setSoundAtStep(4, 'kick');
        pattern3.setSoundAtStep(8, 'kick');
        pattern3.setSoundAtStep(12, 'kick');
        pattern3.setSoundAtStep(2, 'clap');
        pattern3.setSoundAtStep(6, 'clap');
        pattern3.setSoundAtStep(10, 'clap');
        pattern3.setSoundAtStep(14, 'clap');
        pattern3.setSoundAtStep(1, 'hihat-open');
        pattern3.setSoundAtStep(5, 'hihat-open');
        pattern3.setSoundAtStep(9, 'hihat-open');
        pattern3.setSoundAtStep(13, 'hihat-open');
        this.patterns.push(pattern3);
        
        // Pattern 4 - Trap
        const pattern4 = this.createPattern(16);
        pattern4.setSoundAtStep(0, 'kick');
        pattern4.setSoundAtStep(8, 'kick');
        pattern4.setSoundAtStep(4, '808');
        pattern4.setSoundAtStep(12, '808');
        pattern4.setSoundAtStep(2, 'snare');
        pattern4.setSoundAtStep(6, 'snare');
        pattern4.setSoundAtStep(10, 'snare');
        pattern4.setSoundAtStep(14, 'snare');
        pattern4.setSoundAtStep(1, 'hihat-closed');
        pattern4.setSoundAtStep(3, 'hihat-closed');
        pattern4.setSoundAtStep(5, 'hihat-closed');
        pattern4.setSoundAtStep(7, 'hihat-closed');
        pattern4.setSoundAtStep(9, 'hihat-closed');
        pattern4.setSoundAtStep(11, 'hihat-closed');
        pattern4.setSoundAtStep(13, 'hihat-closed');
        pattern4.setSoundAtStep(15, 'hihat-closed');
        this.patterns.push(pattern4);
    }
    
    createPattern(length = 16) {
        return new DrumPattern(length);
    }
    
    selectPattern(index) {
        if (index < 0 || index >= this.patterns.length) return;
        
        this.currentPatternIndex = index;
        this.currentPattern = this.patterns[index];
        this.patternLength = this.currentPattern.length;
        this.updateStepDuration();
        
        if (this.onPatternChange) {
            this.onPatternChange(this.currentPattern);
        }
        
        console.log(`Pattern ${index + 1} sélectionné`);
    }
    
    getCurrentPattern() {
        return this.currentPattern;
    }
    
    getPattern(index) {
        return this.patterns[index];
    }
    
    addPattern(pattern) {
        this.patterns.push(pattern);
        return this.patterns.length - 1;
    }
    
    removePattern(index) {
        if (index < 0 || index >= this.patterns.length) return false;
        
        this.patterns.splice(index, 1);
        
        // Mettre à jour l'index courant si nécessaire
        if (this.currentPatternIndex >= index) {
            this.currentPatternIndex = Math.max(0, this.currentPatternIndex - 1);
            this.currentPattern = this.patterns[this.currentPatternIndex];
        }
        
        return true;
    }
    
    updateStepDuration() {
        this.stepDuration = 60 / (this.bpm * 4); // 16e note
    }
    
    setBpm(bpm) {
        this.bpm = bpm;
        this.updateStepDuration();
    }
    
    setPatternLength(length) {
        this.patternLength = length;
        if (this.currentPattern) {
            this.currentPattern.length = length;
        }
        this.updateStepDuration();
    }
    
    initGrid() {
        this.grid = [];
        for (let step = 0; step < this.patternLength; step++) {
            this.grid[step] = [];
        }
    }
    
    toggleSoundAtStep(step, sound) {
        if (step < 0 || step >= this.patternLength) return;
        
        if (!this.grid[step]) {
            this.grid[step] = [];
        }
        
        const index = this.grid[step].indexOf(sound);
        if (index === -1) {
            this.grid[step].push(sound);
        } else {
            this.grid[step].splice(index, 1);
        }
        
        // Mettre à jour le pattern courant
        if (this.currentPattern) {
            this.currentPattern.setSoundAtStep(step, sound);
        }
    }
    
    setSelectedSound(sound) {
        this.selectedSound = sound;
    }
    
    setSelectedStep(step) {
        this.selectedStep = step;
    }
    
    // Lecture
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentStep = 0;
        this.lastStepTime = Date.now();
        
        this.scheduleSteps();
        
        if (this.onPlay) {
            this.onPlay();
        }
        
        console.log('Drum Machine démarrée');
    }
    
    stop() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        
        if (this.onStop) {
            this.onStop();
        }
        
        console.log('Drum Machine arrêtée');
    }
    
    scheduleSteps() {
        if (!this.isPlaying) return;
        
        const audioEngine = getAudioEngine();
        if (!audioEngine) return;
        
        const now = Date.now();
        const elapsed = now - this.lastStepTime;
        const stepTime = this.stepDuration * 1000;
        
        // Calculer le prochain temps d'étape
        const nextStepTime = this.lastStepTime + stepTime;
        const delay = nextStepTime - now;
        
        // Planifier le prochain pas
        this.stepTimeout = setTimeout(() => {
            this.playStep();
            this.scheduleSteps();
        }, Math.max(0, delay));
    }
    
    playStep() {
        if (!this.isPlaying || !this.currentPattern) return;
        
        // Jouer les sons de cette étape
        const sounds = this.currentPattern.getSoundsAtStep(this.currentStep);
        if (sounds && sounds.length > 0) {
            sounds.forEach(sound => {
                if (this.sampler) {
                    this.sampler.play(sound);
                }
            });
        }
        
        // Notifier
        if (this.onStep) {
            this.onStep(this.currentStep, sounds);
        }
        
        // Passer à l'étape suivante
        this.currentStep = (this.currentStep + 1) % this.patternLength;
        this.lastStepTime = Date.now();
    }
    
    // Enregistrement
    startRecording() {
        if (this.isRecording) return;
        
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        this.recordedPattern = this.createPattern(this.patternLength);
        
        // Écouter les événements MIDI
        const midiManager = getMidiManager();
        if (midiManager) {
            this.midiListener = midiManager.addListener('noteOn', (event) => {
                this.handleMidiNoteOn(event);
            });
        }
        
        console.log('Enregistrement de pattern démarré');
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        // Arrêter d'écouter les événements MIDI
        if (this.midiListener) {
            this.midiListener();
            this.midiListener = null;
        }
        
        // Ajouter le pattern enregistré
        if (this.recordedPattern) {
            this.patterns.push(this.recordedPattern);
            this.selectPattern(this.patterns.length - 1);
            this.recordedPattern = null;
        }
        
        console.log('Enregistrement de pattern arrêté');
    }
    
    handleMidiNoteOn(event) {
        if (!this.isRecording) return;
        
        const now = Date.now();
        const elapsed = now - this.recordingStartTime;
        const step = Math.floor(elapsed / (this.stepDuration * 1000)) % this.patternLength;
        
        // Mapper la note MIDI à un son de batterie
        const sound = this.midiNoteToDrumSound(event.note);
        if (sound) {
            this.recordedPattern.setSoundAtStep(step, sound);
            this.toggleSoundAtStep(step, sound);
        }
    }
    
    midiNoteToDrumSound(note) {
        // Mapping des notes MIDI aux sons de batterie
        const mappings = {
            36: 'kick',       // C1
            38: 'snare',      // D1
            42: 'hihat-closed', // F#1
            46: 'hihat-open',   // A#1
            39: 'clap',       // D#1
            40: '808',        // E1
            49: 'cymbal',     // C#2
            41: 'tom',        // F1
            43: 'tom',        // G1
            45: 'tom',        // A1
            47: 'tom',        // B1
            48: 'tom'         // C2
        };
        
        return mappings[note] || null;
    }
    
    // Utilitaires
    clearPattern() {
        if (this.currentPattern) {
            this.currentPattern.clear();
            this.initGrid();
        }
    }
    
    clearAllPatterns() {
        this.patterns.forEach(pattern => pattern.clear());
        this.initGrid();
    }
    
    getSounds() {
        return Object.keys(this.samples);
    }
    
    getSoundName(sound) {
        return this.samples[sound] ? this.samples[sound].name : sound;
    }
    
    getSoundColor(sound) {
        return this.samples[sound] ? this.samples[sound].color : '#ffffff';
    }
    
    playSound(sound) {
        if (this.sampler) {
            this.sampler.play(sound);
        }
    }
    
    // Export
    toJSON() {
        return {
            patterns: this.patterns.map(pattern => pattern.toJSON()),
            currentPatternIndex: this.currentPatternIndex,
            bpm: this.bpm,
            patternLength: this.patternLength
        };
    }
    
    static fromJSON(data) {
        const drumMachine = new DrumMachine();
        
        drumMachine.patterns = data.patterns.map(patternData => 
            DrumPattern.fromJSON(patternData)
        );
        
        drumMachine.currentPatternIndex = data.currentPatternIndex || 0;
        drumMachine.bpm = data.bpm || CONFIG.project.bpm;
        drumMachine.patternLength = data.patternLength || 16;
        
        drumMachine.selectPattern(drumMachine.currentPatternIndex);
        drumMachine.updateStepDuration();
        
        return drumMachine;
    }
    
    // Nettoyage
    cleanup() {
        this.stop();
        
        // Arrêter l'enregistrement
        if (this.isRecording) {
            this.stopRecording();
        }
        
        // Nettoyer le timeout
        if (this.stepTimeout) {
            clearTimeout(this.stepTimeout);
            this.stepTimeout = null;
        }
        
        // Nettoyer les écouteurs
        if (this.midiListener) {
            this.midiListener();
            this.midiListener = null;
        }
        
        this.patterns = [];
        this.currentPattern = null;
        this.currentPatternIndex = 0;
        this.isPlaying = false;
        this.isRecording = false;
        
        console.log('Drum Machine nettoyée');
    }
}

// Classe DrumPattern
class DrumPattern {
    constructor(length = 16) {
        this.id = generateId('pattern-');
        this.length = length;
        this.name = `Pattern ${Date.now()}`;
        this.color = stringToColor(this.id);
        this.steps = [];
        
        // Initialiser les étapes
        for (let i = 0; i < length; i++) {
            this.steps[i] = [];
        }
    }
    
    setSoundAtStep(step, sound) {
        if (step < 0 || step >= this.length) return;
        
        if (!this.steps[step]) {
            this.steps[step] = [];
        }
        
        if (!this.steps[step].includes(sound)) {
            this.steps[step].push(sound);
        }
    }
    
    removeSoundAtStep(step, sound) {
        if (step < 0 || step >= this.length) return;
        
        if (this.steps[step]) {
            const index = this.steps[step].indexOf(sound);
            if (index !== -1) {
                this.steps[step].splice(index, 1);
            }
        }
    }
    
    getSoundsAtStep(step) {
        if (step < 0 || step >= this.length) return [];
        return this.steps[step] || [];
    }
    
    clearStep(step) {
        if (step < 0 || step >= this.length) return;
        this.steps[step] = [];
    }
    
    clear() {
        for (let i = 0; i < this.length; i++) {
            this.steps[i] = [];
        }
    }
    
    setName(name) {
        this.name = name;
    }
    
    setColor(color) {
        this.color = color;
    }
    
    setLength(length) {
        const oldLength = this.length;
        this.length = length;
        
        if (length > oldLength) {
            for (let i = oldLength; i < length; i++) {
                this.steps[i] = [];
            }
        } else {
            this.steps = this.steps.slice(0, length);
        }
    }
    
    toJSON() {
        return {
            id: this.id,
            length: this.length,
            name: this.name,
            color: this.color,
            steps: this.steps.map(step => step.slice())
        };
    }
    
    static fromJSON(data) {
        const pattern = new DrumPattern(data.length || 16);
        pattern.id = data.id;
        pattern.name = data.name || pattern.name;
        pattern.color = data.color || pattern.color;
        pattern.steps = data.steps ? data.steps.map(step => step.slice()) : pattern.steps;
        
        return pattern;
    }
}

// Singleton de la drum machine
let drumMachineInstance = null;

function getDrumMachine() {
    if (!drumMachineInstance) {
        drumMachineInstance = new DrumMachine();
    }
    return drumMachineInstance;
}

// Exporter pour les autres modules
window.DrumMachine = DrumMachine;
window.DrumPattern = DrumPattern;
window.getDrumMachine = getDrumMachine;
window._drumMachineInstance = drumMachineInstance;
