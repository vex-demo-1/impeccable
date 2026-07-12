export function initLivePerformance() {
  const root = document.querySelector('[data-live-performance]');
  if (!root) return;

  const slider = root.querySelector('[data-model-latency]');
  const modelValue = root.querySelector('[data-model-value]');
  const currentValue = root.querySelector('[data-current-total]');
  const overlapValue = root.querySelector('[data-overlap-total]');
  if (!slider || !modelValue || !currentValue || !overlapValue) return;

  const protocolFloor = Number(root.dataset.protocolFloor || 0);
  const overlapFloor = Number(root.dataset.overlapFloor || 0);
  const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

  const display = (milliseconds) => {
    if (milliseconds >= 1000) return `${formatter.format(milliseconds / 1000)} s`;
    return `${Math.round(milliseconds)} ms`;
  };

  const render = () => {
    const modelMs = Number(slider.value);
    modelValue.textContent = display(modelMs);
    currentValue.textContent = display(modelMs + protocolFloor);
    overlapValue.textContent = display(modelMs + overlapFloor);
    slider.setAttribute('aria-valuetext', display(modelMs));
  };

  slider.addEventListener('input', render);
  render();
}

