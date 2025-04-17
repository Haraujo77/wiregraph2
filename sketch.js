// Configuration
let config = {
    // Cards tab settings
    numCards: 100,
    wheelRadius: 40,
    cardWidth: 20,
    cardHeight: 30,
    cardThickness: 0.01,
    stackSpacing: 1,
    animationDuration: 2,
    animationMode: 'none',
    cardColor: '#000000',
    strokeWeight: 1.0,
    strokeColor: '#FFFFFF',
    
    // Blocks tab settings
    activeTab: 'cards', // 'cards' or 'blocks'
    groupSpacing: 3,
    blockCardWidth: 20,
    blockCardHeight: 30,
    blockStackSpacing: 1,
    blockCardColor: '#000000',
    blockStrokeWeight: 1.0,
    blockStrokeColor: '#FFFFFF',
    
    // View settings (shared by both tabs)
    isometricView: false,
    isoRotationX: -35.264,
    isoRotationY: -45,
    // Camera settings
    cameraZoom: 1.0,
    cameraRotationX: 0,
    cameraRotationY: 0,
    cameraRotationZ: 0,
    enableOrbitControl: true,
    // Final camera settings (for transitions)
    enableCameraTransition: false,
    finalCameraZoom: 1.0,
    finalCameraRotationX: 45,
    finalCameraRotationY: 0,
    finalCameraRotationZ: 0,
    // Auto-rotation settings
    autoRotateX: false,
    autoRotateY: false,
    autoRotateZ: false,
    rotationSpeedX: 0.5,
    rotationSpeedY: 0.5,
    rotationSpeedZ: 0.5
};

// Cards array and states
let cards = [];
let originalHeights = [];
let originalYPositions = [];
let targetPositions = [];
let isRandomized = false;
let isAnimating = false;
let animationStartTime = 0;
let isReversed = false; // Track if we're in reverse animation
let inAnimatedState = false; // Track if cards are in animated state

// Block mode data structures
let cardGroups = [];

// Camera transition state
let initialCameraState = {};
let originalFinalCameraState = {}; // Store original final camera settings

// Canvas sizing
let canvasWidth;
let canvasHeight;
let canvas;

// View scaling
let viewScale = 5;

// SVG elements for export
let svgBuffer;
let svgString = "";

// Flag to prevent recursive updates
let isUpdating = false;

// Mouse interaction for custom orbit control
let mouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let isDragging = false;