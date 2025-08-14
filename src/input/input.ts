// Input state
const keys: { [key: string]: boolean } = {};

// Control mode state
let keyboardEnabled = true;
let joystickEnabled = false; // becomes true after first joystick interaction until a keyboard move happens

// Joystick state (direction in radians, strength in [0,1])
let joystickDirection = 0;
let joystickStrength = 0;
let lastNonZeroJoystickDirection = 0;

// Setup keyboard event listeners
export function setupInput() {
  document.addEventListener('keydown', (event) => {
    keys[event.code] = true;

    // If any movement key is pressed, switch to keyboard mode
    if (
      event.code === 'KeyW' ||
      event.code === 'KeyA' ||
      event.code === 'KeyS' ||
      event.code === 'KeyD' ||
      event.code === 'ArrowUp' ||
      event.code === 'ArrowDown' ||
      event.code === 'ArrowLeft' ||
      event.code === 'ArrowRight'
    ) {
      keyboardEnabled = true;
      joystickEnabled = false;
    }
  });

  document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
  });
}

// Get the current state of a key
export function isKeyPressed(keyCode: string): boolean {
  return keys[keyCode] || false;
}

// Get the input state object (for systems that need direct access)
export function getInputState(): { [key: string]: boolean } {
  return keys;
} 

// Programmatic setter for virtual (UI) inputs
export function setKeyPressed(keyCode: string, pressed: boolean) {
  keys[keyCode] = pressed;
}

// Programmatic setter for virtual joystick
export function setJoystickParams(directionRadians: number, strength01: number) {
  const clamped = Math.max(0, Math.min(1, strength01));
  joystickStrength = clamped;
  if (clamped > 0) {
    joystickDirection = directionRadians;
    lastNonZeroJoystickDirection = directionRadians;
  } else {
    // keep last direction; do not force to 0/right
    joystickDirection = lastNonZeroJoystickDirection;
  }
  // Activate joystick mode upon first interaction
  joystickEnabled = true;
  keyboardEnabled = false;
}

export function getJoystickParams(): { direction: number; strength: number } {
  return { direction: joystickDirection, strength: joystickStrength };
}

export function isJoystickEnabled(): boolean {
  return joystickEnabled;
}

export function isKeyboardEnabled(): boolean {
  return keyboardEnabled;
}

export function setKeyboardEnabled(enabled: boolean) {
  keyboardEnabled = enabled;
  if (enabled) joystickEnabled = false;
}

export function setJoystickEnabled(enabled: boolean) {
  joystickEnabled = enabled;
  if (enabled) keyboardEnabled = false;
}