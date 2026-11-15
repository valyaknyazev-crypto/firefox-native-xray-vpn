import React from 'react';
import {
  AlertCircleIcon,
  ShieldAlertIcon,
  CheckIcon,
  ZapIcon,
  XIcon,
} from './Icons';

export type NoticeType = 'error' | 'warning' | 'info' | 'success';

export interface NoticeAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface NoticeBannerProps {
  type?: NoticeType;
  title?: string;
  message: string;
  action?: NoticeAction;
  onDismiss?: () => void;
  autoDismissMs?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * NoticeBanner — Sleek inline alert/notice banner with dismiss action,
 * optional self-dismissing timeout, and contextual links. Eliminates disruptive
 * native browser modal dialogs.
 */
export const NoticeBanner: React.FC<NoticeBannerProps> = ({
  type = 'error',
  title,
  message,
  action,
  onDismiss,
  autoDismissMs,
  className = '',
  style,
}) => {
  React.useEffect(() => {
    if (autoDismissMs && autoDismissMs > 0 && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, onDismiss]);

  const renderIcon = () => {
    switch (type) {
      case 'warning':
        return <ShieldAlertIcon size={16} className="notice-icon notice-icon-warning" />;
      case 'success':
        return <CheckIcon size={16} className="notice-icon notice-icon-success" />;
      case 'info':
        return <ZapIcon size={16} className="notice-icon notice-icon-info" />;
      case 'error':
      default:
        return <AlertCircleIcon size={16} className="notice-icon notice-icon-error" />;
    }
  };

  const role = type === 'error' || type === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`notice-banner notice-banner-${type} ${className}`.trim()}
      style={style}
    >
      <div className="notice-banner-body">
        <span className="notice-icon-container" aria-hidden="true">
          {renderIcon()}
        </span>

        <div className="notice-text-content">
          {title && <div className="notice-title">{title}</div>}
          <div className="notice-message">{message}</div>

          {action && (
            <div className="notice-action-container">
              {action.href ? (
                <a
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="notice-action-link"
                  onClick={action.onClick}
                >
                  {action.label}
                </a>
              ) : (
                <button
                  type="button"
                  className="notice-action-btn"
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              )}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            className="notice-dismiss-btn"
            onClick={onDismiss}
            aria-label="Dismiss notice"
            title="Dismiss"
          >
            <XIcon size={13} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
