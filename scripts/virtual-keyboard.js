// Clavier virtuel pour Studio DAW

class VirtualKeyboard {
    constructor() {
        this.container = null;
        this.keyboardElement = null;
        this.controlsElement = null;
        
        // Paramètres
        this.instrument = 'piano';
        this.octaves = 2; // Nombre d'octaves
        this.startNote = 48; // C4
        this.endNote = 72; // C6
        this.keyWidth = 40;
        this.whiteKeyHeight = 120;
        this.blackKeyHeight = 80;
        
        // État
        this.activeNotes = new Map();
        this.isRecording = false;
        this.recordingStartTime = 0;
        this.recordedNotes = [];
        
        // Synthé
        this.synth = null;
        
        // Callbacks
        this.onNoteOn = null;
        this.onNoteOff = null;
        this.onRecordStart = null;
        this.onRecordStop = null;
        
        // Initialisation
        this.init();
    }
    
    init() {
        // Récupérer les éléments DOM
        this.container = document.getElementById('virtual-keyboard-container');
        this.keyboardElement = document.getElementById('virtual-keyboard');
        this.controlsElement = document.querySelector('.keyboard-settings');
        
        if (!this.container || !this.keyboardElement) {
            console.warn('Éléments DOM du clavier virtuel non trouvés');
            return;
        }
        
        // Obtenir le synthé
        const audioEngine = getAudioEngine();
        if (audioEngine && audioEngine.synths) {
            this.synth = audioEngine.synths[this.instrument];
        }
        
        // Initialiser le clavier
        this.initKeyboard();
        
        // Initialiser les contrôles
        this.initControls();
        
        // Configurer les événements
        this.setupEvents();
        
        console.log('Clavier virtuel initialisé');
    }
    
    initKeyboard() {
        if (!this.keyboardElement) return;
        
        // Effacer le contenu existant
        this.keyboardElement.innerHTML = '';
        
        // Calculer les dimensions
        const whiteKeys = this.getWhiteKeys();
        const width = whiteKeys.length * this.keyWidth;
        this.keyboardElement.style.width = `${width}px`;
        this.keyboardElement.style.height = `${this.whiteKeyHeight + 20}px`;
        
        // Créer les touches
        this.createKeys();
    }
    
    getWhiteKeys() {
        const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const whiteKeys = [];
        
        for (let note = this.startNote; note <= this.endNote; note++) {
            const noteName = getNoteName(note);
            if (!noteName.includes('#')) {
                whiteKeys.push(note);
            }
        }
        
        return whiteKeys;
    }
    
    getBlackKeys() {
        const blackNotes = ['C#', 'D#', 'F#', 'G#', 'A#'];
        const blackKeys = [];
        
        for (let note = this.startNote; note <= this.endNote; note++) {
            const noteName = getNoteName(note);
            if (noteName.includes('#')) {
                blackKeys.push(note);
            }
        }
        
        return blackKeys;
    }
    
    createKeys() {
        if (!this.keyboardElement) return;
        
        const whiteKeys = this.getWhiteKeys();
        const blackKeys = this.getBlackKeys();
        
        // Créer les touches blanches
        whiteKeys.forEach((note, index) => {
            const keyElement = this.createKeyElement(note, false);
            keyElement.style.left = `${index * this.keyWidth}px`;
            keyElement.style.width = `${this.keyWidth}px`;
            keyElement.style.height = `${this.whiteKeyHeight}px`;
            this.keyboardElement.appendChild(keyElement);
        });
        
        // Créer les touches noires
        blackKeys.forEach(note => {
            const keyElement = this.createKeyElement(note, true);
            
            // Trouver la position
            const noteName = getNoteName(note);
            const baseNote = noteName.replace('#', '');
            const baseNoteIndex = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(baseNote);
            const octave = parseInt(noteName.substring(1));
            
            // Trouver la position de la touche blanche précédente
            const whiteNoteIndex = whiteKeys.findIndex(n => {
                const whiteNoteName = getNoteName(n);
                const whiteOctave = parseInt(whiteNoteName.substring(1));
                const whiteBaseNote = whiteNoteName.replace(/\d+/, '');
                return whiteOctave === octave && ['C', 'D', 'E', 'F', 'G', 'A', 'B'].indexOf(whiteBaseNote) === baseNoteIndex;
            });
            
            if (whiteNoteIndex !== -1) {
                const offset = baseNote === 'C' || baseNote === 'F' ? 1 : 2;
                keyElement.style.left = `${(whiteNoteIndex + 1) * this.keyWidth - this.keyWidth / 2 - 5}px`;
                keyElement.style.width = `${this.keyWidth - 10}px`;
                keyElement.style.height = `${this.blackKeyHeight}px`;
                this.keyboardElement.appendChild(keyElement);
            }
        });
    }
    
