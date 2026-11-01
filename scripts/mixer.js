// Mixeur audio pour Studio DAW

class Mixer {
    constructor() {
        this.channels = [];
        this.masterChannel = null;
        this.selectedChannel = null;
        
        // Éléments DOM
        this.container = null;
        this.channelsContainer = null;
        this.masterContainer = null;
        
        // Paramètres
        this.masterVolume = 0.8;
        
        // Callbacks
        this.onVolumeChange = null;
        this.onPanChange = null;
        this.onMuteChange = null;
        this.onSoloChange = null;
        this.onEffectChange = null;
        
        // Initialisation
        this.init();
    }
    
    init() {
        // Récupérer les éléments DOM
        this.container = document.getElementById('mixer-container');
        this.channelsContainer = document.getElementById('mixer-channels');
        this.masterContainer = document.querySelector('.master-controls');
        
        if (!this.container || !this.channelsContainer) {
            console.warn('Éléments DOM du mixeur non trouvés');
            return;
        }
        
        // Initialiser le canal maître
        this.initMasterChannel();
        
        // Initialiser les canaux de piste
        this.initTrackChannels();
        
        // Configurer les événements
        this.setupEvents();
        
        console.log('Mixeur initialisé');
    }
    
    initMasterChannel() {
        this.masterChannel = new MixerChannel({
            id: 'master',
            name: 'Maître',
            type: 'master',
            volume: this.masterVolume
        });
        
        // Créer l'élément DOM
        this.createChannelElement(this.masterChannel);
    }
    
    initTrackChannels() {
        const timeline = getTimeline();
        if (!timeline || !timeline.tracks) return;
        
        // Créer un canal pour chaque piste
        timeline.tracks.forEach(track => {
            const channel = new MixerChannel({
                id: track.id,
                name: track.name,
                type: 'track',
                track: track,
                volume: track.volume,
                pan: track.pan,
                muted: track.muted,
                soloed: track.soloed
            });
            
            this.channels.push(channel);
            
            // Créer l'élément DOM
            this.createChannelElement(channel);
            
            // Synchroniser avec la piste
            this.syncChannelWithTrack(channel, track);
        });
    }
    
    createChannelElement(channel) {
        if (!this.channelsContainer) return;
        
        const channelElement = document.createElement('div');
        channelElement.className = `mixer-channel ${channel.type}`;
        channelElement.id = `mixer-channel-${channel.id}`;
        channelElement.dataset.channelId = channel.id;
        
        // En-tête du canal
        const header = this.createChannelHeader(channel);
        
        // Contrôles du canal
        const controls = this.createChannelControls(channel);
        
        // Mètres du canal
        const meters = this.createChannelMeters(channel);
        
        // Ajouter les éléments
        channelElement.appendChild(header);
        channelElement.appendChild(controls);
        channelElement.appendChild(meters);
        
        // Ajouter au conteneur
        if (channel.type === 'master') {
            this.masterContainer.appendChild(channelElement);
        } else {
            this.channelsContainer.appendChild(channelElement);
        }
    }
    
    createChannelHeader(channel) {
        const header = document.createElement('div');
        header.className = 'channel-header';
        
        // Indicateur de couleur
        const colorIndicator = document.createElement('div');
        colorIndicator.className = 'channel-color';
        colorIndicator.style.backgroundColor = channel.track ? channel.track.color : '#6366f1';
        
        // Nom du canal
        const nameElement = document.createElement('div');
        nameElement.className = 'channel-name';
        nameElement.textContent = channel.name;
        nameElement.contentEditable = true;
        nameElement.onblur = () => {
            const newName = nameElement.textContent.trim() || `Canal ${channel.id}`;
            channel.setName(newName);
            nameElement.textContent = channel.name;
        };
        
        // Indicateur de type
        const typeElement = document.createElement('span');
        typeElement.className = 'channel-type';
        typeElement.textContent = channel.type === 'master' ? '🎛️' : '🎵';
        
        // Bouton de menu
        const menuBtn = document.createElement('button');
        menuBtn.className = 'btn btn-icon channel-menu-btn';
        menuBtn.innerHTML = '⋮';
        menuBtn.title = 'Menu du canal';
        menuBtn.onclick = (e) => {
            e.stopPropagation();
            this.showChannelMenu(channel, menuBtn);
        };
        
        // Ajouter les éléments
        header.appendChild(colorIndicator);
        header.appendChild(nameElement);
        header.appendChild(typeElement);
        header.appendChild(menuBtn);
        
        // Événement de clic pour la sélection
        header.addEventListener('click', (e) => {
            if (e.target === nameElement) return;
            this.selectChannel(channel);
        });
        
        return header;
    }
    
