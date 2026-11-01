// Bibliothèque de samples pour Studio DAW

class SamplesLibrary {
    constructor() {
        this.samples = new Map();
        this.categories = new Map();
        this.loadedSamples = new Map();
        this.sampler = null;
        
        // Catégories par défaut
        this.defaultCategories = [
            { id: 'kick', name: 'Kicks', color: '#ef4444' },
            { id: 'snare', name: 'Snares', color: '#3b82f6' },
            { id: 'hihat', name: 'Hi-Hats', color: '#10b981' },
            { id: 'clap', name: 'Claps', color: '#f59e0b' },
            { id: 'bass', name: 'Basses', color: '#8b5cf6' },
            { id: 'synth', name: 'Synthés', color: '#ec4899' },
            { id: 'fx', name: 'Effets', color: '#06b6d4' },
            { id: 'vocals', name: 'Vocaux', color: '#6366f1' },
            { id: 'drums', name: 'Batterie', color: '#1e293b' },
            { id: 'piano', name: 'Piano', color: '#f8fafc' },
            { id: 'guitar', name: 'Guitare', color: '#94a3b8' },
            { id: 'strings', name: 'Cordes', color: '#475569' },
            { id: 'brass', name: 'Cuivres', color: '#334155' }
        ];
        
        // Éléments DOM
        this.grid = null;
        this.filters = null;
        this.searchInput = null;
        this.categoryFilters = null;
        
        // État
        this.selectedCategory = 'all';
        this.searchQuery = '';
        
        // Callbacks
        this.onSampleSelect = null;
        this.onSamplePlay = null;
        this.onSampleLoad = null;
        
        // Initialisation
        this.init();
    }
    
    init() {
        // Récupérer les éléments DOM
        this.grid = document.getElementById('samples-grid');
        this.searchInput = document.querySelector('.search-bar input');
        this.categoryFilters = document.querySelector('.category-filters');
        
        if (!this.grid) {
            console.warn('Éléments DOM de la bibliothèque de samples non trouvés');
            return;
        }
        
        // Initialiser les catégories
        this.initCategories();
        
        // Initialiser le sampler
        this.initSampler();
        
        // Charger les samples par défaut
        this.loadDefaultSamples();
        
        // Configurer les événements
        this.setupEvents();
        
        // Afficher les samples
        this.displaySamples();
        
        console.log('Bibliothèque de samples initialisée');
    }
    
    initCategories() {
        // Ajouter les catégories par défaut
        this.defaultCategories.forEach(category => {
            this.categories.set(category.id, category);
        });
        
        // Créer les filtres de catégorie
        this.createCategoryFilters();
    }
    
    createCategoryFilters() {
        if (!this.categoryFilters) return;
        
        // Effacer les filtres existants
        this.categoryFilters.innerHTML = '';
        
        // Filtre "Tous"
        const allFilter = document.createElement('button');
        allFilter.className = `filter-btn ${this.selectedCategory === 'all' ? 'active' : ''}`;
        allFilter.textContent = 'Tous';
        allFilter.dataset.category = 'all';
        allFilter.onclick = () => this.setCategory('all');
        this.categoryFilters.appendChild(allFilter);
        
        // Filtres par catégorie
        this.categories.forEach((category, id) => {
            const filter = document.createElement('button');
            filter.className = `filter-btn ${this.selectedCategory === id ? 'active' : ''}`;
            filter.textContent = category.name;
            filter.dataset.category = id;
            filter.style.setProperty('--filter-color', category.color);
            filter.onclick = () => this.setCategory(id);
            this.categoryFilters.appendChild(filter);
        });
    }
    
    initSampler() {
        const audioEngine = getAudioEngine();
        if (audioEngine && audioEngine.samplers) {
            this.sampler = audioEngine.samplers.drums;
        }
    }
    
