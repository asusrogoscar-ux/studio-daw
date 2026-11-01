// Piano Roll pour Studio DAW

class PianoRoll {
    constructor() {
        this.container = null;
        this.pianoElement = null;
        this.rollElement = null;
        this.keyboardElement = null;
        this.controlsElement = null;
        
        // Paramètres
        this.instrument = 'piano';
        this.octave = 4;
        this.octaves = 3; // Nombre d'octaves à afficher
        this.noteHeight = 20;
        this.noteWidth = 30;
        this.gridWidth = 10;
        this.startNote = 48; // C4
        this.endNote = 84; // C6
        this.stepsPerBeat = 4; // 16e notes
        this.beatsPerMeasure = 4;
        this.totalSteps = 64; // Nombre total d'étapes
        
        // État
        this.notes = [];
        this.selectedNote = null;
        this.isDrawing = false;
        this.lastDrawNote = null;
        this.isPlaying = false;
        this.currentStep = 0;
        
        // Synthé
        this.synth = null;
        
        // Callbacks
        this.onNoteAdd = null;
        this.onNoteRemove = null;
        this.onNoteSelect = null;
        this.onPlay = null;
        this.onStop = null;
        
        // Initialisation
        this.init();
    }
    
    init() {
        // Récupérer les éléments DOM
        this.container = document.getElementById('piano-roll-container');
        this.pianoElement = document.getElementById('piano-roll');
        this.keyboardElement = document.getElementById('piano-keyboard');
        this.controlsElement = document.querySelector('.piano-roll-controls');
        
        if (!this.container || !this.pianoElement || !this.keyboardElement) {
            console.warn('Éléments DOM du piano roll non trouvés');
            return;
        }
        
        // Obtenir le synthé
        const audioEngine = getAudioEngine();
        if (audioEngine && audioEngine.synths) {
            this.synth = audioEngine.synths[this.instrument];
        }
        
        // Initialiser le piano roll
        this.initPianoRoll();
        
        // Initialiser le clavier
        this.initKeyboard();
        
        // Initialiser les contrôles
        this.initControls();
        
        // Configurer les événements
        this.setupEvents();
        
        console.log('Piano Roll initialisé');
    }
    
    initPianoRoll() {
        if (!this.pianoElement) return;
        
        // Effacer le contenu existant
        this.pianoElement.innerHTML = '';
        
        // Calculer les dimensions
        const width = this.totalSteps * this.noteWidth;
        const height = (this.endNote - this.startNote + 1) * this.noteHeight;
        
        this.pianoElement.style.width = `${width}px`;
        this.pianoElement.style.height = `${height}px`;
        
        // Créer la grille
        this.createGrid();
        
        // Créer les lignes des notes
        this.createNoteLines();
        
        // Créer les notes existantes
        this.createNoteElements();
    }
    
    createGrid() {
        if (!this.pianoElement) return;
        
        const grid = document.createElement('div');
        grid.className = 'piano-roll-grid';
        
        // Lignes horizontales (notes)
        for (let note = this.startNote; note <= this.endNote; note++) {
            const line = document.createElement('div');
            line.className = 'grid-line horizontal';
            line.style.top = `${(this.endNote - note) * this.noteHeight}px`;
            grid.appendChild(line);
        }
        
        // Lignes verticales (temps)
        for (let step = 0; step <= this.totalSteps; step++) {
            const line = document.createElement('div');
            line.className = 'grid-line vertical';
            line.style.left = `${step * this.noteWidth}px`;
            
            // Mettre en évidence les lignes de mesure
            if (step % (this.stepsPerBeat * this.beatsPerMeasure) === 0) {
                line.classList.add('measure-line');
            } else if (step % this.stepsPerBeat === 0) {
                line.classList.add('beat-line');
            }
            
            grid.appendChild(line);
        }
        
        this.pianoElement.appendChild(grid);
    }
    