    createKeyElement(note, isBlack) {
        const keyElement = document.createElement('div');
        keyElement.className = `key ${isBlack ? 'black' : 'white'}`;
        keyElement.dataset.note = note;
        keyElement.dataset.noteName = getNoteName(note);
        
        // Ajouter le nom de la note
        const nameElement = document.createElement('span');
        nameElement.className = 'key-name';
        nameElement.textContent = getNoteName(note);
        keyElement.appendChild(nameElement);
        
        // Gestionnaire de clic
        keyElement.addEventListener('click', () => {
            this.playNote(note);
        });
        
        // Gestionnaire de mousedown
        keyElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.noteOn(note);
            
            // Démarrer l'enregistrement si nécessaire
            if (this.isRecording) {
                this.recordNote(note, 'noteOn');
            }
        });
        
        // Gestionnaire de mouseup
        keyElement.addEventListener('mouseup', () => {
            this.noteOff(note);
            
            // Arrêter l'enregistrement si nécessaire
            if (this.isRecording) {
                this.recordNote(note, 'noteOff');
            }
        });
        
        // Gestionnaire de mouseleave (au cas où la souris quitte la touche)
        keyElement.addEventListener('mouseleave', () => {
            this.noteOff(note);
            
            if (this.isRecording) {
                this.recordNote(note, 'noteOff');
            }
        });
        
        // Gestionnaire pour le toucher tactile
        keyElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.noteOn(note);
            
            if (this.isRecording) {
                this.recordNote(note, 'noteOn');
            }
        });
        
        keyElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.noteOff(note);
            
            if (this.isRecording) {
                this.recordNote(note, 'noteOff');
            }
        });
        
        return keyElement;
    }
    
    initControls() {
        if (!this.controlsElement) return;
        
        // Instrument
        const instrumentSelect = document.getElementById('keyboard-instrument');
        if (instrumentSelect) {
            instrumentSelect.value = this.instrument;
            instrumentSelect.addEventListener('change', (e) => {
                this.setInstrument(e.target.value);
            });
        }
        
        // Bouton d'enregistrement
        const recordBtn = document.getElementById('keyboard-record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => this.toggleRecording());
        }
    }
    
    setupEvents() {
        // Événements du clavier de l'ordinateur
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        // Ne pas gérer si on est en train de taper dans un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Jouer les notes avec le clavier de l'ordinateur
        const keyToNote = {
            'a': 48,  // C4
            'w': 49,  // C#4
            's': 50,  // D4
            'e': 51,  // D#4
            'd': 52,  // E4
            'f': 53,  // F4
            't': 54,  // F#4
            'g': 55,  // G4
            'y': 56,  // G#4
            'h': 57,  // A4
            'u': 58,  // A#4
            'j': 59,  // B4
            'k': 60,  // C5
            'o': 61,  // C#5
            'l': 62,  // D5
            'p': 63,  // D#5
            '\'': 64, // E5
        };
        
        const note = keyToNote[e.key.toLowerCase()];
        if (note) {
            e.preventDefault();
            this.noteOn(note);
            
            if (this.isRecording) {
                this.recordNote(note, 'noteOn');
            }
        }
    }
    
    handleKeyUp(e) {
        // Ne pas gérer si on est en train de taper dans un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const keyToNote = {
            'a': 48,
            'w': 49,
            's': 50,
            'e': 51,
            'd': 52,
            'f': 53,
            't': 54,
            'g': 55,
            'y': 56,
            'h': 57,
            'u': 58,
            'j': 59,
            'k': 60,
            'o': 61,
            'l': 62,
            'p': 63,
            '\'': 64,
        };
        
        const note = keyToNote[e.key.toLowerCase()];
        if (note) {
            e.preventDefault();
            this.noteOff(note);
            
            if (this.isRecording) {
                this.recordNote(note, 'noteOff');
            }
        }
    }
    
    // Gestion des notes
    noteOn(note) {
        // Vérifier si la note est déjà active
        if (this.activeNotes.has(note)) return;
        
        // Ajouter à la liste des notes actives
        this.activeNotes.set(note, {
            startTime: Date.now(),
            element: null
        });
        
        // Jouer la note
        this.playNote(note);
        
        // Mettre en surbrillance la touche
        const keyElement = this.keyboardElement.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
            keyElement.classList.add('active');
            this.activeNotes.get(note).element = keyElement;
        }
        
        if (this.onNoteOn) {
            this.onNoteOn(note);
        }
    }
    
    noteOff(note) {
        // Vérifier si la note est active
        if (!this.activeNotes.has(note)) return;
        
        const noteData = this.activeNotes.get(note);
        
        // Arrêter la note
        this.stopNote(note);
        
        // Retirer la surbrillance
        if (noteData.element) {
            noteData.element.classList.remove('active');
        }
        
        // Supprimer de la liste
        this.activeNotes.delete(note);
        
        if (this.onNoteOff) {
            this.onNoteOff(note);
        }
    }
    
    playNote(note, velocity = 100) {
        if (!this.synth) {
            const audioEngine = getAudioEngine();
            if (audioEngine && audioEngine.synths) {
                this.synth = audioEngine.synths[this.instrument];
            }
        }
        
        if (this.synth) {
            const frequency = midiToFrequency(note);
            this.synth.play(frequency, velocity);
        }
    }
    
    stopNote(note) {
        if (this.synth) {
            this.synth.stopAll();
        }
    }
    
    // Enregistrement
    startRecording() {
        if (this.isRecording) return;
        
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        this.recordedNotes = [];
        
        if (this.onRecordStart) {
            this.onRecordStart();
        }
        
        console.log('Enregistrement du clavier virtuel démarré');
        showToast('Enregistrement démarré!', 'success');
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        if (this.onRecordStop) {
            this.onRecordStop(this.recordedNotes);
        }
        
        console.log('Enregistrement du clavier virtuel arrêté');
        showToast('Enregistrement arrêté!', 'info');
    }
    
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    recordNote(note, type) {
        if (!this.isRecording) return;
        
        const timestamp = Date.now() - this.recordingStartTime;
        
        if (type === 'noteOn') {
            this.recordedNotes.push({
                type: 'noteOn',
                note: note,
                velocity: 100,
                timestamp: timestamp,
                duration: null
            });
        } else if (type === 'noteOff') {
            // Trouver la noteOn correspondante
            const noteOnIndex = this.recordedNotes.findIndex(n => 
                n.type === 'noteOn' && n.note === note && n.duration === null
            );
            
            if (noteOnIndex !== -1) {
                const noteOn = this.recordedNotes[noteOnIndex];
                noteOn.duration = timestamp - noteOn.timestamp;
                noteOn.type = 'note';
            }
        }
    }
    
    getRecordedNotes() {
        return this.recordedNotes.filter(note => note.type === 'note');
    }
    
    clearRecording() {
        this.recordedNotes = [];
    }
    
    // Paramètres
    setInstrument(instrument) {
        this.instrument = instrument;
        
        // Mettre à jour le synthé
        const audioEngine = getAudioEngine();
        if (audioEngine && audioEngine.synths[instrument]) {
            this.synth = audioEngine.synths[instrument];
        }
        
        console.log(`Instrument du clavier: ${instrument}`);
    }
    
    setOctaves(octaves) {
        this.octaves = clamp(octaves, 1, 4);
        
        // Recalculer les notes
        this.startNote = 12 * (this.octave - 1);
        this.endNote = this.startNote + 12 * this.octaves - 1;
        
        // Recharger le clavier
        this.initKeyboard();
    }
    
    setOctave(octave) {
        this.octave = clamp(octave, 1, 8);
        
        // Recalculer les notes
        this.startNote = 12 * (this.octave - 1);
        this.endNote = this.startNote + 12 * this.octaves - 1;
        
        // Recharger le clavier
        this.initKeyboard();
    }
    
    // Nettoyage
    cleanup() {
        this.stopAllNotes();
        this.stopRecording();
        
        // Nettoyer les notes actives
        this.activeNotes.clear();
        
        // Nettoyer les éléments DOM
        if (this.keyboardElement) {
            this.keyboardElement.innerHTML = '';
        }
        
        // Réinitialiser les variables
        this.recordedNotes = [];
        this.isRecording = false;
        
        console.log('Clavier virtuel nettoyé');
    }
    
    stopAllNotes() {
        this.activeNotes.forEach((value, note) => {
            this.noteOff(note);
        });
        this.activeNotes.clear();
    }
    
    // Export
    toJSON() {
        return {
            instrument: this.instrument,
            octaves: this.octaves,
            startNote: this.startNote,
            endNote: this.endNote
        };
    }
    
    static fromJSON(data) {
        const keyboard = new VirtualKeyboard();
        
        keyboard.instrument = data.instrument || 'piano';
        keyboard.octaves = data.octaves || 2;
        keyboard.startNote = data.startNote || 48;
        keyboard.endNote = data.endNote || 72;
        
        // Mettre à jour le synthé
        const audioEngine = getAudioEngine();
        if (audioEngine && audioEngine.synths[keyboard.instrument]) {
            keyboard.synth = audioEngine.synths[keyboard.instrument];
        }
        
        // Recharger l'interface
        keyboard.initKeyboard();
        
        return keyboard;
    }
}

// Singleton du clavier virtuel
let virtualKeyboardInstance = null;

function getVirtualKeyboard() {
    if (!virtualKeyboardInstance) {
        virtualKeyboardInstance = new VirtualKeyboard();
    }
    return virtualKeyboardInstance;
}

// Exporter pour les autres modules
window.VirtualKeyboard = VirtualKeyboard;
window.getVirtualKeyboard = getVirtualKeyboard;
