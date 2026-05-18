import assert from 'node:assert/strict';
import test from 'node:test';

globalThis.Phaser = {
  Math: {
    Clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },
  },
};

const { Hud } = await import('../docs/src/ui/Hud.js');

function createBarStub() {
  return {
    scaleX: null,
    scaleY: null,
    visible: null,
    setScale(x, y) {
      this.scaleX = x;
      this.scaleY = y;
      return this;
    },
    setVisible(visible) {
      this.visible = visible;
      return this;
    },
  };
}

function createHudForBarTest() {
  return Object.assign(Object.create(Hud.prototype), {
    coffinBarFill: createBarStub(),
    coffinBarHighlight: createBarStub(),
    previousCoffinMeterValue: null,
    previousCoffinGodId: null,
    pulseCount: 0,
    pulseCoffinBar() {
      this.pulseCount += 1;
    },
  });
}

test('coffin meter bar fill scales visibly with progress ratio', () => {
  const hud = createHudForBarTest();

  hud.updateCoffinBar(0);
  assert.equal(hud.coffinBarFill.scaleX, 0);
  assert.equal(hud.coffinBarFill.visible, false);

  hud.updateCoffinBar(0.25);
  assert.equal(hud.coffinBarFill.scaleX, 0.25);
  assert.equal(hud.coffinBarHighlight.scaleX, 0.25);
  assert.equal(hud.coffinBarFill.visible, true);
  assert.equal(hud.coffinBarHighlight.visible, true);

  hud.updateCoffinBar(0.5);
  assert.equal(hud.coffinBarFill.scaleX, 0.5);
  assert.equal(hud.coffinBarHighlight.scaleX, 0.5);

  hud.updateCoffinBar(1.2);
  assert.equal(hud.coffinBarFill.scaleX, 1);
  assert.equal(hud.coffinBarHighlight.scaleX, 1);
});

test('coffin meter bar pulses only when the same god gains meter', () => {
  const hud = createHudForBarTest();
  const imsety = { id: 'imsety' };
  const hapy = { id: 'hapy' };

  hud.pulseCoffinBarOnGain(imsety, { value: 0 });
  assert.equal(hud.pulseCount, 0);

  hud.pulseCoffinBarOnGain(imsety, { value: 250 });
  assert.equal(hud.pulseCount, 1);

  hud.pulseCoffinBarOnGain(imsety, { value: 250 });
  assert.equal(hud.pulseCount, 1);

  hud.pulseCoffinBarOnGain(hapy, { value: 0 });
  assert.equal(hud.pulseCount, 1);

  hud.pulseCoffinBarOnGain(hapy, { value: 500 });
  assert.equal(hud.pulseCount, 2);
});