    createChannelControls(channel) {
        const controls = document.createElement('div');
        controls.className = 'channel-controls';
        
        // Contrôle de volume
        const volumeControl = this.createVolumeControl(channel);
        
        // Contrôle de panoramique
        const panControl = this.createPanControl(channel);
        
        // Boutons de mute et solo
        const muteSoloControls = this.createMuteSoloControls(channel);
        
        // Contrôles d'effets
        const effectsControls = this.createEffectsControls(channel);
        
        // Ajouter les contrôles
        controls.appendChild(volumeControl);
        controls.appendChild(panControl);
        controls.appendChild(muteSoloControls);
        controls.appendChild(effectsControls);
        
        return controls;
    }
    
    createVolumeControl(channel) {
        const volumeControl = document.createElement('div');
        volumeControl.className = 'control-group volume-control';
        
        // Label
        const label = document.createElement('label');
        label.textContent = 'Volume';
        
        // Slider vertical
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '100';
        slider.value = Math.round(channel.volume * 100);
        slider.orient = 'vertical';
        slider.className = 'volume-slider';
        slider.oninput = (e) => {
            const volume = parseFloat(e.target.value) / 100;
            channel.setVolume(volume);
            
            if (this.onVolumeChange) {
                this.onVolumeChange(channel, volume);
            }
        };
        
        // Valeur
        const value = document.createElement('span');
        value.className = 'control-value';
        value.textContent = `${Math.round(channel.volume * 100)}%`;
        
        // Mettre à jour la valeur lors du changement
        channel.onVolumeChange = (volume) => {
            slider.value = Math.round(volume * 100);
            value.textContent = `${Math.round(volume * 100)}%`;
        };
        
        // Ajouter les éléments
        volumeControl.appendChild(label);
        volumeControl.appendChild(slider);
        volumeControl.appendChild(value);
        
        return volumeControl;
    }
    
    createPanControl(channel) {
        const panControl = document.createElement('div');
        panControl.className = 'control-group pan-control';
        
        // Label
        const label = document.createElement('label');
        label.textContent = 'Pan';
        
        // Slider horizontal
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '-100';
        slider.max = '100';
        slider.value = Math.round(channel.pan * 100);
        slider.className = 'pan-slider';
        slider.oninput = (e) => {
            const pan = parseFloat(e.target.value) / 100;
            channel.setPan(pan);
            
            if (this.onPanChange) {
                this.onPanChange(channel, pan);
            }
        };
        
        // Valeur
        const value = document.createElement('span');
        value.className = 'control-value';
        value.textContent = channel.pan === 0 ? 'C' : (channel.pan < 0 ? 'L' : 'R');
        
        // Mettre à jour la valeur lors du changement
        channel.onPanChange = (pan) => {
            slider.value = Math.round(pan * 100);
            value.textContent = pan === 0 ? 'C' : (pan < 0 ? 'L' : 'R');
        };
        
        // Ajouter les éléments
        panControl.appendChild(label);
        panControl.appendChild(slider);
        panControl.appendChild(value);
        
        return panControl;
    }
    
