import React, {useEffect, useRef} from 'react';

const body =
  'M125 239.496C75.2944 239.496 35 199.201 35 149.496C35 113.96 55.5949 83.2347 85.5 68.6043C85.5 68.6043 77 58.9957 66 57.346C66 57.346 58.7248 64.9324 52.7504 64.9957C44.0522 65.0878 37 57.944 37 49.2453C37 40.5466 44.0517 33.4949 52.7504 33.4949C76 33.4949 96 64.27 96 64.27C105.099 61.1747 114.854 59.4957 125 59.4957C129.139 59.4957 133.212 59.775 137.202 60.3159C135.652 56.8536 128.236 41.1868 119.229 37.1359C119.229 37.1359 110.174 42.4726 104.405 40.9181C96.0059 38.6549 91.148 29.8703 93.5 21.4957C95.852 13.121 104.548 8.23867 112.922 10.5907C133.533 16.3791 146.775 56.3617 148.745 62.661C186.929 73.0781 215 108.009 215 149.496V239.496H177V149.496C177 120.777 153.719 97.4957 125 97.4957C96.2812 97.4957 73 120.777 73 149.496C73 178.214 96.2812 201.496 125 201.496C129.656 201.496 134.168 200.884 138.462 199.736L148.299 236.451C140.868 238.437 133.058 239.496 125 239.496Z';

// The eye rests where the logo draws it, and looks around the middle of the a.
const rest = {x: 141, y: 142.5};
const socket = {x: 125, y: 149.5};

// AntMark is the logo's head, with an eye that follows the pointer when asked to.
export default function AntMark({watch = false, size = 40, className}) {
  const eye = useRef(null);

  useEffect(() => {
    const element = eye.current;

    if (!watch || !element || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const pointer = {x: 0, y: 0};
    const at = {x: 0, y: 0};
    let frame = 0;
    let last = 0;

    // One step per frame, eased towards the pointer, so the eye neither trails a
    // restarting transition nor jumps when the pointer moves fast.
    const step = (now) => {
      const box = element.ownerSVGElement.getBoundingClientRect();
      const scale = box.width / 250;
      const x = pointer.x - (box.left + socket.x * scale);
      const y = pointer.y - (box.top + socket.y * scale);
      const distance = Math.hypot(x, y) || 1;
      const reach = Math.min(distance / 8, 30);
      const toX = socket.x + (x / distance) * reach - rest.x;
      const toY = socket.y + (y / distance) * reach - rest.y;
      const elapsed = last ? Math.min(now - last, 64) : 16;
      const ease = 1 - Math.exp(-elapsed / 40);

      last = now;
      at.x += (toX - at.x) * ease;
      at.y += (toY - at.y) * ease;
      element.setAttribute('transform', `translate(${at.x.toFixed(2)} ${at.y.toFixed(2)})`);

      if (Math.abs(toX - at.x) > 0.05 || Math.abs(toY - at.y) > 0.05) {
        frame = requestAnimationFrame(step);

        return;
      }

      frame = 0;
      last = 0;
    };

    const look = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;

      if (!frame) {
        frame = requestAnimationFrame(step);
      }
    };

    window.addEventListener('pointermove', look, {passive: true});

    return () => {
      window.removeEventListener('pointermove', look);
      cancelAnimationFrame(frame);
    };
  }, [watch]);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 250 250"
      fill="currentColor"
      aria-hidden="true">
      <path d={body} />
      <circle ref={eye} className="ant-eye" cx={rest.x} cy={rest.y} r="20" />
    </svg>
  );
}
