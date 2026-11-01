// Gestionnaire MIDI pour Studio DAW

class MidiManager {
    constructor() {
        this.midiAccess = null;
        this.midiInputs = [];
        this.midiOutputs = [];
        this.connectedDevice = null;
        this.isConnected = false;
        this.isSupported = window.isSupported ? window.isSupported('webMidi') : false;
        this.listeners = new Map();
        this.noteOnListeners = new Map();
        this.noteOffListeners = new Map();
        this.controlChangeListeners = new Map();
        this.channelPressureListeners = new Map();
        this.pitchBendListeners = new Map();
        
        // Paramètres
        this.channel = (typeof CONFIG !== 'undefined' && CONFIG.midi) ? CONFIG.midi.channel : 'all';
        this.thruEnabled = (typeof CONFIG !== 'undefined' && CONFIG.midi) ? CONFIG.midi.thruEnabled : true;
        this.velocityCurve = (typeof CONFIG !== 'undefined' && CONFIG.midi) ? CONFIG.midi.velocityCurve : 'linear';
        
        // État
        this.activeNotes = new Map();
        this.lastNoteOnTime = 0;
        this.lastMessageTime = 0;
        
        // NE PAS initialiser automatiquement dans le constructeur
        // L'initialisation sera faite par core.js dans le bon ordre
    }
    
    async init() {
        if (!this.isSupported) {
            console.warn('Web MIDI API non supportée');
            if (typeof window.showWarning === 'function') {
                window.showWarning('Votre navigateur ne supporte pas la Web MIDI API. Utilisez Chrome, Firefox ou Edge pour la prise en charge MIDI.');
            }
            return;
        }
        
        try {
            // Demander l'accès MIDI
            this.midiAccess = await navigator.requestMIDIAccess({
                sysex: false
            });
            
            this.setupMidiListeners();
            this.listDevices();
            this.isConnected = true;
            
            console.log('MIDI initialisé avec succès');
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation MIDI:', error);
            if (typeof window.showError === 'function') {
                window.showError(window.ERROR_MESSAGES ? window.ERROR_MESSAGES.midi.permissionDenied : 'Accès MIDI refusé');
            }
        }
    }
    
    setupMidiListeners() {
        if (!this.midiAccess) return;
        
        // Écouter les changements de périphériques
        this.midiAccess.onstatechange = (event) => {
            console.log('Changement d\'état MIDI:', event);
            this.listDevices();
            
            if (event.port.state === 'connected') {
                this.handleDeviceConnected(event.port);
            } else if (event.port.state === 'disconnected') {
                this.handleDeviceDisconnected(event.port);
            }
        };
    }
    
    listDevices() {
        if (!this.midiAccess) return [];
        
        this.midiInputs = [];
        this.midiOutputs = [];
        
        for (const input of this.midiAccess.inputs.values()) {
            this.midiInputs.push(input);
            this.setupInputListeners(input);
        }
        
        for (const output of this.midiAccess.outputs.values()) {
            this.midiOutputs.push(output);
        }
        
        return this.midiInputs;
    }
    
    setupInputListeners(input) {
        if (!input) return;
        
        const self = this;
        input.onmidimessage = (message) => {
            const [status, data1, data2] = message.data;
            const timestamp = message.timeStamp;
            
            const command = status & 0xF0;
            const channel = status & 0x0F;
            
            // Filtrer par canal si nécessaire
            if (self.channel !== 'all' && channel !== parseInt(self.channel) - 1) {
                return;
            }
            
            switch (command) {
                case 0x90: // Note On
                    if (data2 > 0) {
                        self.handleNoteOn(data1, data2, timestamp);
                    } else {
                        self.handleNoteOff(data1, timestamp);
                    }
                    break;
                case 0x80: // Note Off
                    self.handleNoteOff(data1, timestamp);
                    break;
                case 0xB0: // Control Change
                    self.handleControlChange(data1, data2, channel, timestamp);
                    break;
                case 0xC0: // Program Change
                    self.handleProgramChange(data1, channel, timestamp);
                    break;
                case 0xD0: // Channel Pressure
                    self.handleChannelPressure(data1, data2, channel, timestamp);
                    break;
                case 0xE0: // Pitch Bend
                    self.handlePitchBend(data1, data2, channel, timestamp);
                    break;
            }
        };
    }
    
    handleNoteOn(note, velocity, timestamp) {
        this.activeNotes.set(note, { velocity, timestamp });
        this.notifyNoteOnListeners(note, velocity, timestamp);
        
        // Jouer la note sur l'instrument sélectionné
        const audioEngine = typeof getAudioEngine === 'function' ? getAudioEngine() : null;
        if (audioEngine && audioEngine.synths && audioEngine.synths.piano) {
            const frequency = window.midiToFrequency ? window.midiToFrequency(note) : 440;
            audioEngine.synths.piano.play(frequency, velocity);
        }
        
        // Notifier les écouteurs
        this.notifyListeners('noteOn', { note, velocity, timestamp });
    }
    
    handleNoteOff(note, timestamp) {
        this.activeNotes.delete(note);
        this.notifyNoteOffListeners(note, timestamp);
        
        // Arrêter la note
        const audioEngine = typeof getAudioEngine === 'function' ? getAudioEngine() : null;
        if (audioEngine && audioEngine.synths && audioEngine.synths.piano) {
            audioEngine.synths.piano.stopAll();
        }
        
        // Notifier les écouteurs
        this.notifyListeners('noteOff', { note, timestamp });
    }
    
