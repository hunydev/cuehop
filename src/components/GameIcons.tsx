import type { SVGProps } from 'react';

export type GameIconName =
  | 'add'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'close'
  | 'copy'
  | 'edit'
  | 'help'
  | 'lightning'
  | 'pause'
  | 'play'
  | 'reset'
  | 'spikes'
  | 'star'
  | 'status'
  | 'warning';

type GameIconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: GameIconName;
  size?: number;
};

export function GameIcon({
  name,
  size = 18,
  className = '',
  ...props
}: GameIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    className: `game-icon ${className}`.trim(),
    ...props,
  };

  if (name === 'play') {
    return (
      <svg {...common}>
        <path d="M8 5.4v13.2L19 12 8 5.4Z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === 'pause') {
    return (
      <svg {...common}>
        <path d="M8 5v14M16 5v14" strokeWidth="3" />
      </svg>
    );
  }
  if (name === 'reset') {
    return (
      <svg {...common}>
        <path d="M5.3 8.2H10V3.5" />
        <path d="M5.7 17.8a8 8 0 1 0-.4-9.6" />
      </svg>
    );
  }
  if (name === 'edit') {
    return (
      <svg {...common}>
        <path d="m14.8 5.2 4 4M4.5 19.5l3.8-.8L19.1 7.9a1.8 1.8 0 0 0 0-2.6l-.4-.4a1.8 1.8 0 0 0-2.6 0L5.3 15.7l-.8 3.8Z" />
      </svg>
    );
  }
  if (name === 'star') {
    return (
      <svg {...common}>
        <path
          d="m12 2.7 2.8 5.7 6.3.9-4.5 4.4 1.1 6.2-5.7-3-5.7 3 1.1-6.2-4.5-4.4 6.3-.9L12 2.7Z"
          fill="currentColor"
          stroke="currentColor"
        />
      </svg>
    );
  }
  if (name === 'lightning') {
    return (
      <svg {...common}>
        <path d="m13.8 2-8 11.1h5.4L10.2 22l8-11.4h-5.4L13.8 2Z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === 'arrow-right') {
    return (
      <svg {...common}>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </svg>
    );
  }
  if (name === 'arrow-left') {
    return (
      <svg {...common}>
        <path d="M19 12H5M10 7l-5 5 5 5" />
      </svg>
    );
  }
  if (name === 'arrow-up') {
    return (
      <svg {...common}>
        <path d="M12 19V5M7 10l5-5 5 5" />
      </svg>
    );
  }
  if (name === 'arrow-down') {
    return (
      <svg {...common}>
        <path d="M12 5v14M7 14l5 5 5-5" />
      </svg>
    );
  }
  if (name === 'copy') {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="11" height="11" rx="1.5" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </svg>
    );
  }
  if (name === 'close') {
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }
  if (name === 'add') {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  if (name === 'help') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.7 9a2.5 2.5 0 1 1 3.6 2.3c-.9.5-1.3.9-1.3 2M12 17h.01" />
      </svg>
    );
  }
  if (name === 'warning') {
    return (
      <svg {...common}>
        <path d="M12 3 2.8 20h18.4L12 3Z" fill="currentColor" stroke="currentColor" />
        <path d="M12 9v5M12 17.2h.01" stroke="white" strokeWidth="2.2" />
      </svg>
    );
  }
  if (name === 'status') {
    return (
      <svg {...common}>
        <circle cx="5" cy="12" r="2" fill="currentColor" stroke="none" />
        <path d="M8 12h11M15 8l4 4-4 4" />
      </svg>
    );
  }
  if (name === 'spikes') {
    return (
      <svg {...common} viewBox="0 0 48 24">
        <path
          d="M2 21 11 4l7 17L27 3l8 18 7-14 4 14H2Z"
          fill="currentColor"
          stroke="currentColor"
        />
      </svg>
    );
  }

  return <svg {...common} />;
}

export function FrogSprite({
  className = '',
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`frog-sprite ${className}`.trim()}
      {...props}
    >
      <g className="frog-sprite__shadow">
        <ellipse cx="60" cy="88" rx="35" ry="8" fill="currentColor" opacity=".2" />
      </g>
      <g className="frog-sprite__body">
        <path
          d="M22 72c-9 1-15 7-17 16 11 3 22 1 30-6M98 72c9 1 15 7 17 16-11 3-22 1-30-6"
          fill="#55B84B"
          stroke="#16261B"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <ellipse
          cx="60"
          cy="62"
          rx="39"
          ry="32"
          fill="#62CA52"
          stroke="#16261B"
          strokeWidth="6"
        />
        <ellipse cx="60" cy="72" rx="24" ry="17" fill="#CBEA6A" />
        <circle cx="38" cy="29" r="17" fill="#62CA52" stroke="#16261B" strokeWidth="6" />
        <circle cx="82" cy="29" r="17" fill="#62CA52" stroke="#16261B" strokeWidth="6" />
        <circle cx="38" cy="28" r="8" fill="#FFFDF3" />
        <circle cx="82" cy="28" r="8" fill="#FFFDF3" />
        <circle cx="40" cy="29" r="4.5" fill="#16261B" />
        <circle cx="80" cy="29" r="4.5" fill="#16261B" />
        <circle cx="44" cy="51" r="3" fill="#318E42" />
        <circle cx="76" cy="51" r="3" fill="#318E42" />
        <path
          d="M43 59c5 7 12 10 17 10s12-3 17-10"
          stroke="#16261B"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
