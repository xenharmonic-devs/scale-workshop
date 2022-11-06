/*
Split the keyboard into xy-planes along a z-coordinate for different contiguous regions of keys
*/

const ORIGIN_LAYER_0 = 0;
/**
 * Key codes for the row consisting of Esc and FN keys.
 */
export const CODES_LAYER_0 = [
  [
    "Escape",
    "F1",
    "F2",
    "F3",
    "F4",
    "F5",
    "F6",
    "F7",
    "F8",
    "F9",
    "F10",
    "F11",
    "F12",
  ],
];

const ORIGIN_LAYER_1 = -1;
/**
 * Key codes for the rows containing the digits, qwerty, asdf and zxcv.
 */
export const CODES_LAYER_1 = [
  [
    "Backquote",
    "Digit1",
    "Digit2",
    "Digit3",
    "Digit4",
    "Digit5",
    "Digit6",
    "Digit7",
    "Digit8",
    "Digit9",
    "Digit0",
    "Minus",
    "Equal",
  ],
  [
    null,
    "KeyQ",
    "KeyW",
    "KeyE",
    "KeyR",
    "KeyT",
    "KeyY",
    "KeyU",
    "KeyI",
    "KeyO",
    "KeyP",
    "BracketLeft",
    "BracketRight",
  ],
  [
    null,
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyF",
    "KeyG",
    "KeyH",
    "KeyJ",
    "KeyK",
    "KeyL",
    "Semicolon",
    "Quote",
    "Backslash",
  ],
  [
    "IntlBackslash",
    "KeyZ",
    "KeyX",
    "KeyC",
    "KeyV",
    "KeyB",
    "KeyN",
    "KeyM",
    "Comma",
    "Period",
    "Slash",
  ],
];

const ORIGIN_LAYER_2 = 0;
/**
 * Key codes for the cluster of keys with Page Up/Down.
 */
export const CODES_LAYER_2 = [
  ["Insert", "Home", "PageUp"],
  ["Delete", "End", "PageDown"],
];

const ORIGIN_LAYER_3 = 0;
/**
 * Key codes for the numpad.
 */
export const CODES_LAYER_3 = [
  ["NumLock", "NumpadDivide", "NumpadMultiply", "NumpadSubtract"],
  ["Numpad7", "Numpad8", "Numpad9", "NumpadAdd"],
  ["Numpad4", "Numpad5", "Numpad6"],
  ["Numpad1", "Numpad2", "Numpad3", "NumpadEnter"],
  ["Numpad0", null, "NumpadDecimal"],
];

/**
 * Mapping from key codes to coordinates of input device geometry.
 */
export const COORDS_BY_CODE: Map<string, number[]> = new Map();
CODES_LAYER_0.forEach((row, y) =>
  row.forEach((code, x) => COORDS_BY_CODE.set(code, [ORIGIN_LAYER_0 + x, y, 0]))
);
CODES_LAYER_1.forEach((row, y) => {
  row.forEach((code, x) => {
    if (code !== null) {
      COORDS_BY_CODE.set(code, [ORIGIN_LAYER_1 + x, y, 1]);
    }
  });
});
CODES_LAYER_2.forEach((row, y) =>
  row.forEach((code, x) => COORDS_BY_CODE.set(code, [ORIGIN_LAYER_2 + x, y, 2]))
);
CODES_LAYER_3.forEach((row, y) => {
  row.forEach((code, x) => {
    if (code !== null) {
      COORDS_BY_CODE.set(code, [ORIGIN_LAYER_3 + x, y, 3]);
    }
  });
});

/**
 * Keyboard event with a key code and coordinates if the device geometry can be figured out with any confidence.
 */
export type CoordinateKeyboardEvent = {
  code: string;
  coordinates?: number[];
};

type KeyupCallback = () => void;
type KeydownCallback = (event: CoordinateKeyboardEvent) => KeyupCallback;

/**
 * Keyboard event listener that filters out repeated keydown events and normalizes keycodes to coordinates.
 * The Shift keys toggle 'sustain'.
 */
export class Keyboard {
  keydownCallbacks: KeydownCallback[];
  keyupCallbacks: Map<string, KeyupCallback[]>;
  activeKeys: Set<string>;
  pendingKeys: Set<string>;
  stickyKeys: Set<string>;
  private _keydown?: (event: KeyboardEvent) => void;
  private _keyup?: (event: KeyboardEvent) => void;
  log: (msg: string) => void;

  /**
   * Construct a new keyboard event listener.
   * @param autobind Start listening to "keydown" and "keyup" events immediately.
   * @param log Logging function.
   */
  constructor(autobind = false, log?: (msg: string) => void) {
    this.keydownCallbacks = [];
    this.keyupCallbacks = new Map();
    this.activeKeys = new Set();
    this.pendingKeys = new Set();
    this.stickyKeys = new Set();

    if (autobind) {
      this._keydown = this.keydown.bind(this);
      this._keyup = this.keyup.bind(this);
      window.addEventListener("keydown", this._keydown);
      window.addEventListener("keyup", this._keyup);
    }

    if (log === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      this.log = (msg: string) => {};
    } else {
      this.log = log;
    }
  }

