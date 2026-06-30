/* ===== CRYPTSTALKER STATE MANAGER & MENU NAVIGATION ===== */
/* This script handles:
   - State transitions (BOOT → ACTIVE MENU → TRANSITION → CORRIDOR)
   - Boot sequence with initialization sound
   - Menu navigation when in ACTIVE MENU state
   - Smooth fading between states
   - Audio layering: ambient loop + UI sounds
*/

class GameStateManager {
    constructor() {
        /* ===== STATE CONSTANTS ===== */
        this.states = {
            BOOT: 'boot',
            ACTIVE_MENU: 'active-menu',
            TRANSITION: 'transition',
            CORRIDOR: 'corridor'
        };

        /* ===== CURRENT STATE TRACKING ===== */
        this.currentState = this.states.BOOT;

        /* ===== SCREEN ELEMENTS ===== */
        this.screens = {
            boot: document.getElementById('boot-screen'),
            activeMenu: document.getElementById('active-menu-screen'),
            transition: document.getElementById('transition-screen'),
            corridor: document.getElementById('corridor-screen')
        };

        /* ===== MENU STATE ===== */
        this.currentMenuIndex = 0;
        this.menuItems = Array.from(document.querySelectorAll('#menu .menu-item'));
        this.menuBox = document.getElementById('menu');

        /* ===== AUDIO CONTEXT & GAIN NODES ===== */
        this.audioContext = null;
        this.masterGain = null;
        this.ambientGain = null;
        this.uiGain = null;
        
        /* Initialize audio on first user interaction */
        document.addEventListener('keydown', () => {
            this.initializeAudio();
        }, { once: true });

        /* ===== BIND KEYBOARD EVENTS ===== */
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        /* ===== START BOOT SEQUENCE ===== */
        this.startBootSequence();
    }

    /* ===== INITIALIZE AUDIO CONTEXT ===== */
    initializeAudio() {
        if (this.audioContext) return;

        console.log('[AUDIO] Initializing audio context...');
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        /* Create master gain node */
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        this.masterGain.connect(this.audioContext.destination);

        /* Create ambient layer gain */
        this.ambientGain = this.audioContext.createGain();
        this.ambientGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        this.ambientGain.connect(this.masterGain);

        /* Create UI sounds gain */
        this.uiGain = this.audioContext.createGain();
        this.uiGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        this.uiGain.connect(this.masterGain);

        console.log('[AUDIO] Audio context ready');
    }

    /* ===== STATE TRANSITION LOGIC ===== */
    changeState(newState) {
        console.log(`[STATE] Transitioning: ${this.currentState} → ${newState}`);

        /* Hide current state screen */
        const screenMap = {
            boot: this.screens.boot,
            'active-menu': this.screens.activeMenu,
            transition: this.screens.transition,
            corridor: this.screens.corridor
        };

        if (screenMap[this.currentState]) {
            screenMap[this.currentState].classList.remove('active');
        }

        /* Update current state */
        this.currentState = newState;

        /* Show new state screen */
        if (screenMap[newState]) {
            screenMap[newState].classList.add('active');
        }

        /* Handle state-specific initialization */
        this.onStateChange(newState);
    }

    /* ===== STATE CHANGE HANDLERS ===== */
    onStateChange(state) {
        switch(state) {
            case this.states.BOOT:
                this.playBootHum();
                break;
            case this.states.ACTIVE_MENU:
                this.resetMenuSelection();
                this.startAmbientLoop();
                break;
            case this.states.TRANSITION:
                this.playTransitionSound();
                this.playCryptDescentSequence();
                this.stopAmbientLoop();
                break;
            case this.states.CORRIDOR:
                console.log('[STATE] Entered CORRIDOR state');
                break;
        }
    }

    /* ===== BOOT SEQUENCE (3 seconds) ===== */
    startBootSequence() {
        console.log('[BOOT] Starting boot sequence...');
        
        /* Play boot hum immediately */
        this.playBootHum();
        
        /* After 3 seconds, transition directly to ACTIVE_MENU */
        setTimeout(() => {
            console.log('[BOOT] Boot complete → transitioning to ACTIVE_MENU');
            this.changeState(this.states.ACTIVE_MENU);
            this.startAmbientLoop();
        }, 3000);
    }