    loadDefaultSamples() {
        // Charger les samples par défaut (déjà chargés dans le sampler)
        // Ajouter des samples à la bibliothèque
        
        const samples = [
            { id: 'kick-1', name: 'Kick 1', category: 'kick', file: null, color: '#ef4444' },
            { id: 'kick-2', name: 'Kick 2', category: 'kick', file: null, color: '#dc2626' },
            { id: 'kick-808', name: 'Kick 808', category: 'kick', file: null, color: '#b91c1c' },
            
            { id: 'snare-1', name: 'Snare 1', category: 'snare', file: null, color: '#3b82f6' },
            { id: 'snare-2', name: 'Snare 2', category: 'snare', file: null, color: '#2563eb' },
            { id: 'snare-3', name: 'Snare 3', category: 'snare', file: null, color: '#1d4ed8' },
            
            { id: 'hihat-closed-1', name: 'Hi-Hat Fermé 1', category: 'hihat', file: null, color: '#10b981' },
            { id: 'hihat-closed-2', name: 'Hi-Hat Fermé 2', category: 'hihat', file: null, color: '#059669' },
            { id: 'hihat-open-1', name: 'Hi-Hat Ouvert 1', category: 'hihat', file: null, color: '#047857' },
            { id: 'hihat-open-2', name: 'Hi-Hat Ouvert 2', category: 'hihat', file: null, color: '#6ee7b7' },
            
            { id: 'clap-1', name: 'Clap 1', category: 'clap', file: null, color: '#f59e0b' },
            { id: 'clap-2', name: 'Clap 2', category: 'clap', file: null, color: '#d97706' },
            
            { id: '808-1', name: '808 Bass 1', category: 'bass', file: null, color: '#8b5cf6' },
            { id: '808-2', name: '808 Bass 2', category: 'bass', file: null, color: '#7c3aed' },
            { id: '808-3', name: '808 Bass 3', category: 'bass', file: null, color: '#6d28d9' },
            
            { id: 'cymbal-1', name: 'Cymbal 1', category: 'drums', file: null, color: '#ec4899' },
            { id: 'cymbal-2', name: 'Cymbal 2', category: 'drums', file: null, color: '#db2777' },
            { id: 'tom-1', name: 'Tom 1', category: 'drums', file: null, color: '#06b6d4' },
            { id: 'tom-2', name: 'Tom 2', category: 'drums', file: null, color: '#0891b2' },
            
            { id: 'synth-bass-1', name: 'Synth Bass 1', category: 'synth', file: null, color: '#6366f1' },
            { id: 'synth-lead-1', name: 'Synth Lead 1', category: 'synth', file: null, color: '#4f46e5' },
            { id: 'synth-pad-1', name: 'Synth Pad 1', category: 'synth', file: null, color: '#4338ca' },
            
            { id: 'fx-rise-1', name: 'Rise 1', category: 'fx', file: null, color: '#1e293b' },
            { id: 'fx-sweep-1', name: 'Sweep 1', category: 'fx', file: null, color: '#334155' },
            { id: 'fx-noise-1', name: 'Noise 1', category: 'fx', file: null, color: '#475569' }
        ];
        
        samples.forEach(sample => {
            this.addSample(sample);
        });
    }
    
    addSample(sample) {
        this.samples.set(sample.id, sample);
        
        // Ajouter à la catégorie
        if (!this.categories.has(sample.category)) {
            this.categories.set(sample.category, {
                id: sample.category,
                name: sample.category.charAt(0).toUpperCase() + sample.category.slice(1),
                color: sample.color || stringToColor(sample.category)
            });
        }
        
        // Recharger les filtres
        this.createCategoryFilters();
        
        // Afficher les samples
        this.displaySamples();
    }
    
    removeSample(sampleId) {
        const sample = this.samples.get(sampleId);
        if (!sample) return false;
        
        this.samples.delete(sampleId);
        
        // Afficher les samples
        this.displaySamples();
        
        return true;
    }
    
    getSample(sampleId) {
        return this.samples.get(sampleId);
    }
    
    getSamplesByCategory(category) {
        if (category === 'all') {
            return Array.from(this.samples.values());
        }
        
        return Array.from(this.samples.values()).filter(sample => sample.category === category);
    }
    
    searchSamples(query) {
        this.searchQuery = query.toLowerCase();
        this.displaySamples();
    }
    
    setCategory(category) {
        this.selectedCategory = category;
        
        // Mettre à jour les boutons de filtre
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        this.displaySamples();
    }
    
    displaySamples() {
        if (!this.grid) return;
        
        // Effacer la grille
        this.grid.innerHTML = '';
        
        // Obtenir les samples filtrés
        let samples = this.getSamplesByCategory(this.selectedCategory);
        
        // Filtrer par recherche
        if (this.searchQuery) {
            samples = samples.filter(sample => 
                sample.name.toLowerCase().includes(this.searchQuery)
            );
        }
        
        // Afficher les samples
        samples.forEach(sample => {
            const sampleElement = this.createSampleElement(sample);
            this.grid.appendChild(sampleElement);
        });
    }
    
    createSampleElement(sample) {
        const element = document.createElement('div');
        element.className = 'sample-item';
        element.dataset.sampleId = sample.id;
        element.style.setProperty('--sample-color', sample.color);
        
        // Icône
        const icon = document.createElement('div');
        icon.className = 'sample-icon';
        icon.innerHTML = '🔊';
        
        // Infos
        const info = document.createElement('div');
        info.className = 'sample-info';
        
        const name = document.createElement('div');
        name.className = 'sample-name';
        name.textContent = sample.name;
        
        const category = document.createElement('div');
        category.className = 'sample-category';
        category.textContent = this.categories.get(sample.category)?.name || sample.category;
        category.style.color = sample.color;
        
        info.appendChild(name);
        info.appendChild(category);
        
        // Bouton de lecture
        const playBtn = document.createElement('button');
        playBtn.className = 'sample-play-btn btn btn-icon';
        playBtn.innerHTML = '▶';
        playBtn.title = 'Lire';
        playBtn.onclick = (e) => {
            e.stopPropagation();
            this.playSample(sample);
        };
        
        // Ajouter les éléments
        element.appendChild(icon);
        element.appendChild(info);
        element.appendChild(playBtn);
        
        // Gestionnaire de clic
        element.addEventListener('click', () => {
            this.selectSample(sample);
        });
        
        // Gestionnaire de double clic
        element.addEventListener('dblclick', () => {
            this.playSample(sample);
            this.selectSample(sample);
        });
        
        return element;
    }
    
