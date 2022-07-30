import { describe, it, expect } from "vitest";
import { arraysEqual } from "xen-dev-utils";
import {
  mapWhiteAsdfBlackQwerty,
  mapWhiteQweZxcBlack123Asd,
} from "../keyboard-mapping";

import {
  decodeKeyColors,
  decodeLines,
  decodeQuery,
  encodeQuery,
  encodeKeyColors,
  encodeLines,
  parseFloat36,
  encodeNumber,
  decodeNumber,
  encodeKeyMap,
  decodeKeyMap,
  DecodedState,
} from "../url-encode";

describe("URL encoder", () => {
  it("can encode all line types", () => {
    const lines = [
      "81/80",
      "-42.00",
      "2\\5",
      "700.01",
      "1,0723",
      "2/1",
      "2\\3<5>",
      "[3/2 -2,1>",
      "3/2+1.23",
      "4/3 - 0.1",
    ];
    expect(encodeLines(lines)).toBe(
      "29F28_-16._2B5_jg.01_1C0k3_2F1_2B3L5R_Q3F2S-2C1R_3F2P1.n_4F3S-S0.1"
    );
  });

  it("can decode all line types", () => {
    const lines = decodeLines(
      "29F28_-16._2B5_jg.01_1C0k3_2F1_2B3L5R_Q3F2S-2C1R_3F2P1.n_4F3S-S0.1"
    );
    const expected = [
      "81/80",
      "-42.",
      "2\\5",
      "700.01",
      "1,0723",
      "2/1",
      "2\\3<5>",
      "[3/2 -2,1>",
      "3/2+1.23",
      "4/3 - 0.1",
    ];
    expect(arraysEqual(lines, expected)).toBeTruthy();
  });

  it("can encode key colors", () => {
    const keyColors = ["blue", "black", "white", "black", "red", "red"];
    expect(encodeKeyColors(keyColors)).toBe("blue-~-red_red");
  });

  it("can decode key colors", () => {
    const keyColors = decodeKeyColors("blue-~-red_red");
    const expected = ["blue", "black", "white", "black", "red", "red"];
    expect(arraysEqual(keyColors, expected)).toBeTruthy();
  });

  it("can decode a whole URL", () => {
    const url = new URL(
      "https://scaleworkshop.lumipakkanen.com/?n=Equal%20pentatonic&l=1B5_2B5_3B5_4B5_5B5&c=~teal_cyan-blue&f=c0&version=2.0.0"
    );
    const decoded = decodeQuery(url.searchParams);
    expect(decoded.scaleName).toBe("Equal pentatonic");
    expect(decoded.scaleLines.join(" ")).toBe("1\\5 2\\5 3\\5 4\\5 5\\5");
    expect(decoded.keyColors.join(" ")).toBe("white teal cyan black blue");
    expect(decoded.baseFrequency).toBe(432);
    expect(decoded.baseMidiNote).toBe(69);
    expect(decoded.isomorphicHorizontal).toBe(1);
    expect(decoded.isomorphicVertical).toBe(5);
  });

  it("can encode the app state", () => {
    const state: DecodedState = {
      scaleName: "", // default
      scaleLines: ["5/4", "6/4", "7/4", "8/4"],
      keyColors: ["white", "white", "black", "white"],
      baseFrequency: 440, // default
      baseMidiNote: 60,
      isomorphicHorizontal: 1, // default
      isomorphicVertical: 3,
      keyboardMode: "isomorphic",
      keyboardMapping: new Map(),
      equaveShift: 0, // default
      degreeShift: 0, // default
    };
    const encoded = encodeQuery(state);
    expect(encoded).toMatchObject({
      l: "5F4_6F4_7F4_8F4",
      c: "~~-~",
      m: "1o",
      v: "3",
    });
  });
});

describe("Float 36 parser", () => {
  it("can decode integers", () => {
    expect(parseFloat36("10")).toBe(36);
  });

  it("can decode a known value", () => {
    expect(parseFloat36("3.53i0tuycp")).toBeCloseTo(3.14159);
  });

  it("can handle leading zeroes after the triginta seximal point", () => {
    expect(parseFloat36("1.01")).toBeCloseTo(1 + 1 / 1296, 4);
  });

  it("can handle trailing zeroes after the triginta seximal point", () => {
    expect(parseFloat36("10.10")).toBeCloseTo(36 + 1 / 36, 4);
  });

  it("can decode random values", () => {
    const value = Math.random() * 1000;
    expect(parseFloat36(value.toString(36))).toBeCloseTo(value);
  });
});

describe("Integer encoder", () => {
  it("can encode non-negative numbers less than 64 using a single character", () => {
    for (let i = 0; i < 64; ++i) {
      expect(encodeNumber(i)).toHaveLength(1);
    }
  });

  it("can encode and decode all numbers in the range from -1000 to 1000", () => {
    for (let i = -1000; i <= 1000; ++i) {
      expect(decodeNumber(encodeNumber(i))).toBe(i);
    }
  });
});

describe("Keyboard map encoder", () => {
  it("can encode the default ASDF map", () => {
    const keyboardMapping = new Map();
    mapWhiteAsdfBlackQwerty(decodeKeyColors("~-~~-~-~~-~-"), keyboardMapping);
    expect(encodeKeyMap(keyboardMapping)).toBe(
      "............-1-1.46.9bd.gi023578acefhj..........."
    );
  });

  it("can encode the default ZXCV map", () => {
    const keyboardMapping = new Map();
    mapWhiteQweZxcBlack123Asd(
      decodeKeyColors("~-~~-~-~~-~-"),
      keyboardMapping,
      12
    );
    expect(encodeKeyMap(keyboardMapping)).toBe(
      "bd.gi.lnp.sucefhjkmoqrtv-1-1.46.9bd.gh.023578acef"
    );
  });

  it("can encode large custom values", () => {
    const keyboardMapping = new Map();
    keyboardMapping.set("KeyA", 1000);
    keyboardMapping.set("Digit2", -500);
    expect(encodeKeyMap(keyboardMapping)).toBe(
      ".-7Q-......................--fE-......................"
    );
  });

  it("can decode the default ASDF map", () => {
    const decoded = decodeKeyMap(
      "............-1-1.46.9bd.gi023578acefhj..........."
    );
    const keyboardMapping: Map<string, number> = new Map();
    mapWhiteAsdfBlackQwerty(decodeKeyColors("~-~~-~-~~-~-"), keyboardMapping);
    for (const [key, value] of keyboardMapping) {
      expect(decoded.get(key)).toBe(value);
    }
    for (const [key, value] of decoded) {
      expect(keyboardMapping.get(key)).toBe(value);
    }
  });

  it("can decode the default ZXCV map", () => {
    const decoded = decodeKeyMap(
      "bd.gi.lnp.sucefhjkmoqrtv-1-1.46.9bd.gh.023578acef"
    );
    const keyboardMapping: Map<string, number> = new Map();
    mapWhiteQweZxcBlack123Asd(
      decodeKeyColors("~-~~-~-~~-~-"),
      keyboardMapping,
      12
    );
    for (const [key, value] of keyboardMapping) {
      expect(decoded.get(key)).toBe(value);
    }
    for (const [key, value] of decoded) {
      expect(keyboardMapping.get(key)).toBe(value);
    }
  });

  it("can decode large custom values", () => {
    const map = decodeKeyMap(
      ".-7Q-......................--fE-......................"
    );
    expect(map.size).toBe(2);
    expect(map.get("KeyA")).toBe(1000);
    expect(map.get("Digit2")).toBe(-500);
  });
});