    createMuteSoloControls(channel) {
        const controls = document.createElement('div');
        controls.className = 'control-group mute-solo-controls';
        
        // Bouton Mute
        const muteBtn = document.createElement('button');
        muteBtn.className = `btn btn-icon ${channel.muted ? 'active' : ''}`;
        muteBtn.innerHTML = channel.muted ? '🔇' : '🔊';
        muteBtn.title = channel.muted ? 'Désactiver le mute' : 'Mute';
        muteBtn.onclick = () => {
            channel.setMuted(!channel.muted);
            muteBtn.classList.toggle('active');
            muteBtn.innerHTML = channel.muted ? '🔇' : '🔊';
            muteBtn.title = channel.muted ? 'Désactiver le mute' : 'Mute';
            
            if (this.onMuteChange) {
                this.onMuteChange(channel, channel.muted);
            }
        };
        
        // Bouton Solo
        const soloBtn = document.createElement('button');
        soloBtn.className = `btn btn-icon ${channel.soloed ? 'active' : ''}`;
        soloBtn.innerHTML = channel.soloed ? '🎧' : '🎵';
        soloBtn.title = channel.soloed ? 'Désactiver le solo' : 'Solo';
        soloBtn.onclick = () => {
            channel.setSoloed(!channel.soloed);
            soloBtn.classList.toggle('active');
            soloBtn.innerHTML = channel.soloed ? '🎧' : '🎵';
            soloBtn.title = channel.soloed ? 'Désactiver le solo' : 'Solo';
            
            if (this.onSoloChange) {
                this.onSoloChange(channel, channel.soloed);
            }
        };
        
        // Ajouter les boutons
        controls.appendChild(muteBtn);
        controls.appendChild(soloBtn);
        
        // Mettre à jour les boutons lors du changement
        channel.onMuteChange = (muted) => {
            muteBtn.classList.toggle('active', muted);
            muteBtn.innerHTML = muted ? '🔇' : '🔊';
            muteBtn.title = muted ? 'Désactiver le mute' : 'Mute';
        };
        
        channel.onSoloChange = (soloed) => {
            soloBtn.classList.toggle('active', soloed);
            soloBtn.innerHTML = soloed ? '🎧' : '🎵';
            soloBtn.title = soloed ? 'Désactiver le solo' : 'Solo';
        };
        
        return controls;
    }
    
    createEffectsControls(channel) {
        const effectsControl = document.createElement('div');
        effectsControl.className = 'control-group effects-control';
        
        // Label
        const label = document.createElement('label');
        label.textContent = 'Effets';
        
        // Sélecteur d'effets
        const effectsSelect = document.createElement('select');
        effectsSelect.className = 'effects-select';
        
        // Options d'effets
        const effects = [
            { value: 'none', name: 'Aucun' },
            { value: 'reverb', name: 'Réverbération' },
            { value: 'delay', name: 'Delay' },
            { value: 'compressor', name: 'Compresseur' },
            { value: 'eq', name: 'Égaliseur' },
            { value: 'distortion', name: 'Distorsion' },
            { value: 'limiter', name: 'Limiteur' }
        ];
        
        effects.forEach(effect => {
            const option = document.createElement('option');
            option.value = effect.value;
            option.textContent = effect.name;
            effectsSelect.appendChild(option);
        });
        
        // Gestionnaire de changement
        effectsSelect.onchange = (e) => {
            const effect = e.target.value;
            channel.setEffect(effect);
            
            if (this.onEffectChange) {
                this.onEffectChange(channel, effect);
            }
        };
        
        // Ajouter les éléments
        effectsControl.appendChild(label);
        effectsControl.appendChild(effectsSelect);
        
        return effectsControl;
    }
    
