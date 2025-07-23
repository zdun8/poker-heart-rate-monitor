// Application data from JSON
const HEART_RATE_THRESHOLDS = {
  resting: { min: 60, max: 80, color: "#4CAF50", label: "Resting" },
  elevated: { min: 80, max: 100, color: "#FFC107", label: "Elevated" },
  high: { min: 100, max: 120, color: "#FF9800", label: "High" },
  very_high: { min: 120, max: 200, color: "#F44336", label: "Very High" }
};

const SUPPORTED_BROWSERS = [
  "Chrome (56+)", 
  "Edge (79+)", 
  "Opera (43+)", 
  "Samsung Internet (6.2+)"
];

const UNSUPPORTED_BROWSERS = [
  "Safari (iOS/macOS)",
  "Firefox", 
  "Internet Explorer"
];

const GARMIN_SETUP_INSTRUCTIONS = [
  "Press and hold the UP button to access the Controls menu",
  "Navigate to Settings > Sensors & Accessories > Wrist Heart Rate",
  "Select 'Broadcast Heart Rate'",
  "Press START to begin broadcasting",
  "Your heart rate is now broadcasting via Bluetooth LE"
];

const TABLE_POSITIONS = [
  {id: 1, x: 50, y: 15, label: "Player 1"},
  {id: 2, x: 80, y: 25, label: "Player 2"},
  {id: 3, x: 95, y: 50, label: "Player 3"},
  {id: 4, x: 80, y: 75, label: "Player 4"},
  {id: 5, x: 50, y: 85, label: "Player 5"},
  {id: 6, x: 20, y: 75, label: "Player 6"},
  {id: 7, x: 5, y: 50, label: "Player 7"},
  {id: 8, x: 20, y: 25, label: "Player 8"}
];

// Application state
class PokerHRApp {
  constructor() {
    this.players = [];
    this.isMonitoring = false;
    this.sessionStartTime = null;
    this.sessionInterval = null;
    this.heartRateHistory = {};
    this.spikeCount = 0;
    this.currentPlayerSetup = null;
    
    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    console.log('Initializing Poker HR App');
    this.checkBrowserCompatibility();
    this.setupEventListeners();
    this.renderPlayerPositions();
    this.populateGarminInstructions();
    console.log('App initialized successfully');
  }

  // Browser compatibility check
  checkBrowserCompatibility() {
    const isSupported = 'bluetooth' in navigator;
    const statusEl = document.getElementById('compatibility-status');
    const startBtn = document.getElementById('start-app');
    
    if (!statusEl || !startBtn) {
      console.error('Required DOM elements not found');
      return;
    }
    
    if (isSupported) {
      statusEl.textContent = '✅ Your browser supports Web Bluetooth!';
      statusEl.className = 'supported';
      startBtn.disabled = false;
    } else {
      statusEl.textContent = '⚠️ Your browser does not support Web Bluetooth (UI Demo Mode Available)';
      statusEl.className = 'unsupported';
      // Enable button for demo mode even without Bluetooth
      startBtn.disabled = false;
    }

    // Populate browser lists
    this.populateBrowserLists();
  }

  populateBrowserLists() {
    const supportedList = document.getElementById('supported-list');
    const unsupportedList = document.getElementById('unsupported-list');
    
    if (!supportedList || !unsupportedList) return;
    
    supportedList.innerHTML = '';
    unsupportedList.innerHTML = '';
    
    SUPPORTED_BROWSERS.forEach(browser => {
      const li = document.createElement('li');
      li.textContent = browser;
      supportedList.appendChild(li);
    });

    UNSUPPORTED_BROWSERS.forEach(browser => {
      const li = document.createElement('li');
      li.textContent = browser;
      unsupportedList.appendChild(li);
    });
  }

  // Setup event listeners
  setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Welcome screen events
    this.setupWelcomeEvents();
    
    // Main app events
    this.setupMainAppEvents();
    
