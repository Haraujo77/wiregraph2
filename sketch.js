// Configuration
let config = {
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

function setup() {
    // Set canvas size based on window dimensions
    updateCanvasSize();
    
    // Create canvas and place it in the container
    canvas = createCanvas(canvasWidth, canvasHeight, WEBGL);
    canvas.parent('canvas-container');
    
    // Disable right-click context menu on canvas
    canvas.elt.oncontextmenu = () => false;
    
    // Initialize event listeners
    initEventListeners();
    
    // Create initial cards
    initCards();
    
    // Handle window resizing
    window.addEventListener('resize', windowResized);
    
    // Setup mouse event listeners for custom orbit control
    setupOrbitControlListeners();
}

function setupOrbitControlListeners() {
    // Mouse down event on canvas
    canvas.mousePressed(canvasMousePressed);
    
    // Mouse move event (anywhere)
    document.addEventListener('mousemove', documentMouseMoved);
    
    // Mouse up event (anywhere)
    document.addEventListener('mouseup', documentMouseReleased);
    
    // Mouse wheel event for zoom
    canvas.mouseWheel(canvasMouseWheel);
}

function canvasMousePressed() {
    // Only register left mouse button
    if (mouseButton === LEFT) {
        mouseDown = true;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        isDragging = false;
    }
}

function documentMouseMoved(e) {
    if (!mouseDown || config.isometricView) return;
    
    // Detect if we're actually dragging (not just a click)
    if (Math.abs(mouseX - lastMouseX) > 2 || Math.abs(mouseY - lastMouseY) > 2) {
        isDragging = true;
    }
    
    if (isDragging) {
        // Calculate drag distance
        const deltaX = mouseX - lastMouseX;
        const deltaY = mouseY - lastMouseY;
        
        // Update camera rotation based on drag
        // Horizontal drag affects Y rotation
        config.cameraRotationY += deltaX * 0.5;
        
        // Vertical drag affects X rotation
        config.cameraRotationX += deltaY * 0.5;
        
        // Normalize angles to -180 to 180 range
        config.cameraRotationY = normalizeDegrees(config.cameraRotationY);
        config.cameraRotationX = normalizeDegrees(config.cameraRotationX);
        
        // Update the input fields without causing a recursive update
        updateRotationInputFields();
        
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

function documentMouseReleased() {
    mouseDown = false;
    isDragging = false;
}

function canvasMouseWheel(event) {
    if (config.isometricView) return;
    
    // Adjust camera zoom with mouse wheel
    config.cameraZoom -= event.delta * 0.001;
    
    // Limit zoom values
    config.cameraZoom = constrain(config.cameraZoom, 0.1, 5);
    
    // Update zoom input field
    updateZoomInputField();
    
    // Prevent default behavior (page scrolling)
    return false;
}

function normalizeDegrees(angle) {
    // Keep angle between -180 and 180
    angle = angle % 360;
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;
    return angle;
}

function updateRotationInputFields() {
    // Prevent recursive updates
    if (isUpdating) return;
    isUpdating = true;
    
    // Update input fields with current rotation values
    const xRotInput = document.getElementById('cameraRotationX');
    const yRotInput = document.getElementById('cameraRotationY');
    const zRotInput = document.getElementById('cameraRotationZ');
    
    // Update range sliders
    xRotInput.value = Math.round(config.cameraRotationX);
    yRotInput.value = Math.round(config.cameraRotationY);
    zRotInput.value = Math.round(config.cameraRotationZ);
    
    // Update number inputs
    document.getElementById('cameraRotationXInput').value = Math.round(config.cameraRotationX);
    document.getElementById('cameraRotationYInput').value = Math.round(config.cameraRotationY);
    document.getElementById('cameraRotationZInput').value = Math.round(config.cameraRotationZ);
    
    isUpdating = false;
}

function updateZoomInputField() {
    // Prevent recursive updates
    if (isUpdating) return;
    isUpdating = true;
    
    // Update zoom input field
    const zoomInput = document.getElementById('cameraZoom');
    zoomInput.value = config.cameraZoom.toFixed(2);
    
    // Update number input
    document.getElementById('cameraZoomInput').value = config.cameraZoom.toFixed(2);
    
    isUpdating = false;
}

function windowResized() {
    updateCanvasSize();
    resizeCanvas(canvasWidth, canvasHeight);
}

function updateCanvasSize() {
    const container = document.getElementById('canvas-container');
    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;
}

function updateViewScale() {
    // Dynamically calculate the view scale based on the number of cards and spacing
    // This ensures the entire stack is visible at any spacing value
    const stackLength = config.numCards * config.stackSpacing;
    const baseScale = 5; // Default scale for spacing = 1
    
    // Scale inversely with spacing but with a reasonable limit
    // Higher spacing values need smaller scale values
    viewScale = baseScale * (1 / sqrt(config.stackSpacing));
    
    // Adjust further if we have a lot of cards
    if (config.numCards > 100) {
        viewScale *= 100 / config.numCards;
    }
    
    // Apply user zoom factor
    viewScale *= config.cameraZoom;
    
    // Ensure scale stays within reasonable bounds
    viewScale = constrain(viewScale, 0.5, 20);
}

function draw() {
    background(0);
    
    // Update the view scale dynamically based on current config
    updateViewScale();
    
    // Update camera rotations if auto-rotate is enabled
    updateAutoRotation();
    
    // Decide camera type based on isometric mode
    if (config.isometricView) {
        // Fixed isometric view
        // Reset camera perspective
        ortho(-width/2, width/2, -height/2, height/2, -2000, 2000);
        
        // Set isometric angle based on user inputs
        rotateX(radians(config.isoRotationX));
        rotateY(radians(config.isoRotationY));
    } else {
        // Default perspective with controls
        perspective();
        
        // Apply user-defined camera rotation
        rotateX(radians(config.cameraRotationX));
        rotateY(radians(config.cameraRotationY));
        rotateZ(radians(config.cameraRotationZ));
        
        // We're now using our custom orbit control instead of built-in
        // if (config.enableOrbitControl) {
        //     orbitControl();
        // }
    }
    
    // Lighting
    ambientLight(60, 60, 60);
    directionalLight(255, 255, 255, 0.5, 0.5, -1);
    
    // Display cards
    push();
    translate(0, 0, 0);
    scale(viewScale); // Scale using the dynamically calculated value
    
    // Handle animation if active
    if (isAnimating) {
        updateCardAnimation();
    }
    
    drawCards();
    pop();
}

function initCards() {
    cards = [];
    originalHeights = [];
    originalYPositions = [];
    targetPositions = [];
    
    const totalSpacing = (config.stackSpacing + config.cardThickness) * config.numCards;
    const startZ = -totalSpacing / 2;
    
    for (let i = 0; i < config.numCards; i++) {
        // Initial card position (stack)
        const initialPos = {
            x: 0,
            y: 0,
            z: startZ + i * (config.stackSpacing + config.cardThickness),
            width: config.cardWidth,
            height: config.cardHeight,
            thickness: config.cardThickness,
            rotX: 0,
            rotY: 0,
            rotZ: 0
        };
        
        cards.push(initialPos);
        
        // Also create a duplicate for animation target
        targetPositions.push({...initialPos});
        
        originalHeights.push(config.cardHeight);
        originalYPositions.push(0); // Store original Y positions
    }
}

function drawCards() {
    // Parse the card color
    const cardCol = color(config.cardColor);
    const strokeCol = color(config.strokeColor);
    
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        
        push();
        translate(card.x, card.y, card.z);
        rotateX(card.rotX);
        rotateY(card.rotY);
        rotateZ(card.rotZ);
        
        // Card material and color
        specularMaterial(cardCol);
        shininess(20);
        
        // Draw card edges with custom stroke
        if (config.strokeWeight > 0) {
            stroke(
                red(strokeCol),
                green(strokeCol),
                blue(strokeCol),
                alpha(strokeCol)
            );
            strokeWeight(config.strokeWeight);
        } else {
            noStroke();
        }
        
        // Draw card as box
        box(card.width, card.height, card.thickness);
        
        pop();
    }
}

function calculateTargetPositions(mode) {
    // Reset target positions to initial stack
    targetPositions = cards.map(card => ({...card}));
    
    const numCards = config.numCards;
    
    switch (mode) {
        case 'wheel':
            // Create a wheel of cards in the XZ plane using the Three.js approach
            for (let i = 0; i < numCards; i++) {
                // Calculate angle using the Three.js formula:
                // ((i + 0.5) / N) * 2PI - PI/2
                // This distributes cards evenly with a 0.5 offset and starts at the top
                const angle = ((i + 0.5) / numCards) * TWO_PI - HALF_PI;
                const radius = config.wheelRadius * 1.2; // Slightly larger radius for better visibility
                
                // Position in XZ plane (horizontal circle)
                targetPositions[i].x = cos(angle) * radius;
                targetPositions[i].z = sin(angle) * radius;
                
                // Y position (adjusted by height if randomized)
                if (isRandomized) {
                    const yOffset = (originalHeights[i] - cards[i].height) / 2;
                    targetPositions[i].y = yOffset;
                } else {
                    targetPositions[i].y = 0;
                }
                
                // Make cards face outward from center (critical difference)
                // In Three.js this is achieved by rotating -angle around Y axis
                targetPositions[i].rotX = 0; // No X rotation needed
                targetPositions[i].rotY = -angle + PI; // Negative angle + PI to face outward
                targetPositions[i].rotZ = 0; // No Z rotation
            }
            break;
            
        case 'fan':
            // Calculate fan arrangement
            const fanAngle = PI * 0.8; // 144 degrees total fan spread
            const fanRadius = config.wheelRadius * 1.2;
            
            for (let i = 0; i < numCards; i++) {
                const angle = map(i, 0, numCards-1, -fanAngle/2, fanAngle/2);
                
                targetPositions[i].x = fanRadius * sin(angle);
                // Adjust y position to maintain bottom alignment if heights are randomized
                if (isRandomized) {
                    const yOffset = (originalHeights[i] - cards[i].height) / 2;
                    targetPositions[i].y = yOffset;
                } else {
                    targetPositions[i].y = 0;
                }
                targetPositions[i].z = -fanRadius * cos(angle);
                
                // Rotate cards to face outward in fan
                targetPositions[i].rotY = angle;
            }
            break;
            
        case 'wave':
            // Calculate wave arrangement
            const waveLength = config.numCards * 0.5;
            const waveAmplitude = config.wheelRadius * 0.6;
            
            for (let i = 0; i < numCards; i++) {
                const xPos = map(i, 0, numCards-1, -config.wheelRadius, config.wheelRadius);
                const wavePos = (i / waveLength) * TWO_PI;
                
                targetPositions[i].x = xPos;
                // For wave, keep the wave pattern but adjust for height differences
                if (isRandomized) {
                    const yOffset = (originalHeights[i] - cards[i].height) / 2;
                    targetPositions[i].y = sin(wavePos) * waveAmplitude + yOffset;
                } else {
                    targetPositions[i].y = sin(wavePos) * waveAmplitude;
                }
                targetPositions[i].z = cos(wavePos) * waveAmplitude;
                
                // Rotate cards to follow wave
                targetPositions[i].rotX = sin(wavePos) * 0.5;
                targetPositions[i].rotZ = cos(wavePos) * 0.3;
            }
            break;
            
        case 'randomHeights':
            // Animation to randomized heights while keeping current arrangement
            // Store original heights if not already stored
            if (originalHeights.length !== cards.length) {
                originalHeights = cards.map(card => card.height);
                originalYPositions = cards.map(card => card.y);
            }
            
            // Generate market-like data (overall ascending with fluctuations)
            let baseHeight = config.cardHeight * 0.5; // Start at 50% of original height
            let trend = 0.5; // Overall ascending trend
            
            for (let i = 0; i < cards.length; i++) {
                // Keep the original x, z, and rotation values
                targetPositions[i].x = cards[i].x;
                targetPositions[i].z = cards[i].z;
                targetPositions[i].rotX = cards[i].rotX;
                targetPositions[i].rotY = cards[i].rotY;
                targetPositions[i].rotZ = cards[i].rotZ;
                
                // Add random fluctuation with overall ascending trend
                const randomFactor = random(-0.15, 0.2); // More upside than downside
                const normalizedPosition = i / (cards.length - 1); // 0 to 1
                
                // Calculate new height with upward trend and random fluctuations
                let newHeight = baseHeight * (1 + trend * normalizedPosition + randomFactor);
                
                // Ensure height doesn't go below minimum
                newHeight = max(newHeight, config.cardHeight * 0.2);
                
                // Calculate the y-position adjustment to align bottoms
                // Since boxes are centered, we need to shift up by half the height difference
                const heightDifference = originalHeights[i] - newHeight;
                const yOffset = heightDifference / 2;
                
                // Update target height and position to align at bottom
                targetPositions[i].height = newHeight;
                targetPositions[i].y = originalYPositions[i] + yOffset;
                
                // Small probability of a market correction (drop)
                if (random() < 0.05 && i > 0) {
                    baseHeight *= random(0.85, 0.95); // 5-15% correction
                } else {
                    // Small incremental growth for base
                    baseHeight *= random(1.0, 1.02);
                }
            }
            break;
            
        default:
            // 'none' or any other case - no change, keep stack
            if (isRandomized) {
                for (let i = 0; i < numCards; i++) {
                    // Adjust y position to align bottoms in stack mode too
                    const yOffset = (originalHeights[i] - cards[i].height) / 2;
                    targetPositions[i].y = yOffset; 
                }
            }
            break;
    }
}

function startAnimation() {
    // If we're already in animated state, toggle reverse animation
    if (inAnimatedState) {
        startReverseAnimation();
        return;
    }
    
    // Get animation mode
    config.animationMode = document.getElementById('animationMode').value;
    
    // Calculate target positions based on selected mode
    calculateTargetPositions(config.animationMode);
    
    // Store initial camera state if we're using camera transitions
    if (config.enableCameraTransition) {
        storeInitialCameraState();
        
        // Also store the original final camera settings
        storeFinalCameraState();
    }
    
    if (config.animationMode === 'randomHeights') {
        // Set flag that we are now using randomized heights
        isRandomized = true;
    }
    
    // Start animation
    isAnimating = true;
    isReversed = false; // We're going forward
    inAnimatedState = true; // Mark as in animated state
    animationStartTime = millis();
    
    // Update button text
    document.getElementById('animateBtn').textContent = 'Reverse';
}

function storeInitialCameraState() {
    // Store the current camera settings as the initial state
    initialCameraState = {
        zoom: config.cameraZoom,
        rotationX: config.cameraRotationX,
        rotationY: config.cameraRotationY,
        rotationZ: config.cameraRotationZ
    };
}

function storeFinalCameraState() {
    // Store the final camera settings
    originalFinalCameraState = {
        zoom: config.finalCameraZoom,
        rotationX: config.finalCameraRotationX,
        rotationY: config.finalCameraRotationY,
        rotationZ: config.finalCameraRotationZ
    };
}

function startReverseAnimation() {
    // Create initial stack positions for the target
    targetPositions = [];
    const totalSpacing = (config.stackSpacing + config.cardThickness) * config.numCards;
    const startZ = -totalSpacing / 2;
    
    for (let i = 0; i < config.numCards; i++) {
        // Initial card position (stack)
        const initialPos = {
            x: 0,
            y: 0,
            z: startZ + i * (config.stackSpacing + config.cardThickness),
            width: config.cardWidth,
            height: config.cardHeight,
            thickness: config.cardThickness,
            rotX: 0,
            rotY: 0,
            rotZ: 0
        };
        
        // Adjust Y position if heights are randomized
        if (isRandomized && originalHeights.length === config.numCards) {
            initialPos.height = originalHeights[i];
            initialPos.y = originalYPositions[i];
        }
        
        targetPositions.push(initialPos);
    }
    
    // If we're using camera transitions, swap the final and initial values for reverse
    if (config.enableCameraTransition) {
        // Store current values as target for reverse animation
        const currentState = {
            zoom: config.cameraZoom,
            rotationX: config.cameraRotationX,
            rotationY: config.cameraRotationY,
            rotationZ: config.cameraRotationZ
        };
        
        // Set current camera to match final values
        config.cameraZoom = config.finalCameraZoom;
        config.cameraRotationX = config.finalCameraRotationX;
        config.cameraRotationY = config.finalCameraRotationY;
        config.cameraRotationZ = config.finalCameraRotationZ;
        
        // Set reverse target to be the initial camera values
        // But DON'T modify the stored final camera values
        const reverseFinalValues = {
            zoom: initialCameraState.zoom,
            rotationX: initialCameraState.rotationX,
            rotationY: initialCameraState.rotationY,
            rotationZ: initialCameraState.rotationZ
        };
        
        // Update the initial state reference for the reverse animation
        initialCameraState = currentState;
        
        // Set temporary final values for the reverse animation
        config.finalCameraZoom = reverseFinalValues.zoom;
        config.finalCameraRotationX = reverseFinalValues.rotationX;
        config.finalCameraRotationY = reverseFinalValues.rotationY;
        config.finalCameraRotationZ = reverseFinalValues.rotationZ;
        
        // Update UI to reflect the current state
        updateCameraInputFields();
    }
    
    // Start reverse animation
    isAnimating = true;
    isReversed = true; // We're going backward
    animationStartTime = millis();
    
    // Update button text
    document.getElementById('animateBtn').textContent = 'Animate';
}

function updateCameraInputFields() {
    // Update input values
    document.getElementById('cameraZoom').value = config.cameraZoom;
    document.getElementById('cameraRotationX').value = config.cameraRotationX;
    document.getElementById('cameraRotationY').value = config.cameraRotationY;
    document.getElementById('cameraRotationZ').value = config.cameraRotationZ;
    
    document.getElementById('cameraZoomInput').value = config.cameraZoom.toFixed(2);
    document.getElementById('cameraRotationXInput').value = Math.round(config.cameraRotationX);
    document.getElementById('cameraRotationYInput').value = Math.round(config.cameraRotationY);
    document.getElementById('cameraRotationZInput').value = Math.round(config.cameraRotationZ);
    
    document.getElementById('finalCameraZoom').value = config.finalCameraZoom;
    document.getElementById('finalCameraRotationX').value = config.finalCameraRotationX;
    document.getElementById('finalCameraRotationY').value = config.finalCameraRotationY;
    document.getElementById('finalCameraRotationZ').value = config.finalCameraRotationZ;
    
    document.getElementById('finalCameraZoomInput').value = config.finalCameraZoom.toFixed(2);
    document.getElementById('finalCameraRotationXInput').value = Math.round(config.finalCameraRotationX);
    document.getElementById('finalCameraRotationYInput').value = Math.round(config.finalCameraRotationY);
    document.getElementById('finalCameraRotationZInput').value = Math.round(config.finalCameraRotationZ);
}

function updateCardAnimation() {
    const currentTime = millis();
    const elapsedTime = (currentTime - animationStartTime) / 1000; // in seconds
    
    // Calculate progress (0 to 1)
    const progress = constrain(elapsedTime / config.animationDuration, 0, 1);
    
    // Smooth easing function (cubic easing)
    const easedProgress = progress < 0.5 ? 
                          4 * progress * progress * progress : 
                          1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    // Update all cards based on progress
    for (let i = 0; i < cards.length; i++) {
        // Interpolate between current position and target position
        cards[i].x = lerp(cards[i].x, targetPositions[i].x, 0.05);
        cards[i].y = lerp(cards[i].y, targetPositions[i].y, 0.05);
        cards[i].z = lerp(cards[i].z, targetPositions[i].z, 0.05);
        cards[i].rotX = lerp(cards[i].rotX, targetPositions[i].rotX, 0.05);
        cards[i].rotY = lerp(cards[i].rotY, targetPositions[i].rotY, 0.05);
        cards[i].rotZ = lerp(cards[i].rotZ, targetPositions[i].rotZ, 0.05);
        
        // For randomHeights mode, also animate the height property
        if (config.animationMode === 'randomHeights' || 
            (isReversed && isRandomized)) {
            cards[i].height = lerp(cards[i].height, targetPositions[i].height, 0.05);
        }
    }
    
    // Update camera if transitions are enabled
    if (config.enableCameraTransition) {
        updateCameraAnimation(easedProgress);
    }
    
    // End animation if complete
    if (progress >= 1) {
        isAnimating = false;
        
        // If we just finished a reverse animation, reset the animated state flag
        if (isReversed) {
            inAnimatedState = false;
            isReversed = false;
            
            // If we reversed from randomized heights, also reset that flag
            if (isRandomized) {
                isRandomized = false;
            }
            
            // Restore original final camera settings if we were using camera transitions
            if (config.enableCameraTransition && originalFinalCameraState) {
                config.finalCameraZoom = originalFinalCameraState.zoom;
                config.finalCameraRotationX = originalFinalCameraState.rotationX;
                config.finalCameraRotationY = originalFinalCameraState.rotationY;
                config.finalCameraRotationZ = originalFinalCameraState.rotationZ;
                
                // Update UI to show original final values
                document.getElementById('finalCameraZoom').value = config.finalCameraZoom;
                document.getElementById('finalCameraRotationX').value = config.finalCameraRotationX;
                document.getElementById('finalCameraRotationY').value = config.finalCameraRotationY;
                document.getElementById('finalCameraRotationZ').value = config.finalCameraRotationZ;
                
                document.getElementById('finalCameraZoomInput').value = config.finalCameraZoom.toFixed(2);
                document.getElementById('finalCameraRotationXInput').value = Math.round(config.finalCameraRotationX);
                document.getElementById('finalCameraRotationYInput').value = Math.round(config.finalCameraRotationY);
                document.getElementById('finalCameraRotationZInput').value = Math.round(config.finalCameraRotationZ);
            }
        }
    }
}

function updateCameraAnimation(progress) {
    if (!config.enableCameraTransition) return;
    
    // Interpolate camera settings between initial and final values
    config.cameraZoom = lerp(initialCameraState.zoom, config.finalCameraZoom, progress);
    config.cameraRotationX = lerpAngle(initialCameraState.rotationX, config.finalCameraRotationX, progress);
    config.cameraRotationY = lerpAngle(initialCameraState.rotationY, config.finalCameraRotationY, progress);
    config.cameraRotationZ = lerpAngle(initialCameraState.rotationZ, config.finalCameraRotationZ, progress);
    
    // Update UI to reflect current values
    updateRotationInputFields();
    updateZoomInputField();
}

// Helper function to interpolate angles correctly
function lerpAngle(start, end, amount) {
    // Normalize angles to (-180, 180) range
    start = normalizeDegrees(start);
    end = normalizeDegrees(end);
    
    // Find the shortest path between angles
    let diff = end - start;
    
    // Adjust for shortest path
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    // Interpolate along the shortest path
    return start + diff * amount;
}

function randomizeHeights() {
    isRandomized = true;
    
    // Store original heights if not already stored
    if (originalHeights.length !== cards.length) {
        originalHeights = cards.map(card => card.height);
        originalYPositions = cards.map(card => card.y);
    }
    
    // Generate market-like data (overall ascending with fluctuations)
    let baseHeight = config.cardHeight * 0.5; // Start at 50% of original height
    let trend = 0.5; // Overall ascending trend
    
    for (let i = 0; i < cards.length; i++) {
        // Add random fluctuation with overall ascending trend
        const randomFactor = random(-0.15, 0.2); // More upside than downside
        const normalizedPosition = i / (cards.length - 1); // 0 to 1
        
        // Calculate new height with upward trend and random fluctuations
        let newHeight = baseHeight * (1 + trend * normalizedPosition + randomFactor);
        
        // Ensure height doesn't go below minimum
        newHeight = max(newHeight, config.cardHeight * 0.2);
        
        // Calculate the y-position adjustment to align bottoms
        // Since boxes are centered, we need to shift up by half the height difference
        const heightDifference = originalHeights[i] - newHeight;
        const yOffset = heightDifference / 2;
        
        // Update card height and position to align at bottom
        cards[i].height = newHeight;
        cards[i].y = originalYPositions[i] + yOffset;
        
        // Small probability of a market correction (drop)
        if (random() < 0.05 && i > 0) {
            baseHeight *= random(0.85, 0.95); // 5-15% correction
        } else {
            // Small incremental growth for base
            baseHeight *= random(1.0, 1.02);
        }
    }
    
    // Update target positions to maintain alignment in current mode
    if (config.animationMode !== 'none') {
        calculateTargetPositions(config.animationMode);
    }
}

function resetHeights() {
    if (isRandomized && originalHeights.length === cards.length) {
        for (let i = 0; i < cards.length; i++) {
            cards[i].height = originalHeights[i];
            cards[i].y = originalYPositions[i];
            
            // Also reset target positions if they're set
            if (targetPositions.length === cards.length) {
                targetPositions[i].height = originalHeights[i];
                targetPositions[i].y = originalYPositions[i];
            }
        }
        isRandomized = false;
        
        // Update target positions if in an animation mode
        if (config.animationMode !== 'none') {
            calculateTargetPositions(config.animationMode);
        }
    }
}

function toggleIsometricView() {
    // Toggle the isometric view setting
    config.isometricView = document.getElementById('isometricView').checked;
    
    // Ensure appropriate controls are shown/hidden
    if (config.isometricView) {
        document.querySelector('.isometric-controls').classList.add('visible');
        document.querySelector('.perspective-controls').classList.remove('visible');
        
        // Disable auto-rotation in isometric mode
        if (config.autoRotateX || config.autoRotateY || config.autoRotateZ) {
            config.autoRotateX = false;
            config.autoRotateY = false;
            config.autoRotateZ = false;
            
            // Update checkboxes
            document.getElementById('autoRotateX').checked = false;
            document.getElementById('autoRotateY').checked = false;
            document.getElementById('autoRotateZ').checked = false;
        }
    } else {
        document.querySelector('.isometric-controls').classList.remove('visible');
        document.querySelector('.perspective-controls').classList.add('visible');
    }
}

function updateIsometricAngles() {
    config.isoRotationX = parseFloat(document.getElementById('isoRotationX').value) || -35.264;
    config.isoRotationY = parseFloat(document.getElementById('isoRotationY').value) || -45;
    
    // Update value displays next to the isometric inputs
    const isoXDisplay = document.getElementById('isoRotationX').nextElementSibling;
    const isoYDisplay = document.getElementById('isoRotationY').nextElementSibling;
    
    if (isoXDisplay && isoXDisplay.classList.contains('value-display')) {
        isoXDisplay.textContent = config.isoRotationX.toFixed(1) + '°';
    }
    
    if (isoYDisplay && isoYDisplay.classList.contains('value-display')) {
        isoYDisplay.textContent = config.isoRotationY.toFixed(1) + '°';
    }
}

function updateCameraSettings() {
    config.cameraZoom = parseFloat(document.getElementById('cameraZoom').value) || 1.0;
    config.cameraRotationX = parseFloat(document.getElementById('cameraRotationX').value) || 0;
    config.cameraRotationY = parseFloat(document.getElementById('cameraRotationY').value) || 0;
    config.cameraRotationZ = parseFloat(document.getElementById('cameraRotationZ').value) || 0;
    
    // Update all input fields
    document.getElementById('cameraZoomInput').value = config.cameraZoom.toFixed(2);
    document.getElementById('cameraRotationXInput').value = Math.round(config.cameraRotationX);
    document.getElementById('cameraRotationYInput').value = Math.round(config.cameraRotationY);
    document.getElementById('cameraRotationZInput').value = Math.round(config.cameraRotationZ);
}

function updateFromInputs() {
    // Prevent recursive updates
    if (isUpdating) return;
    isUpdating = true;
    
    // Get values from inputs
    const newNumCards = parseInt(document.getElementById('numCards').value) || 100;
    const newStackSpacing = parseFloat(document.getElementById('stackSpacing').value) || 1;
    
    // Check if we need to recreate the cards
    const needsReinitialize = (
        newNumCards !== config.numCards || 
        newStackSpacing !== config.stackSpacing ||
        parseFloat(document.getElementById('cardWidth').value) !== config.cardWidth ||
        parseFloat(document.getElementById('cardHeight').value) !== config.cardHeight ||
        parseFloat(document.getElementById('cardThickness').value) !== config.cardThickness
    );
    
    // Update all config values
    config.numCards = newNumCards;
    config.wheelRadius = parseFloat(document.getElementById('wheelRadius').value) || 40;
    config.cardWidth = parseFloat(document.getElementById('cardWidth').value) || 20;
    config.cardHeight = parseFloat(document.getElementById('cardHeight').value) || 30;
    config.cardThickness = parseFloat(document.getElementById('cardThickness').value) || 0.01;
    config.stackSpacing = newStackSpacing;
    config.animationDuration = parseFloat(document.getElementById('animationDuration').value) || 2;
    config.cardColor = document.getElementById('cardColor').value || '#000000';
    config.strokeWeight = parseFloat(document.getElementById('strokeWeight').value) || 1.0;
    config.strokeColor = document.getElementById('strokeColor').value || '#FFFFFF';
    config.isometricView = document.getElementById('isometricView').checked;
    config.isoRotationX = parseFloat(document.getElementById('isoRotationX').value) || -35.264;
    config.isoRotationY = parseFloat(document.getElementById('isoRotationY').value) || -45;
    config.cameraZoom = parseFloat(document.getElementById('cameraZoom').value) || 1.0;
    config.cameraRotationX = parseFloat(document.getElementById('cameraRotationX').value) || 0;
    config.cameraRotationY = parseFloat(document.getElementById('cameraRotationY').value) || 0;
    config.cameraRotationZ = parseFloat(document.getElementById('cameraRotationZ').value) || 0;
    
    // Update camera transition settings
    config.enableCameraTransition = document.getElementById('enableCameraTransition').checked;
    config.finalCameraZoom = parseFloat(document.getElementById('finalCameraZoom').value) || 1.0;
    config.finalCameraRotationX = parseFloat(document.getElementById('finalCameraRotationX').value) || 45;
    config.finalCameraRotationY = parseFloat(document.getElementById('finalCameraRotationY').value) || 0;
    config.finalCameraRotationZ = parseFloat(document.getElementById('finalCameraRotationZ').value) || 0;
    
    // Reinitialize cards if needed
    if (needsReinitialize) {
        initCards();
        isRandomized = false;
    } else if (config.animationMode !== 'none') {
        // If we're in an animation mode, recalculate the target positions
        calculateTargetPositions(config.animationMode);
    }
    
    isUpdating = false;
}

function generateSvg() {
    // Update canvas size for SVG
    updateCanvasSize();
    
    // Create an SVG renderer
    svgBuffer = createGraphics(canvasWidth, canvasHeight, SVG);
    
    // Clear SVG buffer
    svgBuffer.clear();
    svgBuffer.background(0);
    
    // Translate to center
    svgBuffer.push();
    svgBuffer.translate(svgBuffer.width / 2, svgBuffer.height / 2);
    
    // Get colors
    const cardCol = color(config.cardColor);
    const strokeCol = color(config.strokeColor);
    
    // Draw cards to SVG buffer
    if (config.strokeWeight > 0) {
        svgBuffer.stroke(
            red(strokeCol),
            green(strokeCol),
            blue(strokeCol),
            alpha(strokeCol)
        );
    } else {
        svgBuffer.stroke(255);
    }
    svgBuffer.noFill();
    svgBuffer.strokeWeight(config.strokeWeight * 10); // Scale up for better visibility in SVG
    
    // Use the dynamic view scale for SVG export too
    let svgScaleFactor = viewScale;
    
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const depth = map(card.z, -config.numCards * config.stackSpacing / 2, config.numCards * config.stackSpacing / 2, 0.2, 1);
        
        svgBuffer.push();
        
        // Apply isometric projection for the SVG
        // Use the custom isometric angles if in isometric mode
        let isoX, isoY;
        if (config.isometricView) {
            // Handle negative angles correctly
            const angleX = radians(config.isoRotationX);
            const angleY = radians(config.isoRotationY);
            
            // Calculate isometric projection with correct sign handling
            // For negative angles, the sign of the projection changes accordingly
            const cosX = cos(angleX);
            const sinX = sin(angleX);
            const cosY = cos(angleY);
            const sinY = sin(angleY);
            
            // Project 3D to 2D using proper rotation matrices
            isoX = (card.x * cosY - card.z * sinY) * svgScaleFactor;
            isoY = (card.y * cosX - (card.x * sinY + card.z * cosY) * sinX) * svgScaleFactor;
        } else {
            // Use custom camera rotations for non-isometric mode
            const angleX = radians(config.cameraRotationX);
            const angleY = radians(config.cameraRotationY);
            const angleZ = radians(config.cameraRotationZ);
            
            // Apply rotation matrices for more accurate transformation
            // This is a simplified approach; full 3D matrix transformation would be more accurate
            let x = card.x;
            let y = card.y;
            let z = card.z;
            
            // Apply Y rotation (most significant for the projection)
            const cosY = cos(angleY);
            const sinY = sin(angleY);
            const xAfterY = x * cosY - z * sinY;
            const zAfterY = x * sinY + z * cosY;
            
            // Apply X rotation
            const cosX = cos(angleX);
            const sinX = sin(angleX);
            const yAfterX = y * cosX - zAfterY * sinX;
            const zAfterX = y * sinX + zAfterY * cosX;
            
            // Simple isometric-like projection
            isoX = xAfterY * svgScaleFactor;
            isoY = yAfterX * svgScaleFactor;
        }
        
        svgBuffer.translate(isoX, isoY);
        
        // Apply card rotation (simplified for SVG)
        const rotationFactor = card.rotY * 0.5;
        const widthMod = cos(abs(rotationFactor));
        
        // Set color with depth
        svgBuffer.stroke(
            red(strokeCol) * depth, 
            green(strokeCol) * depth, 
            blue(strokeCol) * depth, 
            alpha(strokeCol)
        );
        
        // Draw rectangle representing the card
        svgBuffer.rect(
            -card.width * widthMod * svgScaleFactor / 2,
            -card.height * svgScaleFactor / 2,
            card.width * widthMod * svgScaleFactor,
            card.height * svgScaleFactor
        );
        
        svgBuffer.pop();
    }
    
    svgBuffer.pop();
    
    // Get SVG as string
    svgString = svgBuffer.elt.outerHTML;
    
    return svgBuffer;
}

function saveSvg() {
    generateSvg();
    save(svgBuffer, 'card_stack.svg');
}

function copySvg() {
    generateSvg();
    
    // Copy SVG string to clipboard
    navigator.clipboard.writeText(svgString)
        .then(() => {
            alert('SVG copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy SVG: ', err);
            
            // Fallback method for copying
            const textarea = document.createElement('textarea');
            textarea.value = svgString;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('SVG copied to clipboard!');
        });
    
    // Also display SVG in the output div (for debugging)
    const outputDiv = document.getElementById('svgOutput');
    outputDiv.innerHTML = svgString;
    outputDiv.style.display = 'none';
}

// Add event listeners for live updates on all input elements
function setupLiveUpdates() {
    // Regular numeric inputs
    const numericInputs = [
        'numCards', 'wheelRadius', 'cardWidth', 'cardHeight', 
        'cardThickness', 'stackSpacing', 'animationDuration', 'strokeWeight'
    ];
    
    numericInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', updateFromInputs);
    });
    
    // Color inputs
    document.getElementById('cardColor').addEventListener('input', updateFromInputs);
    document.getElementById('strokeColor').addEventListener('input', updateFromInputs);
    
    // Camera controls with number inputs
    // Sliders
    document.getElementById('cameraZoom').addEventListener('input', function() {
        config.cameraZoom = parseFloat(this.value);
        document.getElementById('cameraZoomInput').value = config.cameraZoom.toFixed(2);
        updateCameraSettings();
    });
    
    document.getElementById('cameraRotationX').addEventListener('input', function() {
        config.cameraRotationX = parseFloat(this.value);
        document.getElementById('cameraRotationXInput').value = Math.round(config.cameraRotationX);
        updateCameraSettings();
    });
    
    document.getElementById('cameraRotationY').addEventListener('input', function() {
        config.cameraRotationY = parseFloat(this.value);
        document.getElementById('cameraRotationYInput').value = Math.round(config.cameraRotationY);
        updateCameraSettings();
    });
    
    document.getElementById('cameraRotationZ').addEventListener('input', function() {
        config.cameraRotationZ = parseFloat(this.value);
        document.getElementById('cameraRotationZInput').value = Math.round(config.cameraRotationZ);
        updateCameraSettings();
    });
    
    // Number inputs
    document.getElementById('cameraZoomInput').addEventListener('input', function() {
        config.cameraZoom = parseFloat(this.value);
        document.getElementById('cameraZoom').value = config.cameraZoom;
        updateCameraSettings();
    });
    
    document.getElementById('cameraRotationXInput').addEventListener('input', function() {
        config.cameraRotationX = parseFloat(this.value);
        document.getElementById('cameraRotationX').value = config.cameraRotationX;
        updateCameraSettings();
    });
    
    document.getElementById('cameraRotationYInput').addEventListener('input', function() {
        config.cameraRotationY = parseFloat(this.value);
        document.getElementById('cameraRotationY').value = config.cameraRotationY;
        updateCameraSettings();
    });
    
    document.getElementById('cameraRotationZInput').addEventListener('input', function() {
        config.cameraRotationZ = parseFloat(this.value);
        document.getElementById('cameraRotationZ').value = config.cameraRotationZ;
        updateCameraSettings();
    });
    
    // Final camera settings controls
    // Sliders
    document.getElementById('finalCameraZoom').addEventListener('input', function() {
        config.finalCameraZoom = parseFloat(this.value) || 1.0;
        document.getElementById('finalCameraZoomInput').value = config.finalCameraZoom.toFixed(2);
    });
    
    document.getElementById('finalCameraRotationX').addEventListener('input', function() {
        config.finalCameraRotationX = parseFloat(this.value) || 45;
        document.getElementById('finalCameraRotationXInput').value = Math.round(config.finalCameraRotationX);
    });
    
    document.getElementById('finalCameraRotationY').addEventListener('input', function() {
        config.finalCameraRotationY = parseFloat(this.value) || 0;
        document.getElementById('finalCameraRotationYInput').value = Math.round(config.finalCameraRotationY);
    });
    
    document.getElementById('finalCameraRotationZ').addEventListener('input', function() {
        config.finalCameraRotationZ = parseFloat(this.value) || 0;
        document.getElementById('finalCameraRotationZInput').value = Math.round(config.finalCameraRotationZ);
    });
    
    // Number inputs
    document.getElementById('finalCameraZoomInput').addEventListener('input', function() {
        config.finalCameraZoom = parseFloat(this.value) || 1.0;
        document.getElementById('finalCameraZoom').value = config.finalCameraZoom;
    });
    
    document.getElementById('finalCameraRotationXInput').addEventListener('input', function() {
        config.finalCameraRotationX = parseFloat(this.value) || 45;
        document.getElementById('finalCameraRotationX').value = config.finalCameraRotationX;
    });
    
    document.getElementById('finalCameraRotationYInput').addEventListener('input', function() {
        config.finalCameraRotationY = parseFloat(this.value) || 0;
        document.getElementById('finalCameraRotationY').value = config.finalCameraRotationY;
    });
    
    document.getElementById('finalCameraRotationZInput').addEventListener('input', function() {
        config.finalCameraRotationZ = parseFloat(this.value) || 0;
        document.getElementById('finalCameraRotationZ').value = config.finalCameraRotationZ;
    });
    
    // Camera transition toggle
    document.getElementById('enableCameraTransition').addEventListener('change', function() {
        config.enableCameraTransition = this.checked;
    });
    
    // Auto-rotation toggles
    document.getElementById('autoRotateX').addEventListener('change', function() {
        config.autoRotateX = this.checked;
    });
    
    document.getElementById('autoRotateY').addEventListener('change', function() {
        config.autoRotateY = this.checked;
    });
    
    document.getElementById('autoRotateZ').addEventListener('change', function() {
        config.autoRotateZ = this.checked;
    });
    
    // Isometric inputs with value displays
    document.getElementById('isoRotationX').addEventListener('input', function() {
        updateIsometricAngles();
    });
    
    document.getElementById('isoRotationY').addEventListener('input', function() {
        updateIsometricAngles();
    });
    
    // Animation mode
    document.getElementById('animationMode').addEventListener('change', function() {
        config.animationMode = this.value;
        if (config.animationMode !== 'none') {
            calculateTargetPositions(config.animationMode);
        }
    });
}