    selectSample(sample) {
        if (this.onSampleSelect) {
            this.onSampleSelect(sample);
        }
    }
    
    playSample(sample) {
        if (!this.sampler) {
            const audioEngine = getAudioEngine();
            if (audioEngine && audioEngine.samplers) {
                this.sampler = audioEngine.samplers.drums;
            }
        }
        
        if (this.sampler) {
            // Mapper l'ID du sample au son de batterie
            const soundMapping = {
                'kick-1': 'kick',
                'kick-2': 'kick',
                'kick-808': '808',
                'snare-1': 'snare',
                'snare-2': 'snare',
                'snare-3': 'snare',
                'hihat-closed-1': 'hihat-closed',
                'hihat-closed-2': 'hihat-closed',
                'hihat-open-1': 'hihat-open',
                'hihat-open-2': 'hihat-open',
                'clap-1': 'clap',
                'clap-2': 'clap',
                '808-1': '808',
                '808-2': '808',
                '808-3': '808',
                'cymbal-1': 'cymbal',
                'cymbal-2': 'cymbal',
                'tom-1': 'tom',
                'tom-2': 'tom'
            };
            
            const sound = soundMapping[sample.id] || sample.id;
            this.sampler.play(sound);
        }
        
        if (this.onSamplePlay) {
            this.onSamplePlay(sample);
        }
    }
    
    loadSample(sample, buffer) {
        if (!this.sampler) {
            const audioEngine = getAudioEngine();
            if (audioEngine && audioEngine.samplers) {
                this.sampler = audioEngine.samplers.drums;
            }
        }
        
        if (this.sampler) {
            this.sampler.loadSample(sample.id, buffer);
            sample.buffer = buffer;
            sample.loaded = true;
            
            if (this.onSampleLoad) {
                this.onSampleLoad(sample);
            }
        }
    }
    
    loadSampleFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const audioEngine = getAudioEngine();
                    if (!audioEngine || !audioEngine.audioContext) {
                        throw new Error('Contexte audio non disponible');
                    }
                    
                    const arrayBuffer = e.target.result;
                    const buffer = await audioEngine.audioContext.decodeAudioData(arrayBuffer);
                    
                    // Créer un sample
                    const sample = {
                        id: generateId('sample-'),
                        name: file.name.replace(/\.[^/.]+$/, ''),
                        category: 'custom',
                        file: file.name,
                        buffer: buffer,
                        color: stringToColor(file.name)
                    };
                    
                    // Ajouter à la bibliothèque
                    this.addSample(sample);
                    this.loadSample(sample, buffer);
                    
                    resolve(sample);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    setupEvents() {
        // Recherche
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchSamples(e.target.value);
            });
        }
        
        // Filtres de catégorie
        if (this.categoryFilters) {
            this.categoryFilters.addEventListener('click', (e) => {
                const filterBtn = e.target.closest('.filter-btn');
                if (filterBtn) {
                    this.setCategory(filterBtn.dataset.category);
                }
            });
        }
    }
    
    // Sérialisation
    toJSON() {
        return {
            samples: Array.from(this.samples.values()).map(sample => ({
                id: sample.id,
                name: sample.name,
                category: sample.category,
                file: sample.file,
                color: sample.color
            })),
            categories: Array.from(this.categories.values()).map(category => ({
                id: category.id,
                name: category.name,
                color: category.color
            }))
        };
    }
    
    static fromJSON(data) {
        const library = new SamplesLibrary();
        
        // Charger les catégories
        data.categories.forEach(categoryData => {
            library.categories.set(categoryData.id, categoryData);
        });
        
        // Charger les samples
        data.samples.forEach(sampleData => {
            library.addSample(sampleData);
        });
        
        // Recharger les filtres
        library.createCategoryFilters();
        
        return library;
    }
    
    // Nettoyage
    cleanup() {
        this.samples.clear();
        this.categories.clear();
        this.loadedSamples.clear();
        this.sampler = null;
        
        if (this.grid) {
            this.grid.innerHTML = '';
        }
        
        console.log('Bibliothèque de samples nettoyée');
    }
}

// Singleton de la bibliothèque de samples
let samplesLibraryInstance = null;

function getSamplesLibrary() {
    if (!samplesLibraryInstance) {
        samplesLibraryInstance = new SamplesLibrary();
    }
    return samplesLibraryInstance;
}

// Exporter pour les autres modules
window.SamplesLibrary = SamplesLibrary;
window.getSamplesLibrary = getSamplesLibrary;