    createChannelMeters(channel) {
        const meters = document.createElement('div');
        meters.className = 'channel-meters';
        
        // Mètre gauche
        const leftMeter = document.createElement('canvas');
        leftMeter.width = 20;
        leftMeter.height = 100;
        leftMeter.className = 'meter left';
        leftMeter.id = `meter-${channel.id}-left`;
        
        // Mètre droit
        const rightMeter = document.createElement('canvas');
        rightMeter.width = 20;
        rightMeter.height = 100;
        rightMeter.className = 'meter right';
        rightMeter.id = `meter-${channel.id}-right`;
        
        // Ajouter les mètres
        meters.appendChild(leftMeter);
        meters.appendChild(rightMeter);
        
        // Mettre à jour les mètres
        setInterval(() => {
            this.updateMeters(channel, leftMeter, rightMeter);
        }, 100);
        
        return meters;
    }
    
    updateMeters(channel, leftMeter, rightMeter) {
        if (!leftMeter || !rightMeter) return;
        
        // Obtenir le niveau audio
        let level = 0;
        let peak = 0;
        
        if (channel.type === 'master') {
            const audioEngine = getAudioEngine();
            if (audioEngine) {
                level = audioEngine.getMasterMeterLevel();
                peak = audioEngine.getMasterMeterPeak();
            }
        } else if (channel.track) {
            level = channel.track.getLevel();
            peak = channel.track.getPeak();
        }
        
        // Dessiner les mètres
        drawVuMeter(leftMeter, level, peak);
        drawVuMeter(rightMeter, level, peak);
    }
    
    syncChannelWithTrack(channel, track) {
        if (!channel || !track) return;
        
        // Synchroniser le volume
        channel.setVolume(track.volume);
        channel.onVolumeChange = (volume) => {
            track.setVolume(volume);
        };
        
        track.onVolumeChange = (volume) => {
            channel.setVolume(volume);
        };
        
        // Synchroniser le panoramique
        channel.setPan(track.pan);
        channel.onPanChange = (pan) => {
            track.setPan(pan);
        };
        
        track.onPanChange = (pan) => {
            channel.setPan(pan);
        };
        
        // Synchroniser le mute
        channel.setMuted(track.muted);
        channel.onMuteChange = (muted) => {
            track.setMuted(muted);
        };
        
        track.onMuteChange = (muted) => {
            channel.setMuted(muted);
        };
        
        // Synchroniser le solo
        channel.setSoloed(track.soloed);
        channel.onSoloChange = (soloed) => {
            track.setSoloed(soloed);
        };
        
        track.onSoloChange = (soloed) => {
            channel.setSoloed(soloed);
        };
    }
    
    showChannelMenu(channel, element) {
        // Créer un menu contextuel
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'absolute';
        menu.style.left = `${element.getBoundingClientRect().left}px`;
        menu.style.top = `${element.getBoundingClientRect().bottom}px`;
        menu.style.zIndex = '1000';
        
        // Options du menu
        const options = [
            { label: 'Renommer', action: () => this.renameChannel(channel) },
            { label: 'Réinitialiser les contrôles', action: () => this.resetChannel(channel) },
            { label: 'Supprimer', action: () => this.removeChannel(channel), disabled: channel.type === 'master' }
        ];
        
        options.forEach(option => {
            const item = document.createElement('div');
            item.className = `menu-item ${option.disabled ? 'disabled' : ''}`;
            item.textContent = option.label;
            item.onclick = () => {
                if (!option.disabled) {
                    option.action();
                }
                menu.remove();
            };
            menu.appendChild(item);
        });
        
        // Fermer le menu en cliquant à l'extérieur
        document.addEventListener('click', () => {
            menu.remove();
        }, { once: true });
        
        document.body.appendChild(menu);
    }
    
    renameChannel(channel) {
        const newName = prompt('Nouveau nom du canal:', channel.name);
        if (newName && newName.trim()) {
            channel.setName(newName.trim());
            const nameElement = document.querySelector(`#mixer-channel-${channel.id} .channel-name`);
            if (nameElement) {
                nameElement.textContent = channel.name;
            }
        }
    }
    
    resetChannel(channel) {
        channel.setVolume(1);
        channel.setPan(0);
        channel.setMuted(false);
        channel.setSoloed(false);
    }
    