    /* ===== HANDLE KEYBOARD INPUT ===== */
    handleKeyPress(event) {
        /* Only handle navigation keys when in ACTIVE_MENU state */
        if (this.currentState !== this.states.ACTIVE_MENU) {
            return;
        }

        /* Check for navigation keys */
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.moveMenuUp();
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.moveMenuDown();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            this.selectMenuOption();
        }
    }

    /* ===== MENU NAVIGATION UP ===== */
    moveMenuUp() {
        this.currentMenuIndex = (this.currentMenuIndex - 1 + this.menuItems.length) % this.menuItems.length;
        this.updateMenuDisplay();
        this.playNavigationSound();
    }

    /* ===== MENU NAVIGATION DOWN ===== */
    moveMenuDown() {
        this.currentMenuIndex = (this.currentMenuIndex + 1) % this.menuItems.length;
        this.updateMenuDisplay();
        this.playNavigationSound();
    }

    /* ===== UPDATE MENU VISUAL STATE ===== */
    updateMenuDisplay() {
        this.menuItems.forEach((item, index) => {
            if (index === this.currentMenuIndex) {
                item.classList.add('active');
                const cursor = item.querySelector('.cursor');
                if (cursor && !cursor.classList.contains('blinking')) {
                    cursor.classList.add('blinking');
                    cursor.textContent = '▶';
                }
            } else {
                item.classList.remove('active');
                const cursor = item.querySelector('.cursor');
                if (cursor) {
                    cursor.classList.remove('blinking');
                    cursor.textContent = '·';
                }
            }
        });
    }

    /* ===== RESET MENU TO START POSITION ===== */
    resetMenuSelection() {
        this.currentMenuIndex = 0;
        this.updateMenuDisplay();
    }

    /* ===== SELECT CURRENT MENU OPTION ===== */
    selectMenuOption() {
        const selectedItem = this.menuItems[this.currentMenuIndex];
        const action = selectedItem.dataset.action;

        if (selectedItem.classList.contains('disabled')) {
            this.playNavigationSound();
            return;
        }

        this.playConfirmSound();
        console.log(`[MENU] Selected: ${action}`);
        
        switch(action) {
            case 'start':
                this.startGame();
                break;
            case 'continue':
                this.continueGame();
                break;
            case 'options':
                this.openOptions();
                break;
            case 'exit':
                this.exitGame();
                break;
        }
    }

    /* ===== MENU ACTION HANDLERS ===== */
    
    startGame() {
        console.log('[ACTION] Starting new game...');
        this.changeState(this.states.TRANSITION);
        
        /* Ensure audio context exists before playing crypt sequence */
        if (!this.audioContext) {
            this.initializeAudio();
        }
        
        this.playCryptDescentSequence();
        
        setTimeout(() => {
            console.log('[ACTION] Transitioning to corridor...');
            this.changeState(this.states.CORRIDOR);
        }, 2000);
    }

    continueGame() {
        console.log('[ACTION] Cannot continue - no save data');
    }

    openOptions() {
        console.log('[ACTION] Opening options menu...');
        alert('OPTIONS - Coming soon!');
    }

    exitGame() {
        console.log('[ACTION] Exiting game...');
        alert('EXIT - Coming soon!');
    }

    /* ===== AMBIENT AUDIO LAYER ===== */
    /* Dark fantasy hum: low frequency, continuous, loops */
    
    startAmbientLoop() {
        if (!this.audioContext || !this.ambientGain) return;

        console.log('[AUDIO] Starting ambient loop');
        
        try {
            const now = this.audioContext.currentTime;
            
            /* Create ambient oscillators */
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const ambientGainNode = this.audioContext.createGain();
            
            osc1.connect(ambientGainNode);
            osc2.connect(ambientGainNode);
            ambientGainNode.connect(this.ambientGain);
            
            /* First oscillator: fundamental frequency (55 Hz = low hum) */
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(55, now);
            
            /* Second oscillator: harmonic (110 Hz = octave above) */
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(110, now);
            
            /* Slow volume modulation: creates "breathing" effect */
            ambientGainNode.gain.setValueAtTime(0.4, now);
            /* Pulse every 4 seconds: volume rises and falls */
            for (let i = 0; i < 10; i++) {
                const time = now + (i * 4);
                ambientGainNode.gain.setValueAtTime(0.4, time);
                ambientGainNode.gain.linearRampToValueAtTime(0.6, time + 2);
                ambientGainNode.gain.linearRampToValueAtTime(0.4, time + 4);
            }
            
            osc1.start(now);
            osc2.start(now);
            
            /* Store oscillators for later stopping */
            this.ambientOscs = { osc1, osc2, gainNode: ambientGainNode };
        } catch (e) {
            console.log('Ambient audio error:', e);
        }
    }

    /* ===== Stop ambient loop (fade out) ===== */
    stopAmbientLoop() {
        if (!this.audioContext || !this.ambientOscs) return;

        console.log('[AUDIO] Stopping ambient loop');

        try {
            const now = this.audioContext.currentTime;
            
            /* Fade out over 1 second */
            this.ambientOscs.gainNode.gain.setValueAtTime(this.ambientOscs.gainNode.gain.value, now);
            this.ambientOscs.gainNode.gain.linearRampToValueAtTime(0, now + 1);
            
            /* Stop oscillators after fade */
            this.ambientOscs.osc1.stop(now + 1);
            this.ambientOscs.osc2.stop(now + 1);
            
            this.ambientOscs = null;
        } catch (e) {
            console.log('Stop ambient error:', e);
        }
    }

    /* ===== AUDIO: Boot Hum ===== */
    playBootHum() {
        if (!this.audioContext) {
            this.initializeAudio();
        }

        console.log('[AUDIO] Playing boot hum');

        try {
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.uiGain);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(60, now);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(1, now + 0.5);
            gain.gain.setValueAtTime(1, now + 2.8);
            gain.gain.linearRampToValueAtTime(0, now + 3);
            
            osc.start(now);
            osc.stop(now + 3);
        } catch (e) {
            console.log('Boot hum error:', e);
        }
    }

    /* ===== AUDIO: Title Appear Sound ===== */
    playTitleAppearSound() {
        if (!this.audioContext) return;

        console.log('[AUDIO] Playing title appear sound');

        try {
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.uiGain);
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.3);
            
            gain.gain.setValueAtTime(1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);
        } catch (e) {
            console.log('Title appear error:', e);
        }
    }

    /* ===== AUDIO: Navigation Sound ===== */
    /* Soft SNES-like beep */
    playNavigationSound() {
        if (!this.audioContext) return;

        try {
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.uiGain);
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            
            gain.gain.setValueAtTime(1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
            
            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {
            console.log('Navigation sound error:', e);
        }
    }

    /* ===== AUDIO: Confirmation Sound ===== */
    /* Two-tone beep - heavier than navigation */
    playConfirmSound() {
        if (!this.audioContext) return;

        console.log('[AUDIO] Playing confirm sound');

        try {
            const now = this.audioContext.currentTime;
            
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.uiGain);
            
            osc1.type = 'square';
            osc2.type = 'square';
            
            osc1.frequency.setValueAtTime(600, now);
            osc2.frequency.setValueAtTime(900, now);
            
            gain.gain.setValueAtTime(1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            
            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.15);
            osc2.stop(now + 0.15);
        } catch (e) {
            console.log('Confirm sound error:', e);
        }
    }

    /* ===== AUDIO: Transition Sound ===== */
    /* Descending tone when starting game */
    playTransitionSound() {
        if (!this.audioContext) return;

        console.log('[AUDIO] Playing transition sound');

        try {
            const now = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.uiGain);
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);
            
            gain.gain.setValueAtTime(1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            
            osc.start(now);
            osc.stop(now + 0.4);
        } catch (e) {
            console.log('Transition sound error:', e);
        }
    }

    /* ===== AUDIO: Crypt Descent Sequence ===== */
    /* Footsteps, echo, door sounds, and crypt ambiance */
    playCryptDescentSequence() {
        if (!this.audioContext) {
            this.initializeAudio();
        }

        console.log('[AUDIO] Playing crypt descent sequence');

        try {
            const now = this.audioContext.currentTime;

            /* === FOOTSTEPS (0.0s - 1.2s) === */
            for (let i = 0; i < 3; i++) {
                const stepTime = now + (i * 0.4);
                this.playFootstep(stepTime, 150 - (i * 30));
            }

            /* === DOOR CREAK (1.2s - 1.8s) === */
            this.playDoorCreak(now + 1.2);

            /* === CRYPT AMBIANCE (1.8s onwards) === */
            this.playCryptAmbiance(now + 1.8);

        } catch (e) {
            console.log('Crypt descent error:', e);
        }
    }

    /* ===== AUDIO: Single Footstep ===== */
    playFootstep(time, frequency) {
        if (!this.audioContext) return;

        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.uiGain);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, time);
            
            gain.gain.setValueAtTime(0.8, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
            
            osc.start(time);
            osc.stop(time + 0.15);
        } catch (e) {
            console.log('Footstep error:', e);
        }
    }

    /* ===== AUDIO: Door Creak ===== */
    playDoorCreak(time) {
        if (!this.audioContext) return;

        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.uiGain);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, time);
            osc.frequency.linearRampToValueAtTime(80, time + 0.6);
            
            gain.gain.setValueAtTime(1, time);
            gain.gain.exponentialRampToValueAtValue(0.01, time + 0.6);
            
            osc.start(time);
            osc.stop(time + 0.6);
        } catch (e) {
            console.log('Door creak error:', e);
        }
    }

    /* ===== AUDIO: Crypt Ambiance ===== */
    /* Low rumble with slight reverb effect */
    playCryptAmbiance(time) {
        if (!this.audioContext) return;

        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.uiGain);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(40, time);
            
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.linearRampToValueAtTime(0.6, time + 2);
            gain.gain.linearRampToValueAtTime(0, time + 4);
            
            osc.start(time);
            osc.stop(time + 4);
        } catch (e) {
            console.log('Crypt ambiance error:', e);
        }
    }
}

/* ===== INITIALIZE STATE MANAGER ON PAGE LOAD ===== */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[INIT] Initializing GameStateManager...');
    window.gameStateManager = new GameStateManager();
});