    createNoteLines() {
        if (!this.pianoElement) return;
        
        const noteLines = document.createElement('div');
        noteLines.className = 'note-lines';
        
        for (let note = this.startNote; note <= this.endNote; note++) {
            const noteElement = document.createElement('div');
            noteElement.className = 'note-line';
            noteElement.dataset.note = note;
            noteElement.style.top = `${(this.endNote - note) * this.noteHeight}px`;
            noteElement.style.height = `${this.noteHeight}px`;
            
            // Colorer les touches noires
            const noteName = getNoteName(note);
            if (noteName.includes('#')) {
                noteElement.classList.add('black-key');
            }
            
            // Ajouter le nom de la note
            const noteNameElement = document.createElement('span');
            noteNameElement.className = 'note-name';
            noteNameElement.textContent = noteName;
            noteElement.appendChild(noteNameElement);
            
            noteLines.appendChild(noteElement);
        }
        
        this.pianoElement.appendChild(noteLines);
    }
    
    createNoteElements() {
        if (!this.pianoElement) return;
        
        const notesContainer = document.createElement('div');
        notesContainer.className = 'notes-container';
        
        this.notes.forEach(note => {
            const noteElement = this.createNoteElement(note);
            notesContainer.appendChild(noteElement);
        });
        
        this.pianoElement.appendChild(notesContainer);
    }
    
