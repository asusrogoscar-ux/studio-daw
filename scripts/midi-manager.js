// Gestionnaire MIDI pour Studio DAW

class MidiManager {
    constructor() {
        this.midiAccess = null;
        this.midiInputs = [];
        this.midiOutputs = [];
        this.connectedDevice = null;
        this.isConnected = false;
        this.isSupported = isSupported('webMidi');
        this.listeners = new Map();
        this.noteOnListeners = new Map();
        this.noteOffListeners = new Map();
        this.controlChangeListeners = new Map();
        this.channelPressureListeners = new Map();
        this.pitchBendListeners = new Map();
        
        // Paramètres
        this.channel = CONFIG.midi.channel;
        this.thruEnabled = CONFIG.midi.thruEnabled;
        this.velocityCurve = CONFIG.midi.velocityCurve;
        
        // État
        this.activeNotes = new Map();
        this.lastNoteOnTime = 0;
        this.lastMessageTime = 0;
        
        // NE PAS initialiser automatiquement dans le constructeur
        // L'initialisation sera faite par main.js dans le bon ordre
        // this.init();
    }
    
    async init() {
        if (!this.isSupported) {
            console.warn('Web MIDI API non supportée');
            showWarning('Votre navigateur ne supporte pas la Web MIDI API. Utilisez Chrome, Firefox ou Edge pour la prise en charge MIDI.');
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
            // Ne pas afficher le toast ici - sera affiché une seule fois par main.js
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation MIDI:', error);
            showError(ERROR_MESSAGES.midi.permissionDenied);
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
        
        const inputs = this.midiAccess.inputs.values();
        const outputs = this.midiAccess.outputs.values();
        
        for (const input of inputs) {
            this.midiInputs.push({
                id: input.id,
                name: input.name,
                manufacturer: input.manufacturer,
                type: input.type,
                state: input.state,
                port: input
            });
            
            // Configurer le gestionnaire de messages pour chaque entrée
            this.setupInputHandler(input);
        }
        
        for (const output of outputs) {
            this.midiOutputs.push({
                id: output.id,
                name: output.name,
                manufacturer: output.manufacturer,
                type: output.type,
                state: output.state,
                port: output
            });
        }
        
        // Mettre à jour l'interface
        this.updateDeviceList();
        
        return {
            inputs: this.midiInputs,
            outputs: this.midiOutputs
        };
    }
    
    setupInputHandler(input) {
        if (!input || input.onmidimessage) return;
        
        input.onmidimessage = (message) => {
            this.handleMidiMessage(message, input);
        };
    }
    
    handleMidiMessage(message, input) {
        const [status, data1, data2] = message.data;
        const channel = status & 0x0F;
        const command = status >> 4;
        const timestamp = message.timeStamp;
        
        // Filtrer par canal si nécessaire
        if (this.channel !== 'all' && channel !== parseInt(this.channel)) {
            return;
        }
        
        // Stocker le dernier temps de message
        this.lastMessageTime = timestamp;
        
        // Traiter les différents types de messages
        switch (command) {
            case 0x08: // Note Off
                this.handleNoteOff(data1, data2, channel, input);
                break;
            case 0x09: // Note On
                if (data2 === 0) {
                    // Note On avec vélocité 0 = Note Off
                    this.handleNoteOff(data1, 0, channel, input);
                } else {
                    this.handleNoteOn(data1, data2, channel, input);
                }
                break;
            case 0x0A: // Aftertouch polyphonique
                this.handlePolyphonicAftertouch(data1, data2, channel, input);
                break;
            case 0x0B: // Control Change
                this.handleControlChange(data1, data2, channel, input);
                break;
            case 0x0C: // Program Change
                this.handleProgramChange(data1, channel, input);
                break;
            case 0x0D: // Channel Pressure (Aftertouch)
                this.handleChannelPressure(data1, channel, input);
                break;
            case 0x0E: // Pitch Bend
                this.handlePitchBend(data1, data2, channel, input);
                break;
        }
        
        // MIDI Thru
        if (this.thruEnabled) {
            this.sendMidiMessage(message.data);
        }
        
        // Notifier les écouteurs généraux
        this.notifyListeners('message', {
            type: command,
            data1,
            data2,
            channel,
            input,
            timestamp
        });
    }
    
    handleNoteOn(note, velocity, channel, input) {
        // Appliquer la courbe de vélocité
        const processedVelocity = applyVelocityCurve(velocity, this.velocityCurve);
        
        // Stocker la note active
        this.activeNotes.set(note, {
            velocity: processedVelocity,
            channel,
            input,
            time: Date.now()
        });
        
        // Notifier les écouteurs de note on
        this.notifyNoteOnListeners(note, processedVelocity, channel, input);
        
        // Notifier les écouteurs généraux
        this.notifyListeners('noteOn', {
            note,
            velocity: processedVelocity,
            channel,
            input
        });
        
        // Jouer la note sur le synthé par défaut
        this.playNote(note, processedVelocity);
    }
    
    handleNoteOff(note, velocity, channel, input) {
        // Supprimer la note active
        this.activeNotes.delete(note);
        
        // Notifier les écouteurs de note off
        this.notifyNoteOffListeners(note, velocity, channel, input);
        
        // Notifier les écouteurs généraux
        this.notifyListeners('noteOff', {
            note,
            velocity,
            channel,
            input
        });
        
        // Arrêter la note sur le synthé
        this.stopNote(note);
    }
    
    handlePolyphonicAftertouch(note, pressure, channel, input) {
        this.notifyListeners('polyphonicAftertouch', {
            note,
            pressure,
            channel,
            input
        });
    }
    
    handleControlChange(controller, value, channel, input) {
        this.notifyControlChangeListeners(controller, value, channel, input);
        
        this.notifyListeners('controlChange', {
            controller,
            value,
            channel,
            input
        });
    }
    
    handleProgramChange(program, channel, input) {
        this.notifyListeners('programChange', {
            program,
            channel,
            input
        });
    }
    
    handleChannelPressure(pressure, channel, input) {
        this.notifyChannelPressureListeners(pressure, channel, input);
        
        this.notifyListeners('channelPressure', {
            pressure,
            channel,
            input
        });
    }
    
    handlePitchBend(data1, data2, channel, input) {
        const pitchBend = (data2 << 7) | data1;
        const normalized = (pitchBend - 8192) / 8192; // -1 à 1
        
        this.notifyPitchBendListeners(normalized, channel, input);
        
        this.notifyListeners('pitchBend', {
            value: normalized,
            raw: pitchBend,
            channel,
            input
        });
    }
    
    handleDeviceConnected(device) {
        console.log('Appareil MIDI connecté:', device.name);
        // Ne pas afficher de toast pour chaque connexion/déconnexion
        // showToast(`MIDI: ${device.name} connecté!`, 'success');
        
        this.connectedDevice = device;
        this.isConnected = true;
        this.listDevices();
        
        this.notifyListeners('deviceConnected', { device });
    }
    
    handleDeviceDisconnected(device) {
        console.log('Appareil MIDI déconnecté:', device.name);
        // Ne pas afficher de toast pour chaque connexion/déconnexion
        // showToast(`MIDI: ${device.name} déconnecté!`, 'warning');
        
        if (this.connectedDevice && this.connectedDevice.id === device.id) {
            this.connectedDevice = null;
            this.isConnected = this.midiInputs.length > 0;
        }
        
        this.listDevices();
        this.activeNotes.clear();
        
        this.notifyListeners('deviceDisconnected', { device });
    }
    
    playNote(note, velocity = 127) {
        const audioEngine = getAudioEngine();
        if (!audioEngine || !audioEngine.synths.piano) return;
        
        const frequency = midiToFrequency(note);
        audioEngine.synths.piano.play(frequency, velocity);
    }
    
    stopNote(note) {
        const audioEngine = getAudioEngine();
        if (!audioEngine || !audioEngine.synths.piano) return;
        
        const frequency = midiToFrequency(note);
        audioEngine.synths.piano.stopAll();
    }
    
    sendMidiMessage(message) {
        if (!this.midiAccess || !this.midiOutputs.length) return;
        
        // Envoyer à toutes les sorties
        this.midiOutputs.forEach(output => {
            if (output.port && output.port.send) {
                output.port.send(message);
            }
        });
    }
    
    sendNoteOn(note, velocity = 127, channel = 0) {
        const status = 0x90 | (channel & 0x0F);
        this.sendMidiMessage([status, note & 0x7F, velocity & 0x7F]);
    }
    
    sendNoteOff(note, velocity = 0, channel = 0) {
        const status = 0x80 | (channel & 0x0F);
        this.sendMidiMessage([status, note & 0x7F, velocity & 0x7F]);
    }
    
    sendControlChange(controller, value, channel = 0) {
        const status = 0xB0 | (channel & 0x0F);
        this.sendMidiMessage([status, controller & 0x7F, value & 0x7F]);
    }
    
    sendProgramChange(program, channel = 0) {
        const status = 0xC0 | (channel & 0x0F);
        this.sendMidiMessage([status, program & 0x7F]);
    }
    
    sendPitchBend(value, channel = 0) {
        // value: -1 à 1
        const bendValue = Math.floor((value + 1) * 8192);
        const lsb = bendValue & 0x7F;
        const msb = (bendValue >> 7) & 0x7F;
        const status = 0xE0 | (channel & 0x0F);
        this.sendMidiMessage([status, lsb, msb]);
    }
    
    sendChannelPressure(pressure, channel = 0) {
        const status = 0xD0 | (channel & 0x0F);
        this.sendMidiMessage([status, pressure & 0x7F]);
    }
    
    // Gestion des écouteurs
    addListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        
        return () => {
            this.listeners.get(event).delete(callback);
        };
    }
    
