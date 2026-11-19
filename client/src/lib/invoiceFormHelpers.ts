import type { KeyboardEvent, WheelEvent } from "react";

// Numeric inputs start blank. React Hook Form keeps the raw string the
// user types, and zod coerces it on submit ("" -> 0). The cast only
// satisfies TypeScript's `number` type for the blank default.
export const BLANK = "" as unknown as number;

// Hides the browser's up/down spinner on <input type="number">.
export const numberInputClass =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

// Stops the mouse wheel and ArrowUp/ArrowDown from changing the value.
export const numberInputGuards = {
  onWheel: (e: WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  },
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
    }
  },
};