    removeChannel(channel) {
        if (channel.type === 'master') return;
        
        // Supprimer de la liste
        const index = this.channels.findIndex(c => c.id === channel.id);
        if (index !== -1) {
            this.channels.splice(index, 1);
        }
        
        // Supprimer l'élément DOM
        const channelElement = document.getElementById(`mixer-channel-${channel.id}`);
        if (channelElement) {
            channelElement.remove();
        }
        
        // Désélectionner si c'était le canal sélectionné
        if (this.selectedChannel && this.selectedChannel.id === channel.id) {
            this.selectedChannel = null;
        }
    }
    
    selectChannel(channel) {
        if (this.selectedChannel === channel) return;
        
        // Désélectionner l'ancien canal
        if (this.selectedChannel) {
            const oldElement = document.getElementById(`mixer-channel-${this.selectedChannel.id}`);
            if (oldElement) {
                oldElement.classList.remove('selected');
            }
        }
        
        this.selectedChannel = channel;
        
        // Sélectionner le nouveau canal
        const newElement = document.getElementById(`mixer-channel-${channel.id}`);
        if (newElement) {
            newElement.classList.add('selected');
        }
    }
    
    // Gestion des canaux
    addChannel(options = {}) {
        const channel = new MixerChannel({
            id: options.id || generateId('channel-'),
            name: options.name || `Canal ${this.channels.length + 1}`,
            type: options.type || 'track',
            track: options.track || null,
            volume: options.volume !== undefined ? options.volume : 1,
            pan: options.pan !== undefined ? options.pan : 0,
            muted: options.muted || false,
            soloed: options.soloed || false
        });
        
        this.channels.push(channel);
        
        // Créer l'élément DOM
        this.createChannelElement(channel);
        
        // Synchroniser avec la piste si nécessaire
        if (channel.track) {
            this.syncChannelWithTrack(channel, channel.track);
        }
        
        return channel;
    }
    
    getChannel(channelId) {
        return this.channels.find(channel => channel.id === channelId);
    }
    
    // Contrôle maître
    setMasterVolume(volume) {
        this.masterVolume = clamp(volume, 0, 1);
        
        if (this.masterChannel) {
            this.masterChannel.setVolume(volume);
        }
        
        // Mettre à jour le moteur audio
        const audioEngine = getAudioEngine();
        if (audioEngine) {
            audioEngine.setMasterVolume(volume);
        }
    }
    
    getMasterVolume() {
        return this.masterVolume;
    }
    
    // Mise à jour
    update() {
        this.channels.forEach(channel => {
            if (channel.track) {
                channel.setVolume(channel.track.volume);
                channel.setPan(channel.track.pan);
                channel.setMuted(channel.track.muted);
                channel.setSoloed(channel.track.soloed);
            }
        });
    }
    
    // Sérialisation
    toJSON() {
        return {
            channels: this.channels.map(channel => channel.toJSON()),
            masterVolume: this.masterVolume
        };
    }
    
    static fromJSON(data) {
        const mixer = new Mixer();
        
        mixer.masterVolume = data.masterVolume || 0.8;
        
        // Charger les canaux
        data.channels.forEach(channelData => {
            const channel = MixerChannel.fromJSON(channelData);
            mixer.channels.push(channel);
            mixer.createChannelElement(channel);
        });
        
        return mixer;
    }
    
    // Nettoyage
    cleanup() {
        // Nettoyer les canaux
        this.channels.forEach(channel => {
            channel.cleanup();
        });
        this.channels = [];
        
        // Nettoyer le canal maître
        if (this.masterChannel) {
            this.masterChannel.cleanup();
            this.masterChannel = null;
        }
        
        // Réinitialiser les variables
        this.selectedChannel = null;
        this.masterVolume = 0.8;
        
        // Nettoyer les éléments DOM
        if (this.channelsContainer) {
            this.channelsContainer.innerHTML = '';
        }
        
        console.log('Mixeur nettoyé');
    }
}