  /**
   * Stop listening to "keydown" and "keyup" events if constructed with `autobind = true`.
   */
  dispose() {
    if (this._keydown) {
      window.removeEventListener("keydown", this._keydown);
    }
    if (this._keyup) {
      window.removeEventListener("keyup", this._keyup);
    }
  }

  /**
   * Register a listener for processed keydown events.
   * @param listener Function to call when a new key is pressed.
   */
  addKeydownListener(listener: KeydownCallback) {
    this.keydownCallbacks.push(listener);
  }

  /**
   * Unregister a listener for processed keydown events.
   * @param listener Callback registered with {@link Keyboard.addKeydownListener}.
   */
  removeEventListener(listener: KeydownCallback) {
    this.keydownCallbacks.splice(this.keydownCallbacks.indexOf(listener), 1);
  }

  private fireKeydown(event: CoordinateKeyboardEvent) {
    event.coordinates = COORDS_BY_CODE.get(event.code);
    const keyupCallbacks = this.keyupCallbacks.get(event.code) || [];
    for (const callback of keyupCallbacks) {
      console.warn("Unresolved keyup detected");
      callback();
    }
    this.log(
      `Firing keydown listeners with ${event.code} @ ${event.coordinates}`
    );
    this.keydownCallbacks.forEach((callback) =>
      keyupCallbacks.push(callback(event))
    );
    this.keyupCallbacks.set(event.code, keyupCallbacks);
  }

  private fireKeyup(event: CoordinateKeyboardEvent) {
    this.log(`Firing keyup listeners with ${event.code}`);
    for (const callback of this.keyupCallbacks.get(event.code) || []) {
      callback();
    }
    this.keyupCallbacks.delete(event.code);
  }

  /**
   * Listener to be registered with `window.addEventListener("keydown", ...)`.
   * @param event Keyboard event of a key being pressed down.
   */
  keydown(event: KeyboardEvent) {
    this.log(`${event.code} keydown received`);
    if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) {
      this.log(`${event.code} keydown filtered out`);
      return;
    }
    // The pending state isn't strictly necessary as we filter out repeated events,
    // but it's kept in case event.repeat isn't 100% reliable.
    if (event.key == "Shift") {
      for (const code of this.activeKeys) {
        this.log(`Adding ${code} to pending state due to a 'Shift' press`);
        this.pendingKeys.add(code);
      }
      return;
    }

    if (this.stickyKeys.has(event.code)) {
      this.log(`Stricky toggle for ${event.code}`);
      this.activeKeys.delete(event.code);
      this.stickyKeys.delete(event.code);
      this.pendingKeys.delete(event.code);
      this.fireKeyup(event);
      return;
    }

    if (this.pendingKeys.has(event.code)) {
      this.log(`${event.code} is pending`);
      return;
    }

    if (this.activeKeys.has(event.code)) {
      this.log(`${event.code} is already active`);
      return;
    }

    if (COORDS_BY_CODE.has(event.code)) {
      this.log(`Adding ${event.code} to active state`);
      this.activeKeys.add(event.code);
      if (event.shiftKey) {
        this.log(
          `Adding ${event.code} to pending state due to being pressed with 'Shift'`
        );
        this.pendingKeys.add(event.code);
      }
      this.fireKeydown(event);
      return;
    }
  }

  /**
   * Listener to be registered with `window.addEventListener("keyup", ...)`.
   * @param event Keyboard event of a pressed key being released.
   */
  keyup(event: KeyboardEvent) {
    this.log(`${event.code} keyup received`);
    if (event.shiftKey && this.activeKeys.has(event.code)) {
      this.log(
        `Sticking ${event.code} due being released while 'Shift' is pressed`
      );
      this.stickyKeys.add(event.code);
    }
    if (this.pendingKeys.has(event.code)) {
      this.log(`Promoting ${event.code} from pending to sticky`);
      this.pendingKeys.delete(event.code);
      this.stickyKeys.add(event.code);
    }
    if (this.stickyKeys.has(event.code)) {
      this.log(`Not firing keyup due to ${event.code} being sticky`);
      return;
    }

    if (this.activeKeys.has(event.code)) {
      this.activeKeys.delete(event.code);
      this.fireKeyup(event);
      return;
    }
    this.log(`${event.code} keyup fell through`);
  }

  /**
   * Release keys sustained due to being pressed with 'Shift'.
   */
  deactivate() {
    this.log(`Releasing all sustained and active keys`);
    this.pendingKeys.clear();
    this.stickyKeys.clear();
    for (const code of this.activeKeys.keys()) {
      this.fireKeyup({ code });
    }
    this.activeKeys.clear();
  }
}