    handleControlChange(controller, value, channel, timestamp) {
        this.notifyControlChangeListeners(controller, value, channel, timestamp);
        this.notifyListeners('controlChange', { controller, value, channel, timestamp });
    }
    
    handleProgramChange(program, channel, timestamp) {
        this.notifyListeners('programChange', { program, channel, timestamp });
    }
    
    handleChannelPressure(pressure, channel, timestamp) {
        this.notifyListeners('channelPressure', { pressure, channel, timestamp });
    }
    
    handlePitchBend(value, channel, timestamp) {
        const bend = ((value & 0x7F) << 7) | (value & 0x7F);
        const normalized = (bend - 8192) / 8192.0;
        this.notifyListeners('pitchBend', { value: normalized, channel, timestamp });
    }
    
    handleDeviceConnected(device) {
        console.log('Appareil MIDI connecté:', device.name);
        this.connectedDevice = device;
        this.isConnected = true;
        this.listDevices();
        
        this.notifyListeners('deviceConnected', { device });
    }
    
    handleDeviceDisconnected(device) {
        console.log('Appareil MIDI déconnecté:', device.name);
        
        if (this.connectedDevice && this.connectedDevice.id === device.id) {
            this.connectedDevice = null;
            this.isConnected = this.midiInputs.length > 0;
        }
        
        this.listDevices();
        this.activeNotes.clear();
        
        this.notifyListeners('deviceDisconnected', { device });
    }
    
    playNote(note, velocity = 127) {
        const audioEngine = typeof getAudioEngine === 'function' ? getAudioEngine() : null;
        if (!audioEngine || !audioEngine.synths || !audioEngine.synths.piano) return;
        
        const frequency = window.midiToFrequency ? window.midiToFrequency(note) : 440;
        audioEngine.synths.piano.play(frequency, velocity);
    }
    
    stopNote(note) {
        const audioEngine = typeof getAudioEngine === 'function' ? getAudioEngine() : null;
        if (!audioEngine || !audioEngine.synths || !audioEngine.synths.piano) return;
        
        audioEngine.synths.piano.stopAll();
    }
    
    sendMidiMessage(message) {
        if (!this.midiAccess || !this.connectedDevice) return;
        
        for (const output of this.midiAccess.outputs.values()) {
            output.send(message);
        }
    }
    
    getConnectedDevice() {
        return this.connectedDevice;
    }
    
    getInputs() {
        return this.midiInputs;
    }
    
    getOutputs() {
        return this.midiOutputs;
    }
    
    isMidiSupported() {
        return this.isSupported;
    }
    
    isConnectedToDevice() {
        return this.isConnected;
    }
    
    // Gestion des listeners
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erreur dans le callback pour ${event}:`, error);
                }
            });
        }
    }
    
    // Listeners spécifiques pour les notes
    onNoteOn(callback) {
        const id = Date.now().toString();
        this.noteOnListeners.set(id, callback);
        return id;
    }
    
    onNoteOff(callback) {
        const id = Date.now().toString();
        this.noteOffListeners.set(id, callback);
        return id;
    }
    
    offNoteOn(id) {
        this.noteOnListeners.delete(id);
    }
    
    offNoteOff(id) {
        this.noteOffListeners.delete(id);
    }
    
    notifyNoteOnListeners(note, velocity, timestamp) {
        this.noteOnListeners.forEach(callback => {
            try {
                callback({ note, velocity, timestamp });
            } catch (error) {
                console.error('Erreur dans le callback noteOn:', error);
            }
        });
    }
    
    notifyNoteOffListeners(note, timestamp) {
        this.noteOffListeners.forEach(callback => {
            try {
                callback({ note, timestamp });
            } catch (error) {
                console.error('Erreur dans le callback noteOff:', error);
            }
        });
    }
    
    setChannel(channel) {
        this.channel = channel;
        if (typeof CONFIG !== 'undefined' && CONFIG.midi) {
            CONFIG.midi.channel = channel;
        }
    }
    
    setThruEnabled(enabled) {
        this.thruEnabled = enabled;
        if (typeof CONFIG !== 'undefined' && CONFIG.midi) {
            CONFIG.midi.thruEnabled = enabled;
        }
    }
    
    setVelocityCurve(curve) {
        this.velocityCurve = curve;
        if (typeof CONFIG !== 'undefined' && CONFIG.midi) {
            CONFIG.midi.velocityCurve = curve;
        }
    }
    
    refreshDevices() {
        if (!this.isSupported) {
            if (typeof window.showError === 'function') {
                window.showError('Web MIDI API non supportée');
            }
            return;
        }
        
        if (this.midiAccess) {
            this.listDevices();
        } else {
            this.init();
        }
    }
    
    cleanup() {
        if (this.midiAccess) {
            this.midiAccess.onstatechange = null;
        }
        
        this.midiInputs = [];
        this.midiOutputs = [];
        this.connectedDevice = null;
        this.isConnected = false;
        this.activeNotes.clear();
        
        console.log('Gestionnaire MIDI nettoyé');
    }
}

// Singleton du gestionnaire MIDI
let midiManagerInstance = null;

function getMidiManager() {
    if (!midiManagerInstance) {
        midiManagerInstance = new MidiManager();
    }
    return midiManagerInstance;
}

// Exporter pour les autres modules
window.MidiManager = MidiManager;
window.getMidiManager = getMidiManager;

// Enregistrer dans le registry CORE
if (typeof window.CORE !== 'undefined' && typeof window.CORE.registerModule === 'function') {
    window.CORE.registerModule('midi-manager', MidiManager, getMidiManager);
}
