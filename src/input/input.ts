// Input state
const keys: { [key: string]: boolean } = {};

// Setup keyboard event listeners
export function setupInput() {
  document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
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