// Classe MixerChannel
class MixerChannel {
    constructor(options = {}) {
        this.id = options.id || generateId('channel-');
        this.name = options.name || 'Nouveau canal';
        this.type = options.type || 'track';
        this.track = options.track || null;
        
        // Paramètres audio
        this.volume = options.volume !== undefined ? options.volume : 1;
        this.pan = options.pan !== undefined ? options.pan : 0;
        this.muted = options.muted || false;
        this.soloed = options.soloed || false;
        
        // Effets
        this.effects = options.effects || [];
        this.currentEffect = options.currentEffect || 'none';
        
        // Callbacks
        this.onVolumeChange = null;
        this.onPanChange = null;
        this.onMuteChange = null;
        this.onSoloChange = null;
        this.onEffectChange = null;
        
        // Initialisation
        this.init();
    }
    
    init() {
        // Initialiser les effets
        this.initEffects();
    }
    
    initEffects() {
        // Initialiser les effets par défaut
        this.effects = [
            { id: 'reverb', name: 'Réverbération', enabled: false, settings: {} },
            { id: 'delay', name: 'Delay', enabled: false, settings: {} },
            { id: 'compressor', name: 'Compresseur', enabled: false, settings: {} },
            { id: 'eq', name: 'Égaliseur', enabled: false, settings: {} },
            { id: 'distortion', name: 'Distorsion', enabled: false, settings: {} },
            { id: 'limiter', name: 'Limiteur', enabled: false, settings: {} }
        ];
    }
    
    setVolume(volume) {
        this.volume = clamp(volume, 0, 1);
        
        if (this.onVolumeChange) {
            this.onVolumeChange(this.volume);
        }
    }
    
    setPan(pan) {
        this.pan = clamp(pan, -1, 1);
        
        if (this.onPanChange) {
            this.onPanChange(this.pan);
        }
    }
    
    setMuted(muted) {
        this.muted = muted;
        
        if (this.onMuteChange) {
            this.onMuteChange(this.muted);
        }
    }
    
    setSoloed(soloed) {
        this.soloed = soloed;
        
        if (this.onSoloChange) {
            this.onSoloChange(this.soloed);
        }
    }
    
    setName(name) {
        this.name = name;
    }
    
    setEffect(effect) {
        this.currentEffect = effect;
        
        // Activer/désactiver les effets
        this.effects.forEach(eff => {
            eff.enabled = (eff.id === effect);
        });
        
        if (this.onEffectChange) {
            this.onEffectChange(effect);
        }
    }
    
    addEffect(effect) {
        this.effects.push(effect);
    }
    
    removeEffect(effectId) {
        const index = this.effects.findIndex(eff => eff.id === effectId);
        if (index !== -1) {
            this.effects.splice(index, 1);
            return true;
        }
        return false;
    }
    
    getEffect(effectId) {
        return this.effects.find(eff => eff.id === effectId);
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            volume: this.volume,
            pan: this.pan,
            muted: this.muted,
            soloed: this.soloed,
            currentEffect: this.currentEffect,
            effects: this.effects
        };
    }
    
    static fromJSON(data) {
        const channel = new MixerChannel({
            id: data.id,
            name: data.name,
            type: data.type,
            volume: data.volume,
            pan: data.pan,
            muted: data.muted,
            soloed: data.soloed
        });
        
        channel.currentEffect = data.currentEffect || 'none';
        channel.effects = data.effects || [];
        
        return channel;
    }
    
    cleanup() {
        this.onVolumeChange = null;
        this.onPanChange = null;
        this.onMuteChange = null;
        this.onSoloChange = null;
        this.onEffectChange = null;
    }
}

// Singleton du mixeur
let mixerInstance = null;

function getMixer() {
    if (!mixerInstance) {
        mixerInstance = new Mixer();
    }
    return mixerInstance;
}

// Exporter pour les autres modules
window.Mixer = Mixer;
window.MixerChannel = MixerChannel;
window.getMixer = getMixer;
