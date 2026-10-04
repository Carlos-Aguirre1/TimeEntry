import { test } from "node:test";
import assert from "node:assert/strict";
import { DURATION_OPTIONS, buildDurationOptions, isValidDurationMinutes, minutesToHoursText, formatDurationLabel, formatDurationWords } from "../../src/domain/duration.js";

test("default quick-pick options are half-hour steps from 0.5 h to 4 h in minutes", () => {
  assert.deepEqual(DURATION_OPTIONS, [30, 60, 90, 120, 150, 180, 210, 240]);
});

test("option range can be widened without touching the UI", () => {
  assert.deepEqual(buildDurationOptions({ max: 360 }).at(-1), 360);
  assert.equal(buildDurationOptions({ step: 15, max: 60 }).length, 4);
});

test("duration validation accepts positive whole minutes up to 24 h", () => {
  assert.equal(isValidDurationMinutes(30), true);
  assert.equal(isValidDurationMinutes(1440), true);
  assert.equal(isValidDurationMinutes(0), false);
  assert.equal(isValidDurationMinutes(-30), false);
  assert.equal(isValidDurationMinutes(1.5), false);
  assert.equal(isValidDurationMinutes("90"), false);
  assert.equal(isValidDurationMinutes(1441), false);
});

test("hours formatting is derived from minutes", () => {
  assert.equal(minutesToHoursText(90), "1.5");
  assert.equal(minutesToHoursText(60), "1.0");
  assert.equal(minutesToHoursText(0), "0.0");
  assert.equal(minutesToHoursText(390), "6.5");
  assert.equal(formatDurationLabel(90), "1.5 h");
  assert.equal(formatDurationLabel(120), "2 h");
  assert.equal(formatDurationWords(60), "1 hour");
  assert.equal(formatDurationWords(90), "1.5 hours");
});