function initEventListeners() {
    // Update button - now just serves as an explicit reset/apply
    document.getElementById('updateBtn').addEventListener('click', function() {
        initCards();
        isRandomized = false;
        isAnimating = false;
        inAnimatedState = false; // Reset animation state
        isReversed = false;      // Reset reverse flag
        document.getElementById('animateBtn').textContent = 'Animate'; // Reset button text
        updateFromInputs();
    });
    
    // Randomize Heights button
    document.getElementById('randomizeHeightsBtn').addEventListener('click', randomizeHeights);
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', function() {
        resetHeights();
        // Also reset animation state if we're in reversed mode
        if (isReversed) {
            inAnimatedState = false;
            isReversed = false;
            document.getElementById('animateBtn').textContent = 'Animate';
        }
    });
    
    // Animate button
    document.getElementById('animateBtn').addEventListener('click', startAnimation);
    
    // Save SVG button
    document.getElementById('saveSvgBtn').addEventListener('click', saveSvg);
    
    // Copy SVG button
    document.getElementById('copySvgBtn').addEventListener('click', copySvg);
    
    // Reset Cache button
    document.getElementById('resetCacheBtn').addEventListener('click', resetCache);
    
    // Isometric View toggle
    document.getElementById('isometricView').addEventListener('change', toggleIsometricView);
    
    // Set up live updates
    setupLiveUpdates();
    
    // Initialize all value displays
    updateCameraSettings();
    updateIsometricAngles();
    
    // Initialize perspective controls visibility
    setTimeout(() => {
        const perspControls = document.querySelector('.perspective-controls');
        if (!document.getElementById('isometricView').checked) {
            perspControls.classList.add('visible');
        }
    }, 100);
}

