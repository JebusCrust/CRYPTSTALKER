/* ===== CRYPTSTALKER GAME WORLD ===== */
/* This script handles:
   - Corridor logic and navigation
   - Player movement and interactions
   - Enemy/NPC encounters
   - Item pickups and inventory
   - Event management within the game world
*/

class GameWorld {
    constructor(gameStateManager) {
        /* ===== REFERENCE TO STATE MANAGER ===== */
        this.stateManager = gameStateManager;

        /* ===== CORRIDOR DATA ===== */
        this.corridors = {
            corridor1: {
                id: 'corridor1',
                name: 'CORRIDOR I',
                description: 'Stone walls stretch before you, damp with centuries of moisture.\nA faint breeze echoes from deeper within...',
                exits: ['deeper', 'back'],
                enemies: [],
                items: []
            }
        };

        /* ===== CURRENT LOCATION ===== */
        this.currentCorridor = 'corridor1';

        /* ===== PLAYER STATE ===== */
        this.player = {
            health: 100,
            inventory: []
        };

        /* ===== SCREEN ELEMENTS ===== */
        this.corridorScreen = document.getElementById('corridor-screen');
        this.corridorContent = document.querySelector('.corridor-content');

        /* ===== BIND KEYBOARD EVENTS ===== */
        document.addEventListener('keydown', (e) => this.handleGameKeyPress(e));

        console.log('[WORLD] GameWorld initialized');
    }

    /* ===== HANDLE GAME STATE KEYBOARD INPUT ===== */
    handleGameKeyPress(event) {
        /* Only handle keys when in CORRIDOR state */
        if (this.stateManager.currentState !== this.stateManager.states.CORRIDOR) {
            return;
        }

        /* Check for movement/interaction keys */
        if (event.key === ' ') {
            event.preventDefault();
            this.continueDeeper();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            this.moveBack();
        } else if (event.key === 'i' || event.key === 'I') {
            event.preventDefault();
            this.openInventory();
        }
    }

    /* ===== UPDATE CORRIDOR DISPLAY ===== */
    updateCorridorDisplay() {
        const corridor = this.corridors[this.currentCorridor];
        
        if (!corridor) {
            console.error('Corridor not found:', this.currentCorridor);
            return;
        }

        console.log(`[WORLD] Displaying ${corridor.name}`);

        /* Update corridor header */
        const header = this.corridorContent.querySelector('.corridor-header h2');
        if (header) {
            header.textContent = corridor.name;
        }

        /* Update corridor description */
        const description = this.corridorContent.querySelector('.corridor-description p');
        if (description) {
            description.textContent = corridor.description;
        }
    }

    /* ===== MOVEMENT: Continue Deeper ===== */
    continueDeeper() {
        console.log('[WORLD] Player moving deeper...');
        this.playMovementSound();
        
        /* For now, just show a message */
        /* In future: load next corridor, spawn enemies, etc. */
        alert('You venture deeper into the crypt...\n\n[Coming soon: Next Corridor]');
    }

    /* ===== MOVEMENT: Move Back ===== */
    moveBack() {
        console.log('[WORLD] Player moving back...');
        this.playMovementSound();
        alert('You turn back...\n\n[Coming soon: Previous Area]');
    }

    /* ===== INVENTORY ===== */
    openInventory() {
        console.log('[WORLD] Opening inventory...');
        const itemCount = this.player.inventory.length;
        alert(`Inventory: ${itemCount} items\n\n[Coming soon: Full Inventory Screen]`);
    }

    /* ===== AUDIO: Movement Sound ===== */
    playMovementSound() {
        if (!this.stateManager.audioContext) return;

        try {
            const now = this.stateManager.audioContext.currentTime;
            const osc = this.stateManager.audioContext.createOscillator();
            const gain = this.stateManager.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.stateManager.uiGain);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.linearRampToValueAtTime(150, now + 0.2);
            
            gain.gain.setValueAtTime(0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            
            osc.start(now);
            osc.stop(now + 0.2);
        } catch (e) {
            console.log('Movement sound error:', e);
        }
    }
}

/* ===== INITIALIZE GAME WORLD AFTER STATE MANAGER ===== */
document.addEventListener('DOMContentLoaded', () => {
    /* Wait for state manager to be ready, then initialize game world */
    setTimeout(() => {
        if (window.gameStateManager) {
            console.log('[INIT] Initializing GameWorld...');
            window.gameWorld = new GameWorld(window.gameStateManager);
            
            /* Update corridor display when entering CORRIDOR state */
            const originalChangeState = window.gameStateManager.changeState.bind(window.gameStateManager);
            window.gameStateManager.changeState = function(newState) {
                originalChangeState(newState);
                if (newState === this.states.CORRIDOR && window.gameWorld) {
                    window.gameWorld.updateCorridorDisplay();
                }
            };
        }
    }, 100);
});