    addNoteOnListener(callback) {
        this.noteOnListeners.set(callback, callback);
        return () => {
            this.noteOnListeners.delete(callback);
        };
    }
    
    addNoteOffListener(callback) {
        this.noteOffListeners.set(callback, callback);
        return () => {
            this.noteOffListeners.delete(callback);
        };
    }
    
    addControlChangeListener(callback) {
        this.controlChangeListeners.set(callback, callback);
        return () => {
            this.controlChangeListeners.delete(callback);
        };
    }
    
    addChannelPressureListener(callback) {
        this.channelPressureListeners.set(callback, callback);
        return () => {
            this.channelPressureListeners.delete(callback);
        };
    }
    
    addPitchBendListener(callback) {
        this.pitchBendListeners.set(callback, callback);
        return () => {
            this.pitchBendListeners.delete(callback);
        };
    }
    
    notifyListeners(event, data) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Erreur dans le callback MIDI:', error);
                }
            });
        }
    }
    
    notifyNoteOnListeners(note, velocity, channel, input) {
        this.noteOnListeners.forEach(callback => {
            try {
                callback({ note, velocity, channel, input });
            } catch (error) {
                console.error('Erreur dans le callback Note On:', error);
            }
        });
    }
    
    notifyNoteOffListeners(note, velocity, channel, input) {
        this.noteOffListeners.forEach(callback => {
            try {
                callback({ note, velocity, channel, input });
            } catch (error) {
                console.error('Erreur dans le callback Note Off:', error);
            }
        });
    }
    
    notifyControlChangeListeners(controller, value, channel, input) {
        this.controlChangeListeners.forEach(callback => {
            try {
                callback({ controller, value, channel, input });
            } catch (error) {
                console.error('Erreur dans le callback Control Change:', error);
            }
        });
    }
    
    notifyChannelPressureListeners(pressure, channel, input) {
        this.channelPressureListeners.forEach(callback => {
            try {
                callback({ pressure, channel, input });
            } catch (error) {
                console.error('Erreur dans le callback Channel Pressure:', error);
            }
        });
    }
    
    notifyPitchBendListeners(value, channel, input) {
        this.pitchBendListeners.forEach(callback => {
            try {
                callback({ value, channel, input });
            } catch (error) {
                console.error('Erreur dans le callback Pitch Bend:', error);
            }
        });
    }
    
    updateDeviceList() {
        const deviceList = document.getElementById('midi-devices-list');
        if (!deviceList) return;
        
        // Effacer la liste actuelle
        deviceList.innerHTML = '';
        
        if (this.midiInputs.length === 0) {
            deviceList.innerHTML = '<p>Aucun appareil MIDI détecté</p>';
            return;
        }
        
        // Créer la liste des appareils
        const list = document.createElement('ul');
        list.className = 'device-list';
        
        this.midiInputs.forEach(device => {
            const item = document.createElement('li');
            item.className = 'device-item';
            
            const name = document.createElement('span');
            name.className = 'device-name';
            name.textContent = `${device.name} (${device.manufacturer || 'Inconnu'})`;
            
            const status = document.createElement('span');
            status.className = `device-status ${device.state}`;
            status.textContent = device.state;
            
            const connectBtn = document.createElement('button');
            connectBtn.className = 'btn btn-secondary';
            connectBtn.textContent = 'Connecter';
            connectBtn.onclick = () => this.connectDevice(device.id);
            
            item.appendChild(name);
            item.appendChild(status);
            item.appendChild(connectBtn);
            list.appendChild(item);
        });
        
        deviceList.appendChild(list);
    }
    
    connectDevice(deviceId) {
        const device = this.midiInputs.find(d => d.id === deviceId);
        if (!device) {
            showError('Appareil introuvable');
            return;
        }
        
        this.connectedDevice = device;
        this.isConnected = true;
        
        // Mettre à jour l'interface
        const indicator = document.getElementById('midi-indicator');
        const statusText = document.getElementById('midi-status-text');
        const deviceText = document.getElementById('midi-device-text');
        
        if (indicator) {
            indicator.classList.add('connected');
        }
        if (statusText) {
            statusText.textContent = 'Connecté';
        }
        if (deviceText) {
            deviceText.textContent = device.name;
        }
        
        showToast(`Connecté à ${device.name}`, 'success');
        this.notifyListeners('deviceConnected', { device });
    }
    
    disconnectDevice() {
        if (!this.connectedDevice) return;
        
        const device = this.connectedDevice;
        this.connectedDevice = null;
        this.isConnected = this.midiInputs.length > 0;
        
        // Mettre à jour l'interface
        const indicator = document.getElementById('midi-indicator');
        const statusText = document.getElementById('midi-status-text');
        const deviceText = document.getElementById('midi-device-text');
        
        if (indicator) {
            indicator.classList.remove('connected');
        }
        if (statusText) {
            statusText.textContent = this.isConnected ? 'Déconnecté' : 'Non disponible';
        }
        if (deviceText) {
            deviceText.textContent = '';
        }
        
        showToast(`Déconnecté de ${device.name}`, 'warning');
        this.notifyListeners('deviceDisconnected', { device });
    }
    
    refreshDevices() {
        if (!this.isSupported) {
            showError('Web MIDI API non supportée');
            return;
        }
        
        if (this.midiAccess) {
            this.listDevices();
        } else {
            this.init();
        }
    }
    
    setChannel(channel) {
        this.channel = channel;
        CONFIG.midi.channel = channel;
    }
    
    setThruEnabled(enabled) {
        this.thruEnabled = enabled;
        CONFIG.midi.thruEnabled = enabled;
    }
    
    setVelocityCurve(curve) {
        this.velocityCurve = curve;
        CONFIG.midi.velocityCurve = curve;
    }
    
    getConnectedDevice() {
        return this.connectedDevice;
    }
    
    getDevices() {
        return {
            inputs: this.midiInputs,
            outputs: this.midiOutputs
        };
    }
    
    getActiveNotes() {
        return Array.from(this.activeNotes.values());
    }
    
    isNoteActive(note) {
        return this.activeNotes.has(note);
    }
    
    cleanup() {
        // Supprimer tous les écouteurs
        this.listeners.clear();
        this.noteOnListeners.clear();
        this.noteOffListeners.clear();
        this.controlChangeListeners.clear();
        this.channelPressureListeners.clear();
        this.pitchBendListeners.clear();
        
        // Déconnecter les appareils
        if (this.midiAccess) {
            this.midiAccess.onstatechange = null;
            
            this.midiInputs.forEach(input => {
                if (input.port) {
                    input.port.onmidimessage = null;
                }
            });
        }
        
        this.midiAccess = null;
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

// Exporter pour les autres modules - DOIT ÊTRE FAIT IMMÉDIATEMENT
window.MidiManager = MidiManager;
window.getMidiManager = getMidiManager;
window._midiManagerInstance = midiManagerInstance;