    // Modal events
    this.setupModalEvents();
  }

  setupWelcomeEvents() {
    const startAppBtn = document.getElementById('start-app');
    const showRequirementsBtn = document.getElementById('show-requirements');
    
    if (startAppBtn) {
      startAppBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Start app button clicked');
        this.showMainApp();
      });
    }

    if (showRequirementsBtn) {
      showRequirementsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Show requirements button clicked');
        this.toggleRequirements();
      });
    }
  }

  setupMainAppEvents() {
    const addPlayerBtn = document.getElementById('add-player-btn');
    const startMonitoringBtn = document.getElementById('start-monitoring');
    const stopMonitoringBtn = document.getElementById('stop-monitoring');
    const resetSessionBtn = document.getElementById('reset-session');
    
    if (addPlayerBtn) {
      addPlayerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openAddPlayerModal();
      });
    }

    if (startMonitoringBtn) {
      startMonitoringBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.startSession();
      });
    }

    if (stopMonitoringBtn) {
      stopMonitoringBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.stopSession();
      });
    }

    if (resetSessionBtn) {
      resetSessionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetSession();
      });
    }
  }

  setupModalEvents() {
    const closeModalBtn = document.getElementById('close-modal');
    const playerNameInput = document.getElementById('player-name');
    const nextToSetupBtn = document.getElementById('next-to-setup');
    const backToNameBtn = document.getElementById('back-to-name');
    const connectDeviceBtn = document.getElementById('connect-device');
    const cancelConnectionBtn = document.getElementById('cancel-connection');
    const finishAddPlayerBtn = document.getElementById('finish-add-player');
    const modal = document.getElementById('add-player-modal');
    
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeAddPlayerModal();
      });
    }

    if (playerNameInput) {
      playerNameInput.addEventListener('input', (e) => {
        const nextBtn = document.getElementById('next-to-setup');
        if (nextBtn) {
          nextBtn.disabled = e.target.value.trim().length === 0;
        }
      });
    }

    if (nextToSetupBtn) {
      nextToSetupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showDeviceSetup();
      });
    }

    if (backToNameBtn) {
      backToNameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showNameInput();
      });
    }

    if (connectDeviceBtn) {
      connectDeviceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.connectGarminDevice();
      });
    }

    if (cancelConnectionBtn) {
      cancelConnectionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.cancelConnection();
      });
    }

    if (finishAddPlayerBtn) {
      finishAddPlayerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeAddPlayerModal();
      });
    }

    // Modal backdrop close
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeAddPlayerModal();
        }
      });
    }
  }

  // Screen navigation
  showMainApp() {
    console.log('Transitioning to main app');
    
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainApp = document.getElementById('main-app');
    
    if (welcomeScreen && mainApp) {
      welcomeScreen.classList.remove('active');
      mainApp.classList.add('active');
      console.log('Main app is now active');
    } else {
      console.error('Screen elements not found', { welcomeScreen, mainApp });
    }
  }

  toggleRequirements() {
    const requirementsSection = document.getElementById('browser-requirements');
    if (requirementsSection) {
      requirementsSection.classList.toggle('hidden');
      console.log('Requirements toggled');
    }
  }

  // Render player positions on table
  renderPlayerPositions() {
    const container = document.getElementById('player-positions');
    if (!container) {
      console.error('Player positions container not found');
      return;
    }
    
    container.innerHTML = '';

    TABLE_POSITIONS.forEach(position => {
      const positionEl = document.createElement('div');
      positionEl.className = 'player-position';
      positionEl.style.left = `${position.x}%`;
      positionEl.style.top = `${position.y}%`;
      positionEl.innerHTML = `
        <div class="player-slot empty" id="player-${position.id}">
          <div class="player-info">
            <div class="player-name">Empty Seat</div>
            <div class="connection-status">Waiting for player...</div>
          </div>
        </div>
      `;
      container.appendChild(positionEl);
    });
  }

  // Populate Garmin setup instructions
  populateGarminInstructions() {
    const instructionsList = document.getElementById('garmin-instructions');
    if (!instructionsList) return;
    
    instructionsList.innerHTML = '';
    GARMIN_SETUP_INSTRUCTIONS.forEach(instruction => {
      const li = document.createElement('li');
      li.textContent = instruction;
      instructionsList.appendChild(li);
    });
  }

  // Modal management
  openAddPlayerModal() {
    if (this.players.length >= 8) {
      this.showAlert('Maximum 8 players allowed', 'error');
      return;
    }

    const modal = document.getElementById('add-player-modal');
    const playerNameInput = document.getElementById('player-name');
    
    if (modal) {
      modal.classList.add('active');
    }
    
    if (playerNameInput) {
      playerNameInput.value = '';
      playerNameInput.focus();
    }
    
    this.showNameInput();
  }

  closeAddPlayerModal() {
    const modal = document.getElementById('add-player-modal');
    if (modal) {
      modal.classList.remove('active');
    }
    this.currentPlayerSetup = null;
  }

  showNameInput() {
    this.hideAllSetupSteps();
    const step1 = document.getElementById('player-setup-step1');
    if (step1) {
      step1.classList.add('active');
    }
  }

  showDeviceSetup() {
    const playerNameInput = document.getElementById('player-name');
    if (!playerNameInput) return;
    
    const playerName = playerNameInput.value.trim();
    if (!playerName) return;

    this.currentPlayerSetup = { name: playerName };
    
    this.hideAllSetupSteps();
    const step2 = document.getElementById('player-setup-step2');
    if (step2) {
      step2.classList.add('active');
    }
  }

  hideAllSetupSteps() {
    const steps = document.querySelectorAll('.setup-step');
    steps.forEach(step => step.classList.remove('active'));
  }

  // Device connection
  async connectGarminDevice() {
    this.hideAllSetupSteps();
    const step3 = document.getElementById('player-setup-step3');
    if (step3) {
      step3.classList.add('active');
    }

    const messageEl = document.getElementById('connection-message');
    
    try {
      if (!('bluetooth' in navigator)) {
        // Demo mode - simulate connection
        await this.simulateDeviceConnection(messageEl);
        return;
      }
      
      // Real Bluetooth connection
      await this.performBluetoothConnection(messageEl);

    } catch (error) {
      console.error('Connection failed:', error);
      this.showAlert('Failed to connect device. Please try again.', 'error');
      this.showDeviceSetup();
    }
  }

  async simulateDeviceConnection(messageEl) {
    if (messageEl) messageEl.textContent = 'Demo Mode: Simulating device connection...';
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create mock player
    const player = {
      id: this.players.length + 1,
      name: this.currentPlayerSetup.name,
      device: null, // Mock device
      characteristic: null,
      heartRate: Math.floor(Math.random() * 40) + 60, // Random HR between 60-100
      status: 'resting',
      trend: 'stable',
      connected: true,
      position: this.getNextAvailablePosition(),
      lastHeartRate: 0,
      heartRateHistory: []
    };

    this.addPlayerToSystem(player);
    this.setupMockHeartRateMonitoring(player);
    this.showPlayerAddedSuccess(player);
    
    this.showAlert(`${player.name} connected successfully! (Demo Mode)`, 'success');
  }

  async performBluetoothConnection(messageEl) {
    if (messageEl) messageEl.textContent = 'Requesting Bluetooth device...';
    
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: [0x180D] }, // Heart Rate service
        { namePrefix: 'Garmin' },
        { namePrefix: 'GARMIN' }
      ],
      optionalServices: [0x180D]
    });

    if (messageEl) messageEl.textContent = 'Connecting to device...';
    const server = await device.gatt.connect();
    
    if (messageEl) messageEl.textContent = 'Getting heart rate service...';
    const service = await server.getPrimaryService(0x180D);
    const characteristic = await service.getCharacteristic(0x2A37);

    // Add player to system
    const player = {
      id: this.players.length + 1,
      name: this.currentPlayerSetup.name,
      device: device,
      characteristic: characteristic,
      heartRate: 0,
      status: 'resting',
      trend: 'stable',
      connected: true,
      position: this.getNextAvailablePosition(),
      lastHeartRate: 0,
      heartRateHistory: []
    };

    this.addPlayerToSystem(player);
    await this.setupHeartRateMonitoring(player);
    this.showPlayerAddedSuccess(player);
    
    this.showAlert(`${player.name} connected successfully!`, 'success');
  }

  addPlayerToSystem(player) {
    this.players.push(player);
    this.heartRateHistory[player.id] = [];
    this.renderPlayer(player);
    this.updatePlayerCount();
    
    // Enable start monitoring if we have players
    const startBtn = document.getElementById('start-monitoring');
    if (startBtn) {
      startBtn.disabled = false;
    }
  }

  showPlayerAddedSuccess(player) {
    const successPlayerName = document.getElementById('success-player-name');
    const successPosition = document.getElementById('success-position');
    const successHR = document.getElementById('success-hr');
    
    if (successPlayerName) successPlayerName.textContent = player.name;
    if (successPosition) successPosition.textContent = player.position;
    if (successHR) successHR.textContent = player.heartRate || '--';
    
    this.hideAllSetupSteps();
    const successStep = document.getElementById('player-setup-success');
    if (successStep) {
      successStep.classList.add('active');
    }
  }

  // Setup mock heart rate monitoring for demo
  setupMockHeartRateMonitoring(player) {
    // Simulate heart rate updates every 2 seconds
    const updateInterval = setInterval(() => {
      if (!player.connected || !this.players.includes(player)) {
        clearInterval(updateInterval);
        return;
      }
      
      // Generate realistic heart rate variation
      const baseRate = 75;
      const variation = Math.random() * 20 - 10; // ±10 BPM
      const newRate = Math.max(50, Math.min(120, Math.floor(baseRate + variation)));
      
      this.updatePlayerHeartRate(player, newRate);
    }, 2000);
    
    player.mockInterval = updateInterval;
  }

  // Setup heart rate monitoring for a player
  async setupHeartRateMonitoring(player) {
    try {
      await player.characteristic.startNotifications();
      player.characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const heartRate = this.parseHeartRateData(event.target.value);
        this.updatePlayerHeartRate(player, heartRate);
      });

      // Handle disconnection
      player.device.addEventListener('gattserverdisconnected', () => {
        player.connected = false;
        this.updatePlayerConnectionStatus(player);
        this.showAlert(`${player.name} disconnected`, 'warning');
      });

    } catch (error) {
      console.error('Failed to setup monitoring:', error);
      throw error;
    }
  }

  // Parse heart rate data from Bluetooth
  parseHeartRateData(value) {
    const flags = value.getUint8(0);
    const is16Bit = flags & 0x1;
    
    if (is16Bit) {
      return value.getUint16(1, true); // little endian
    } else {
      return value.getUint8(1);
    }
  }

  // Update player heart rate
  updatePlayerHeartRate(player, heartRate) {
    if (heartRate < 40 || heartRate > 220) return; // Invalid reading
    
    const previousRate = player.heartRate;
    player.heartRate = heartRate;
    player.status = this.getHeartRateStatus(heartRate);
    player.trend = this.calculateTrend(player, heartRate);
    
    // Store in history
    const now = Date.now();
    player.heartRateHistory.push({ time: now, rate: heartRate });
    this.heartRateHistory[player.id].push({ time: now, rate: heartRate });
    
    // Keep only last 50 readings
    if (player.heartRateHistory.length > 50) {
      player.heartRateHistory.shift();
      this.heartRateHistory[player.id].shift();
    }
    
    // Check for spikes
    if (this.isMonitoring && this.detectSpike(previousRate, heartRate)) {
      this.handleHeartRateSpike(player, heartRate);
    }
    
    // Update UI
    this.updatePlayerDisplay(player);
    this.updateSessionStats();
    
    // Update success modal if showing
    const successHR = document.getElementById('success-hr');
    if (successHR && document.getElementById('player-setup-success')?.classList.contains('active')) {
      successHR.textContent = heartRate;
    }
  }

  // Heart rate analysis functions
  getHeartRateStatus(heartRate) {
    if (heartRate >= HEART_RATE_THRESHOLDS.very_high.min) return 'very-high';
    if (heartRate >= HEART_RATE_THRESHOLDS.high.min) return 'high';
    if (heartRate >= HEART_RATE_THRESHOLDS.elevated.min) return 'elevated';
    return 'resting';
  }

  calculateTrend(player, currentRate) {
    if (player.heartRateHistory.length < 3) return 'stable';
    
    const recent = player.heartRateHistory.slice(-3).map(h => h.rate);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    
    if (currentRate > avg + 5) return 'rising';
    if (currentRate < avg - 5) return 'falling';
    return 'stable';
  }

  detectSpike(previousRate, currentRate) {
    if (previousRate === 0) return false;
    const increase = currentRate - previousRate;
    return increase >= 15; // 15+ BPM increase is considered a spike
  }

  handleHeartRateSpike(player, heartRate) {
    this.spikeCount++;
    
    // Visual feedback
    const playerSlot = document.getElementById(`player-${player.position}`);
    if (playerSlot) {
      playerSlot.classList.add('spike');
      setTimeout(() => playerSlot.classList.remove('spike'), 500);
    }
    
    // Alert
    this.showAlert(`${player.name}: Heart rate spike detected! (${heartRate} BPM)`, 'spike');
    
    this.updateSessionStats();
  }

  // Player management
  getNextAvailablePosition() {
    const occupiedPositions = this.players.map(p => p.position);
    for (let i = 1; i <= 8; i++) {
      if (!occupiedPositions.includes(i)) {
        return i;
      }
    }
    return null;
  }

  renderPlayer(player) {
    const playerSlot = document.getElementById(`player-${player.position}`);
    if (!playerSlot) return;
    
    playerSlot.className = 'player-slot connected';
    playerSlot.innerHTML = `
      <div class="player-info">
        <div class="player-name">${player.name}</div>
        <div class="player-hr">
          <span class="hr-value">${player.heartRate || '--'}</span>
          <span class="hr-trend">${this.getTrendSymbol(player.trend)}</span>
          <div class="hr-status ${player.status}"></div>
        </div>
        <div class="connection-status connected">Connected</div>
      </div>
    `;
  }

  updatePlayerDisplay(player) {
    const playerSlot = document.getElementById(`player-${player.position}`);
    if (!playerSlot) return;
    
    const hrValue = playerSlot.querySelector('.hr-value');
    const hrTrend = playerSlot.querySelector('.hr-trend');
    const hrStatus = playerSlot.querySelector('.hr-status');
    const connectionStatus = playerSlot.querySelector('.connection-status');
    
    if (hrValue) hrValue.textContent = player.heartRate || '--';
    if (hrTrend) hrTrend.textContent = this.getTrendSymbol(player.trend);
    if (hrStatus) hrStatus.className = `hr-status ${player.status}`;
    if (connectionStatus) {
      connectionStatus.textContent = player.connected ? 'Connected' : 'Disconnected';
      connectionStatus.className = `connection-status ${player.connected ? 'connected' : 'disconnected'}`;
    }
    
    // Add active class if monitoring
    if (this.isMonitoring) {
      playerSlot.classList.add('active');
    } else {
      playerSlot.classList.remove('active');
    }
  }

  getTrendSymbol(trend) {
    switch (trend) {
      case 'rising': return '↗';
      case 'falling': return '↘';
      case 'stable': return '→';
      default: return '→';
    }
  }

  updatePlayerConnectionStatus(player) {
    this.updatePlayerDisplay(player);
  }

  updatePlayerCount() {
    const count = this.players.length;
    const playersCountEl = document.getElementById('players-count');
    const activePlayersEl = document.getElementById('active-players');
    
    if (playersCountEl) {
      playersCountEl.textContent = `${count} player${count !== 1 ? 's' : ''} connected`;
    }
    if (activePlayersEl) {
      activePlayersEl.textContent = count;
    }
  }

  // Session management
  startSession() {
    if (this.players.length === 0) {
      this.showAlert('Add at least one player to start monitoring', 'error');
      return;
    }

    this.isMonitoring = true;
    this.sessionStartTime = Date.now();
    this.spikeCount = 0;
    
    // Update UI
    const sessionStatus = document.getElementById('session-status');
    const startBtn = document.getElementById('start-monitoring');
    const stopBtn = document.getElementById('stop-monitoring');
    const addPlayerBtn = document.getElementById('add-player-btn');
    
    if (sessionStatus) sessionStatus.textContent = 'Monitoring Active';
    if (startBtn) startBtn.classList.add('hidden');
    if (stopBtn) stopBtn.classList.remove('hidden');
    if (addPlayerBtn) addPlayerBtn.disabled = true;
    
    // Start session timer
    this.sessionInterval = setInterval(() => {
      this.updateSessionTimer();
    }, 1000);
    
    // Activate all player displays
    this.players.forEach(player => {
      this.updatePlayerDisplay(player);
    });
    
    this.showAlert('Heart rate monitoring session started!', 'success');
  }

  stopSession() {
    this.isMonitoring = false;
    
    // Update UI
    const sessionStatus = document.getElementById('session-status');
    const startBtn = document.getElementById('start-monitoring');
    const stopBtn = document.getElementById('stop-monitoring');
    const addPlayerBtn = document.getElementById('add-player-btn');
    
    if (sessionStatus) sessionStatus.textContent = 'Session Stopped';
    if (startBtn) startBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    if (addPlayerBtn) addPlayerBtn.disabled = false;
    
    // Stop session timer
    if (this.sessionInterval) {
      clearInterval(this.sessionInterval);
      this.sessionInterval = null;
    }
    
    // Deactivate player displays
    this.players.forEach(player => {
      this.updatePlayerDisplay(player);
    });
    
    this.showAlert('Heart rate monitoring session stopped', 'warning');
  }

  resetSession() {
    this.stopSession();
    
    // Clear all players
    this.players.forEach(player => {
      if (player.mockInterval) {
        clearInterval(player.mockInterval);
      }
      if (player.device && player.device.gatt && player.device.gatt.connected) {
        player.device.gatt.disconnect();
      }
    });
    
    this.players = [];
    this.heartRateHistory = {};
    this.spikeCount = 0;
    this.sessionStartTime = null;
    
    // Reset UI
    this.renderPlayerPositions();
    this.updatePlayerCount();
    
    const sessionStatus = document.getElementById('session-status');
    const sessionTime = document.getElementById('session-time');
    const startBtn = document.getElementById('start-monitoring');
    const avgHR = document.getElementById('avg-hr');
    const spikesCount = document.getElementById('spikes-count');
    
    if (sessionStatus) sessionStatus.textContent = 'Ready to Start';
    if (sessionTime) sessionTime.textContent = '00:00';
    if (startBtn) startBtn.disabled = true;
    if (avgHR) avgHR.textContent = '--';
    if (spikesCount) spikesCount.textContent = '0';
    
    this.showAlert('Session reset complete', 'success');
  }

  updateSessionTimer() {
    if (!this.sessionStartTime) return;
    
    const elapsed = Date.now() - this.sessionStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const sessionTime = document.getElementById('session-time');
    if (sessionTime) {
      sessionTime.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  updateSessionStats() {
    // Calculate average heart rate
    const activeRates = this.players
      .filter(p => p.connected && p.heartRate > 0)
      .map(p => p.heartRate);
    
    const avgHR = document.getElementById('avg-hr');
    if (activeRates.length > 0 && avgHR) {
      const avgValue = Math.round(activeRates.reduce((a, b) => a + b, 0) / activeRates.length);
      avgHR.textContent = avgValue;
    }
    
    // Update spikes count
    const spikesCount = document.getElementById('spikes-count');
    if (spikesCount) {
      spikesCount.textContent = this.spikeCount;
    }
  }

  cancelConnection() {
    this.showDeviceSetup();
  }

  // Alert system
  showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.textContent = message;
    
    alertsContainer.appendChild(alert);
    
    // Auto-remove after 5 seconds (or 3 for spikes)
    const timeout = type === 'spike' ? 3000 : 5000;
    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, timeout);
  }
}

// Initialize application
console.log('Poker HR App script loaded');
window.pokerApp = new PokerHRApp();

// Handle page visibility change to manage connections
document.addEventListener('visibilitychange', () => {
  if (document.hidden && window.pokerApp) {
    // Page is hidden, could pause monitoring if needed
  } else if (window.pokerApp) {
    // Page is visible again, could resume monitoring if needed
  }
});

// Handle beforeunload to clean up connections
window.addEventListener('beforeunload', () => {
  if (window.pokerApp && window.pokerApp.players) {
    window.pokerApp.players.forEach(player => {
      if (player.mockInterval) {
        clearInterval(player.mockInterval);
      }
      if (player.device && player.device.gatt && player.device.gatt.connected) {
        player.device.gatt.disconnect();
      }
    });
  }
});