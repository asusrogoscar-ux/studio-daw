// Gestion du stockage pour Studio DAW

class StorageManager {
    constructor() {
        this.dbName = 'StudioDAW';
        this.dbVersion = 1;
        this.db = null;
        this.isReady = false;
        
        // Stores
        this.stores = {
            projects: 'projects',
            samples: 'samples',
            settings: 'settings'
        };
        
        // Callbacks
        this.onReady = null;
        this.onError = null;
        
        // Initialisation
        this.init();
    }
    
    async init() {
        try {
            // Vérifier la prise en charge
            if (!isSupported('indexedDB')) {
                throw new Error('IndexedDB non supportée');
            }
            
            // Ouvrir la base de données
            this.db = await this.openDatabase();
            this.isReady = true;
            
            console.log('Base de données IndexedDB initialisée');
            
            if (this.onReady) {
                this.onReady();
            }
            
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du stockage:', error);
            showError('Erreur de stockage: ' + error.message);
            
            if (this.onError) {
                this.onError(error);
            }
        }
    }
    
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                reject(new Error('Impossible d\'ouvrir la base de données'));
            };
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Créer les stores si nécessaire
                if (!db.objectStoreNames.contains(this.stores.projects)) {
                    db.createObjectStore(this.stores.projects, { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains(this.stores.samples)) {
                    db.createObjectStore(this.stores.samples, { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    db.createObjectStore(this.stores.settings, { keyPath: 'id' });
                }
            };
        });
    }
    
    // Opérations sur les projets
    async saveProject(project) {
        if (!this.db || !this.isReady) {
            throw new Error('Base de données non prête');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.projects], 'readwrite');
            const store = transaction.objectStore(this.stores.projects);
            
            const projectData = {
                id: project.id,
                name: project.name,
                description: project.description || '',
                createdAt: project.createdAt || Date.now(),
                updatedAt: Date.now(),
                data: project.toJSON ? project.toJSON() : project
            };
            
            const request = store.put(projectData);
            
            request.onerror = () => {
                reject(new Error('Impossible de sauvegarder le projet'));
            };
            
            request.onsuccess = () => {
                resolve(projectData);
            };
        });
    }
    
    async loadProject(projectId) {
        if (!this.db || !this.isReady) {
            throw new Error('Base de données non prête');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.projects], 'readonly');
            const store = transaction.objectStore(this.stores.projects);
            
            const request = store.get(projectId);
            
            request.onerror = () => {
                reject(new Error('Impossible de charger le projet'));
            };
            
            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result);
                } else {
                    reject(new Error('Projet non trouvé'));
                }
            };
        });
    }
    
    async deleteProject(projectId) {
        if (!this.db || !this.isReady) {
            throw new Error('Base de données non prête');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.projects], 'readwrite');
            const store = transaction.objectStore(this.stores.projects);
            
            const request = store.delete(projectId);
            
            request.onerror = () => {
                reject(new Error('Impossible de supprimer le projet'));
            };
            
            request.onsuccess = () => {
                resolve(true);
            };
        });
    }
    
    async getAllProjects() {
        if (!this.db || !this.isReady) {
            throw new Error('Base de données non prête');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.projects], 'readonly');
            const store = transaction.objectStore(this.stores.projects);
            
            const request = store.getAll();
            
            request.onerror = () => {
                reject(new Error('Impossible de récupérer les projets'));
            };
            
            request.onsuccess = () => {
                // Trier par date de création
                const projects = request.result.sort((a, b) => b.createdAt - a.createdAt);
                resolve(projects);
            };
        });
    }
    
    // Opérations sur les samples
    async saveSample(sample) {
        if (!this.db || !this.isReady) {
            throw new Error('Base de données non prête');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.samples], 'readwrite');
            const store = transaction.objectStore(this.stores.samples);
            
            const sampleData = {
                id: sample.id,
                name: sample.name,
                category: sample.category,
                file: sample.file,
                color: sample.color,
                createdAt: Date.now()
            };
            
            const request = store.put(sampleData);
            
            request.onerror = () => {
                reject(new Error('Impossible de sauvegarder le sample'));
            };
            
            request.onsuccess = () => {
                resolve(sampleData);
            };
        });
    }
    
    async loadSample(sampleId) {
        if (!this.db || !this.isReady) {
            throw new Error('Base de données non prête');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.samples], 'readonly');
            const store = transaction.objectStore(this.stores.samples);
            
            const request = store.get(sampleId);
            
            request.onerror = () => {
                reject(new Error('Impossible de charger le sample'));
            };
            
            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result);
                } else {
                    reject(new Error('Sample non trouvé'));
                }
            };
        });
    }
    
    async deleteSample(sampleId) {
        if (!this.db || !this.isReady) {
            throw new Error('Base de données non prête');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.samples], 'readwrite');
            const store = transaction.objectStore(this.stores.samples);
            
            const request = store.delete(sampleId);
            
            request.onerror = () => {
                reject(new Error('Impossible de supprimer le sample'));
            };
            
            request.onsuccess = () => {
                resolve(true);
            };
        });
    }
    
    async getAllSamples() {
        if (!this.db || !this.isReady) {
            throw new Error('Base de données non prête');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.samples], 'readonly');
            const store = transaction.objectStore(this.stores.samples);
            
            const request = store.getAll();
            
            request.onerror = () => {
                reject(new Error('Impossible de récupérer les samples'));
            };
            
            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    }
    
    // Opérations sur les paramètres
    async saveSettings(settings) {
        if (!this.db || !this.isReady) {
            throw new Error('Base de données non prête');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.settings], 'readwrite');
            const store = transaction.objectStore(this.stores.settings);
            
            const settingsData = {
                id: 'settings',
                ...settings,
                updatedAt: Date.now()
            };
            
            const request = store.put(settingsData);
            
            request.onerror = () => {
                reject(new Error('Impossible de sauvegarder les paramètres'));
            };
            
            request.onsuccess = () => {
                resolve(settingsData);
            };
        });
    }
    
    async loadSettings() {
        if (!this.db || !this.isReady) {
            throw new Error('Base de données non prête');
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.settings], 'readonly');
            const store = transaction.objectStore(this.stores.settings);
            
            const request = store.get('settings');
            
            request.onerror = () => {
                reject(new Error('Impossible de charger les paramètres'));
            };
            
            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result);
                } else {
                    // Retourner les paramètres par défaut
                    resolve({
                        audio: CONFIG.audio,
                        project: CONFIG.project,
                        midi: CONFIG.midi
                    });
                }
            };
        });
    }
    
    // Export/Import
    async exportProject(projectId) {
        try {
            const project = await this.loadProject(projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }
            
            // Convertir en JSON
            const json = JSON.stringify(project, null, 2);
            
            // Créer un blob et télécharger
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name || 'projet'}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
            
        } catch (error) {
            console.error('Erreur lors de l\'export du projet:', error);
            throw error;
        }
    }
    
    async importProject(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    const project = JSON.parse(content);
                    
                    // Sauvegarder le projet
                    await this.saveProject(project);
                    
                    resolve(project);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    
    // Sauvegarde automatique
    startAutoSave(project, interval = 30000) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setInterval(async () => {
            try {
                await this.saveProject(project);
                console.log('Sauvegarde automatique effectuée');
            } catch (error) {
                console.error('Erreur lors de la sauvegarde automatique:', error);
            }
        }, interval);
    }
    
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }
    
    // Nettoyage
    cleanup() {
        this.stopAutoSave();
        
        if (this.db) {
            this.db.close();
            this.db = null;
        }
        
        this.isReady = false;
        
        console.log('Gestionnaire de stockage nettoyé');
    }
}

// Singleton du gestionnaire de stockage
let storageManagerInstance = null;

function getStorageManager() {
    if (!storageManagerInstance) {
        storageManagerInstance = new StorageManager();
    }
    return storageManagerInstance;
}

// Exporter pour les autres modules
window.StorageManager = StorageManager;
window.getStorageManager = getStorageManager;
window._storageManagerInstance = storageManagerInstance;