    createNoteElement(note) {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.dataset.noteId = note.id;
        noteElement.style.left = `${note.step * this.noteWidth}px`;
        noteElement.style.top = `${(this.endNote - note.pitch) * this.noteHeight}px`;
        noteElement.style.width = `${note.duration * this.noteWidth}px`;
        noteElement.style.height = `${this.noteHeight}px`;
        noteElement.style.backgroundColor = note.color || this.getNoteColor(note.pitch);
        
        // Gestionnaire de clic
        noteElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNote(note);
        });
        
        // Gestionnaire de double clic
        noteElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editNote(note);
        });
        
        // Gestionnaire de glisser-déposer
        this.setupNoteDragAndDrop(noteElement, note);
        
        return noteElement;
    }
    
    getNoteColor(pitch) {
        const noteName = getNoteName(pitch);
        const colors = {
            'C': '#6366f1',
            'C#': '#8b5cf6',
            'D': '#ec4899',
            'D#': '#f59e0b',
            'E': '#10b981',
            'F': '#06b6d4',
            'F#': '#3b82f6',
            'G': '#ef4444',
            'G#': '#8b5cf6',
            'A': '#10b981',
            'A#': '#f59e0b',
            'B': '#06b6d4'
        };
        
        return colors[noteName.split(/(\d+)/)[0]] || '#6366f1';
    }
    
    initKeyboard() {
        if (!this.keyboardElement) return;
        
        // Effacer le contenu existant
        this.keyboardElement.innerHTML = '';
        
        // Créer les touches du clavier
        for (let note = this.startNote; note <= this.endNote; note++) {
            const noteName = getNoteName(note);
            const isBlackKey = noteName.includes('#');
            
            const keyElement = document.createElement('div');
            keyElement.className = `key ${isBlackKey ? 'black' : 'white'}`;
            keyElement.dataset.note = note;
            keyElement.dataset.noteName = noteName;
            
            // Positionner les touches
            const octave = parseInt(noteName.substring(1));
            const noteIndex = note % 12;
            const whiteNoteIndex = [0, 2, 4, 5, 7, 9, 11].indexOf(noteIndex);
            
            if (!isBlackKey) {
                keyElement.style.left = `${whiteNoteIndex * 40}px`;
                keyElement.style.width = '40px';
                keyElement.style.height = '120px';
            } else {
                // Position des touches noires
                const prevWhiteNote = [0, 2, 4, 5, 7, 9, 11].findIndex(n => n > noteIndex) - 1;
                keyElement.style.left = `${(prevWhiteNote + 1) * 40 - 15}px`;
                keyElement.style.width = '30px';
                keyElement.style.height = '80px';
            }
            
            // Ajouter le nom de la note
            const nameElement = document.createElement('span');
            nameElement.className = 'key-name';
            nameElement.textContent = noteName;
            keyElement.appendChild(nameElement);
            
            // Gestionnaire de clic
            keyElement.addEventListener('click', () => {
                this.playNote(note);
            });
            
            // Gestionnaire de mousedown
            keyElement.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.playNote(note);
                this.startNoteDraw(note);
            });
            
            // Gestionnaire de mouseenter (pour le dessin continu)
            keyElement.addEventListener('mouseenter', () => {
                if (this.isDrawing) {
                    this.addNoteAtPosition(this.lastDrawNote, this.currentStep);
                }
            });
            
            this.keyboardElement.appendChild(keyElement);
        }
    }
    
    initControls() {
        if (!this.controlsElement) return;
        
        // Instrument
        const instrumentSelect = document.getElementById('piano-roll-instrument');
        if (instrumentSelect) {
            instrumentSelect.value = this.instrument;
            instrumentSelect.addEventListener('change', (e) => {
                this.setInstrument(e.target.value);
            });
        }
        
        // Octave
        const octaveSelect = document.getElementById('piano-roll-octave');
        if (octaveSelect) {
            octaveSelect.value = this.octave;
            octaveSelect.addEventListener('change', (e) => {
                this.setOctave(parseInt(e.target.value));
            });
        }
        
        // Quantification
        const quantizeSelect = document.getElementById('piano-roll-quantize');
        if (quantizeSelect) {
            quantizeSelect.addEventListener('change', (e) => {
                this.setQuantize(e.target.value);
            });
        }
        
        // Bouton Effacer
        const clearBtn = document.getElementById('clear-piano-roll');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clear());
        }
    }
    
    setupEvents() {
        if (!this.pianoElement) return;
        
        // Événements de la souris sur le piano roll
        this.pianoElement.addEventListener('click', (e) => this.handlePianoRollClick(e));
        this.pianoElement.addEventListener('mousedown', (e) => this.handlePianoRollMouseDown(e));
        this.pianoElement.addEventListener('mousemove', (e) => this.handlePianoRollMouseMove(e));
        this.pianoElement.addEventListener('mouseup', (e) => this.handlePianoRollMouseUp(e));
        this.pianoElement.addEventListener('mouseleave', (e) => this.handlePianoRollMouseLeave(e));
        
        // Événements du clavier
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    handlePianoRollClick(e) {
        if (e.target.classList.contains('note') || e.target.closest('.note')) {
            return; // Ne pas gérer si on clique sur une note
        }
        
        // Désélectionner
        this.selectedNote = null;
        this.updateSelection();
    }
    
    handlePianoRollMouseDown(e) {
        if (e.button !== 0) return; // Bouton gauche uniquement
        
        if (e.target.classList.contains('note') || e.target.closest('.note')) {
            return; // Ne pas gérer si on clique sur une note
        }
        
        e.preventDefault();
        
        // Calculer la position
        const rect = this.pianoElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const step = Math.floor(x / this.noteWidth);
        const pitch = this.endNote - Math.floor(y / this.noteHeight);
        
        // Démarrer le dessin
        this.isDrawing = true;
        this.currentStep = step;
        this.lastDrawNote = pitch;
        
        // Ajouter une note
        this.addNoteAtPosition(pitch, step);
    }
    
    handlePianoRollMouseMove(e) {
        if (!this.isDrawing) return;
        
        e.preventDefault();
        
        // Calculer la position
        const rect = this.pianoElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        const step = Math.floor(x / this.noteWidth);
        
        // Mettre à jour la position actuelle
        this.currentStep = step;
        
        // Ajouter une note
        this.addNoteAtPosition(this.lastDrawNote, step);
    }
    
    handlePianoRollMouseUp(e) {
        if (!this.isDrawing) return;
        
        e.preventDefault();
        
        this.isDrawing = false;
        this.lastDrawNote = null;
    }
    
    handlePianoRollMouseLeave(e) {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.lastDrawNote = null;
        }
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
            ';': 64,  // E5
            '\'': 65, // F5
        };
        
        const note = keyToNote[e.key.toLowerCase()];
        if (note) {
            this.playNote(note);
        }
    }
    
    startNoteDraw(pitch) {
        this.isDrawing = true;
        this.lastDrawNote = pitch;
    }
    
    addNoteAtPosition(pitch, step) {
        // Vérifier si la note existe déjà
        const existingNote = this.notes.find(n => n.step === step && n.pitch === pitch);
        
        if (existingNote) {
            // Supprimer la note si elle existe
            this.removeNote(existingNote.id);
            return;
        }
        
        // Créer une nouvelle note
        const note = {
            id: generateId('note-'),
            pitch: pitch,
            step: step,
            duration: 1,
            velocity: 100,
            color: this.getNoteColor(pitch)
        };
        
        this.addNote(note);
        this.lastDrawNote = pitch;
    }
    
    // Gestion des notes
    addNote(note) {
        // Vérifier si la note existe déjà
        const existingIndex = this.notes.findIndex(n => n.id === note.id);
        if (existingIndex !== -1) {
            this.notes[existingIndex] = note;
        } else {
            this.notes.push(note);
        }
        
        // Créer l'élément DOM
        const noteElement = this.createNoteElement(note);
        const notesContainer = this.pianoElement.querySelector('.notes-container');
        if (notesContainer) {
            notesContainer.appendChild(noteElement);
        }
        
        // Sélectionner la note
        this.selectNote(note);
        
        if (this.onNoteAdd) {
            this.onNoteAdd(note);
        }
        
        return note;
    }
    
    removeNote(noteId) {
        const index = this.notes.findIndex(note => note.id === noteId);
        if (index === -1) return false;
        
        const note = this.notes[index];
        
        // Supprimer de la liste
        this.notes.splice(index, 1);
        
        // Supprimer l'élément DOM
        const noteElement = this.pianoElement.querySelector(`[data-note-id="${noteId}"]`);
        if (noteElement) {
            noteElement.remove();
        }
        
        // Désélectionner si c'était la note sélectionnée
        if (this.selectedNote && this.selectedNote.id === noteId) {
            this.selectedNote = null;
            this.updateSelection();
        }
        
        if (this.onNoteRemove) {
            this.onNoteRemove(note);
        }
        
        return true;
    }
    
    getNote(noteId) {
        return this.notes.find(note => note.id === noteId);
    }
    
    selectNote(note) {
        if (this.selectedNote === note) return;
        
        this.selectedNote = note;
        
        // Mettre à jour l'interface
        this.updateSelection();
        
        if (this.onNoteSelect) {
            this.onNoteSelect(note);
        }
    }
    
    editNote(note) {
        // À implémenter: édition de la note
        console.log(`Éditer la note ${note.id}`);
    }
    
    updateSelection() {
        // Mettre à jour la sélection des notes
        this.pianoElement.querySelectorAll('.note').forEach(element => {
            element.classList.remove('selected');
            if (this.selectedNote && element.dataset.noteId === this.selectedNote.id) {
                element.classList.add('selected');
            }
        });
    }
    
    clear() {
        // Supprimer toutes les notes
        this.notes.forEach(note => {
            this.removeNote(note.id);
        });
        
        this.notes = [];
        this.selectedNote = null;
        this.updateSelection();
        
        console.log('Piano Roll effacé');
    }
    
    // Lecture
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.currentStep = 0;
        
        // Démarrer la lecture
        this.playFromStep(0);
        
        if (this.onPlay) {
            this.onPlay();
        }
        
        console.log('Piano Roll lecture démarrée');
    }
    
    stop() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        
        // Arrêter toutes les notes
        if (this.synth) {
            this.synth.stopAll();
        }
        
        if (this.onStop) {
            this.onStop();
        }
        
        console.log('Piano Roll lecture arrêtée');
    }
    
    playFromStep(step) {
        if (!this.isPlaying) return;
        
        // Jouer les notes de cette étape
        const notesAtStep = this.notes.filter(note => note.step === step);
        notesAtStep.forEach(note => {
            this.playNote(note.pitch, note.velocity);
        });
        
        // Passer à l'étape suivante
        this.currentStep = (step + 1) % this.totalSteps;
        
        if (this.isPlaying) {
            const delay = 60000 / (CONFIG.project.bpm * this.stepsPerBeat);
            this.playTimeout = setTimeout(() => {
                this.playFromStep(this.currentStep);
            }, delay);
        }
    }
    
    playNote(pitch, velocity = 100) {
        if (!this.synth) {
            const audioEngine = getAudioEngine();
            if (audioEngine && audioEngine.synths) {
                this.synth = audioEngine.synths[this.instrument];
            }
        }
        
        if (this.synth) {
            const frequency = midiToFrequency(pitch);
            this.synth.play(frequency, velocity);
        }
    }
    
    // Paramètres
    setInstrument(instrument) {
        this.instrument = instrument;
        
        // Mettre à jour le synthé
        const audioEngine = getAudioEngine();
        if (audioEngine && audioEngine.synths[instrument]) {
            this.synth = audioEngine.synths[instrument];
        }
        
        console.log(`Instrument: ${instrument}`);
    }
    
    setOctave(octave) {
        this.octave = clamp(octave, 1, 8);
        
        // Mettre à jour l'affichage du clavier
        this.updateKeyboard();
        
        console.log(`Octave: ${octave}`);
    }
    
    setQuantize(quantize) {
        this.quantize = quantize;
        console.log(`Quantification: ${quantize}`);
    }
    
    updateKeyboard() {
        // Recharger le clavier avec le nouvel octave
        this.initKeyboard();
    }
    
    // Clavier virtuel
    setupNoteDragAndDrop(noteElement, note) {
        let startX, startLeft, isDragging = false;
        
        noteElement.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Bouton gauche uniquement
            
            e.preventDefault();
            e.stopPropagation();
            
            startX = e.clientX;
            startLeft = parseFloat(noteElement.style.left);
            isDragging = true;
            
            noteElement.classList.add('dragging');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            const dx = e.clientX - startX;
            const newLeft = startLeft + dx;
            
            // Limiter la position
            const minLeft = 0;
            const maxLeft = this.pianoElement.clientWidth - noteElement.clientWidth;
            const clampedLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));
            
            noteElement.style.left = `${clampedLeft}px`;
            
            // Mettre à jour la position de la note
            note.step = Math.round(clampedLeft / this.noteWidth);
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            isDragging = false;
            noteElement.classList.remove('dragging');
        });
    }
    
    // Export
    toJSON() {
        return {
            instrument: this.instrument,
            octave: this.octave,
            notes: this.notes,
            stepsPerBeat: this.stepsPerBeat,
            beatsPerMeasure: this.beatsPerMeasure,
            totalSteps: this.totalSteps
        };
    }
    
    static fromJSON(data) {
        const pianoRoll = new PianoRoll();
        
        pianoRoll.instrument = data.instrument || 'piano';
        pianoRoll.octave = data.octave || 4;
        pianoRoll.notes = data.notes || [];
        pianoRoll.stepsPerBeat = data.stepsPerBeat || 4;
        pianoRoll.beatsPerMeasure = data.beatsPerMeasure || 4;
        pianoRoll.totalSteps = data.totalSteps || 64;
        
        // Mettre à jour le synthé
        const audioEngine = getAudioEngine();
        if (audioEngine && audioEngine.synths[pianoRoll.instrument]) {
            pianoRoll.synth = audioEngine.synths[pianoRoll.instrument];
        }
        
        // Recharger l'interface
        pianoRoll.initPianoRoll();
        pianoRoll.initKeyboard();
        
        return pianoRoll;
    }
    
    // Nettoyage
    cleanup() {
        this.stop();
        
        // Nettoyer les notes
        this.notes = [];
        
        // Nettoyer les éléments DOM
        if (this.pianoElement) {
            this.pianoElement.innerHTML = '';
        }
        
        if (this.keyboardElement) {
            this.keyboardElement.innerHTML = '';
        }
        
        // Réinitialiser les variables
        this.selectedNote = null;
        this.isDrawing = false;
        this.lastDrawNote = null;
        this.isPlaying = false;
        this.currentStep = 0;
        
        // Nettoyer le timeout
        if (this.playTimeout) {
            clearTimeout(this.playTimeout);
            this.playTimeout = null;
        }
        
        console.log('Piano Roll nettoyé');
    }
}

// Singleton du piano roll
let pianoRollInstance = null;

function getPianoRoll() {
    if (!pianoRollInstance) {
        pianoRollInstance = new PianoRoll();
    }
    return pianoRollInstance;
}

// Exporter pour les autres modules
window.PianoRoll = PianoRoll;
window.getPianoRoll = getPianoRoll;
window._pianoRollInstance = pianoRollInstance;