// Function to clear browser cache and reload the page
function resetCache() {
    // Add a random query parameter to force cache refresh
    const reloadUrl = window.location.href.split('?')[0] + '?cache=' + Date.now();
    
    // Show loader or feedback
    const feedback = document.createElement('div');
    feedback.style.position = 'fixed';
    feedback.style.top = '50%';
    feedback.style.left = '50%';
    feedback.style.transform = 'translate(-50%, -50%)';
    feedback.style.background = 'rgba(0,0,0,0.8)';
    feedback.style.color = 'white';
    feedback.style.padding = '20px';
    feedback.style.borderRadius = '5px';
    feedback.style.zIndex = '9999';
    feedback.textContent = 'Clearing cache and reloading...';
    document.body.appendChild(feedback);
    
    // Reload after a short delay
    setTimeout(() => {
        window.location.href = reloadUrl;
    }, 500);
}

// Function to update auto-rotation
function updateAutoRotation() {
    if (config.isometricView) return; // Don't auto-rotate in isometric mode
    
    if (config.autoRotateX) {
        config.cameraRotationX += config.rotationSpeedX;
        if (config.cameraRotationX > 180) config.cameraRotationX = -180;
    }
    
    if (config.autoRotateY) {
        config.cameraRotationY += config.rotationSpeedY;
        if (config.cameraRotationY > 180) config.cameraRotationY = -180;
    }
    
    if (config.autoRotateZ) {
        config.cameraRotationZ += config.rotationSpeedZ;
        if (config.cameraRotationZ > 180) config.cameraRotationZ = -180;
    }
    
    // Update rotation input fields if any auto-rotation is active
    if (config.autoRotateX || config.autoRotateY || config.autoRotateZ) {
        updateRotationInputFields();
    }
} 