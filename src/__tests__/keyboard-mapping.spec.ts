import { describe, it, expect } from "vitest";
import {
  mapWhiteAsdfBlackQwerty,
  mapWhiteQweZxcBlack123Asd,
} from "../keyboard-mapping";

describe("Piano-style keyboard mapper", () => {
  it("maps the major scale (ASDF)", () => {
    const mapping = mapWhiteAsdfBlackQwerty(
      [
        "white",
        "black",
        "white",
        "black",
        "white",
        "white",
        "black",
        "white",
        "black",
        "white",
        "black",
        "white",
      ],
      60,
      0
    );
    expect(mapping).toHaveLength(20);
    expect(mapping.get("KeyA")).toBe(0);
    expect(mapping.get("KeyW")).toBe(1);
    expect(mapping.get("KeyS")).toBe(2);
    expect(mapping.get("KeyE")).toBe(3);
    expect(mapping.get("KeyD")).toBe(4);
    expect(mapping.get("KeyF")).toBe(5);
    expect(mapping.get("KeyT")).toBe(6);
    expect(mapping.get("KeyG")).toBe(7);
    expect(mapping.get("KeyY")).toBe(8);
    expect(mapping.get("KeyH")).toBe(9);
    expect(mapping.get("KeyU")).toBe(10);
    expect(mapping.get("KeyJ")).toBe(11);
    expect(mapping.get("KeyK")).toBe(12);
    expect(mapping.get("KeyO")).toBe(13);
    expect(mapping.get("KeyL")).toBe(14);
    expect(mapping.get("KeyP")).toBe(15);
    expect(mapping.get("Semicolon")).toBe(16);
    expect(mapping.get("Quote")).toBe(17);
    expect(mapping.get("BracketRight")).toBe(18);
    expect(mapping.get("Backslash")).toBe(19);
  });

  it("maps the major scale (ZXCV 1)", () => {
    const mapping = mapWhiteQweZxcBlack123Asd(
      [
        "white",
        "black",
        "white",
        "black",
        "white",
        "white",
        "black",
        "white",
        "black",
        "white",
        "black",
        "white",
      ],
      12,
      60,
      0,
      1
    );
    expect(mapping).toHaveLength(39);
    expect(mapping.get("KeyZ")).toBe(0);
    expect(mapping.get("Comma")).toBe(12);
    expect(mapping.get("KeyQ")).toBe(12);
    expect(mapping.get("KeyI")).toBe(24);
  });

  it("maps the major scale (ZXCV 0)", () => {
    const mapping = mapWhiteQweZxcBlack123Asd(
      [
        "white",
        "black",
        "white",
        "black",
        "white",
        "white",
        "black",
        "white",
        "black",
        "white",
        "black",
        "white",
      ],
      12,
      60,
      0,
      0
    );
    expect(mapping).toHaveLength(40);
    expect(mapping.get("IntlBackslash")).toBe(0);
    expect(mapping.get("KeyM")).toBe(12);
    expect(mapping.get("KeyQ")).toBe(12);
    expect(mapping.get("KeyI")).toBe(24);
  });

  // Note that non-black is treated as white.
  it("can handle the lack of black keys (ASDF)", () => {
    const mapping = mapWhiteAsdfBlackQwerty(["blue", "red", "blue"], 69, 0);
    expect(mapping).toHaveLength(12);
  });

  it("can handle the lack of black keys (ZXCV 0)", () => {
    const mapping = mapWhiteQweZxcBlack123Asd(
      ["blue", "red", "blue"],
      3,
      69,
      0,
      0
    );
    expect(mapping).toHaveLength(23);
  });
});
