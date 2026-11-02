import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

// An API card opens below its link, from the link's left edge. Near the right side of
// the window that would run off it, so the card moves left by as much as it needs.
if (ExecutionEnvironment.canUseDOM) {
  const place = (event) => {
    const card = event.target.closest?.('.api-ref')?.querySelector('.api-card');

    if (!card) {
      return;
    }

    card.style.removeProperty('--api-card-shift');

    requestAnimationFrame(() => {
      const box = card.getBoundingClientRect();
      const over = box.right - (document.documentElement.clientWidth - 12);

      if (over > 0) {
        card.style.setProperty('--api-card-shift', `${-Math.min(over, box.left - 12)}px`);
      }
    });
  };

  document.addEventListener('pointerover', place);
  document.addEventListener('focusin', place);
}
