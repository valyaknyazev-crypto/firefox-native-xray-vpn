import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export interface IconBaseProps extends IconProps {
  children?: React.ReactNode;
}

/**
 * IconBase — Unified SVG envelope wrapper eliminating repeated boilerplate.
 */
export const IconBase: React.FC<IconBaseProps> = ({
  size = 16,
  color = 'currentColor',
  strokeWidth = 2,
  className,
  style,
  children,
  ...props
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    {...props}
  >
    {children}
  </svg>
);

/**
 * TowerIcon — represents proxy servers / broadcast tower.
 */
export const TowerIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M4.9 16.1a10 10 0 0 1 0-14.2" />
    <path d="M7.8 13.2a6 6 0 0 1 0-8.4" />
    <circle cx="12" cy="9" r="2" />
    <path d="M12 11v11" />
    <path d="m8 22 4-11 4 11" />
    <path d="m9 17 6 0" />
    <path d="M16.2 4.8a6 6 0 0 1 0 8.4" />
    <path d="M19.1 1.9a10 10 0 0 1 0 14.2" />
  </IconBase>
);

/**
 * ZapIcon — represents ping, latency, and speed probes.
 */
export const ZapIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </IconBase>
);

/**
 * ShieldCheckIcon — represents active, protected VPN connection.
 */
export const ShieldCheckIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </IconBase>
);

/**
 * ShieldAlertIcon — represents disconnected or unsecured status.
 */
export const ShieldAlertIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </IconBase>
);

/**
 * ShieldIcon — base shield indicator.
 */
export const ShieldIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </IconBase>
);

/**
 * AlertCircleIcon — represents errors, warnings, and alerts.
 */
export const AlertCircleIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </IconBase>
);

export const AlertIcon = AlertCircleIcon;

/**
 * ClockIcon — represents last sync timestamp and temporal metrics.
 */
export const ClockIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </IconBase>
);

/**
 * RefreshCwIcon — represents syncing, reloading, and rotating refresh actions.
 */
export const RefreshCwIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </IconBase>
);

export const RefreshIcon = RefreshCwIcon;

/**
 * CompassIcon — represents traffic routing modes and directional navigation.
 */
export const CompassIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </IconBase>
);

/**
 * SettingsIcon — represents configuration and options settings.
 */
export const SettingsIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </IconBase>
);

/**
 * TrashIcon — represents item deletion (e.g., custom routing rules).
 */
export const TrashIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </IconBase>
);

/**
 * ExternalLinkIcon — represents external outbound links.
 */
export const ExternalLinkIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </IconBase>
);

export interface RadioDotIconProps extends IconProps {
  active?: boolean;
}

/**
 * RadioDotIcon — active status indicator or radio button marker.
 */
export const RadioDotIcon: React.FC<RadioDotIconProps> = ({
  color = 'currentColor',
  active = true,
  ...props
}) => (
  <IconBase color={color} {...props}>
    <circle cx="12" cy="12" r="9" />
    {active && (
      <circle
        cx="12"
        cy="12"
        r="4.5"
        fill={color}
        stroke="none"
      />
    )}
  </IconBase>
);

/**
 * CheckIcon — represents success confirmation and verified checks.
 */
export const CheckIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="20 6 9 17 4 12" />
  </IconBase>
);

export type SignalLevel = 'low' | 'med' | 'medium' | 'high' | 'off' | 'none' | 0 | 1 | 2 | 3;

export interface SignalBarsIconProps extends IconProps {
  level?: SignalLevel;
}

/**
 * SignalBarsIcon — 3-tier latency and network signal indicator (low, med, high).
 */
export const SignalBarsIcon: React.FC<SignalBarsIconProps> = ({
  level = 'high',
  ...props
}) => {
  const normalized = typeof level === 'string' ? level.toLowerCase() : level;
  const numericLevel =
    normalized === 'high' || normalized === 3
      ? 3
      : normalized === 'med' || normalized === 'medium' || normalized === 2
      ? 2
      : normalized === 'low' || normalized === 1
      ? 1
      : 0;

  return (
    <IconBase {...props}>
      <line
        x1="5"
        y1="19"
        x2="5"
        y2="14"
        opacity={numericLevel >= 1 ? 1 : 0.25}
      />
      <line
        x1="12"
        y1="19"
        x2="12"
        y2="9"
        opacity={numericLevel >= 2 ? 1 : 0.25}
      />
      <line
        x1="19"
        y1="19"
        x2="19"
        y2="4"
        opacity={numericLevel >= 3 ? 1 : 0.25}
      />
    </IconBase>
  );
};

/**
 * ChevronDownIcon — represents dropdown and accordion toggles.
 */
export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="6 9 12 15 18 9" />
  </IconBase>
);

/**
 * ActivityIcon / PulseIcon — represents activity, network traffic pulses.
 */
export const ActivityIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <polyline points="2 12 6 12 9 3 15 21 18 12 22 12" />
  </IconBase>
);

export const PulseIcon = ActivityIcon;

/**
 * XIcon — close / dismiss / remove action.
 */
export const XIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </IconBase>
);

export const CloseIcon = XIcon;

/**
 * PlusIcon / AddIcon — represents create, add, or append action.
 */
export const PlusIcon: React.FC<IconProps> = (props) => (
  <IconBase {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </IconBase>
);

export const AddIcon = PlusIcon;
