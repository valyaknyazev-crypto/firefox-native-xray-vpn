import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import {
  TowerIcon,
  ZapIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  ShieldIcon,
  AlertCircleIcon,
  AlertIcon,
  ClockIcon,
  RefreshCwIcon,
  RefreshIcon,
  CompassIcon,
  SettingsIcon,
  TrashIcon,
  ExternalLinkIcon,
  RadioDotIcon,
  CheckIcon,
  SignalBarsIcon,
  ChevronDownIcon,
  ActivityIcon,
  PulseIcon,
  XIcon,
  CloseIcon,
  PlusIcon,
  AddIcon,
} from './Icons';

describe('Icons Module', () => {
  const allIcons: Array<{ name: string; Component: React.FC<any> }> = [
    { name: 'TowerIcon', Component: TowerIcon },
    { name: 'ZapIcon', Component: ZapIcon },
    { name: 'ShieldCheckIcon', Component: ShieldCheckIcon },
    { name: 'ShieldAlertIcon', Component: ShieldAlertIcon },
    { name: 'ShieldIcon', Component: ShieldIcon },
    { name: 'AlertCircleIcon', Component: AlertCircleIcon },
    { name: 'AlertIcon', Component: AlertIcon },
    { name: 'ClockIcon', Component: ClockIcon },
    { name: 'RefreshCwIcon', Component: RefreshCwIcon },
    { name: 'RefreshIcon', Component: RefreshIcon },
    { name: 'CompassIcon', Component: CompassIcon },
    { name: 'SettingsIcon', Component: SettingsIcon },
    { name: 'TrashIcon', Component: TrashIcon },
    { name: 'ExternalLinkIcon', Component: ExternalLinkIcon },
    { name: 'RadioDotIcon', Component: RadioDotIcon },
    { name: 'CheckIcon', Component: CheckIcon },
    { name: 'SignalBarsIcon', Component: SignalBarsIcon },
    { name: 'ChevronDownIcon', Component: ChevronDownIcon },
    { name: 'ActivityIcon', Component: ActivityIcon },
    { name: 'PulseIcon', Component: PulseIcon },
    { name: 'XIcon', Component: XIcon },
    { name: 'CloseIcon', Component: CloseIcon },
    { name: 'PlusIcon', Component: PlusIcon },
    { name: 'AddIcon', Component: AddIcon },
  ];

  describe('Standard Icon Rendering & Default Attributes', () => {
    allIcons.forEach(({ name, Component }) => {
      it(`renders ${name} with valid default SVG markup`, () => {
        const html = renderToString(<Component />);
        expect(html).toContain('<svg');
        expect(html).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(html).toContain('viewBox="0 0 24 24"');
        expect(html).toContain('width="16"');
        expect(html).toContain('height="16"');
        expect(html).toContain('fill="none"');
        expect(html).toContain('stroke="currentColor"');
        expect(html).toContain('stroke-width="2"');
        expect(html).toContain('stroke-linecap="round"');
        expect(html).toContain('stroke-linejoin="round"');
      });

      it(`applies custom numeric size to ${name}`, () => {
        const html = renderToString(<Component size={28} />);
        expect(html).toContain('width="28"');
        expect(html).toContain('height="28"');
      });

      it(`applies custom string size to ${name}`, () => {
        const html = renderToString(<Component size="1.5rem" />);
        expect(html).toContain('width="1.5rem"');
        expect(html).toContain('height="1.5rem"');
      });

      it(`applies custom stroke color to ${name}`, () => {
        const html = renderToString(<Component color="#38bdf8" />);
        expect(html).toContain('stroke="#38bdf8"');
      });

      it(`applies custom strokeWidth to ${name}`, () => {
        const html = renderToString(<Component strokeWidth={1.5} />);
        expect(html).toContain('stroke-width="1.5"');
      });

      it(`passes className, style, and HTML/SVG attributes to ${name}`, () => {
        const html = renderToString(
          <Component
            className="test-class-name"
            style={{ display: 'inline-block' }}
            aria-hidden="true"
            data-testid={`icon-${name}`}
          />
        );
        expect(html).toContain('class="test-class-name"');
        expect(html).toContain('style="display:inline-block"');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain(`data-testid="icon-${name}"`);
      });
    });
  });

  describe('SignalBarsIcon tier levels', () => {
    it('renders all 3 bars active for high level or default', () => {
      const htmlDefault = renderToString(<SignalBarsIcon />);
      const htmlHigh = renderToString(<SignalBarsIcon level="high" />);
      const htmlUpperHigh = renderToString(<SignalBarsIcon level={"HIGH" as any} />);
      const htmlTier3 = renderToString(<SignalBarsIcon level={3} />);

      // For high / default, none of the 3 lines have opacity="0.25"
      expect(htmlDefault).not.toContain('opacity="0.25"');
      expect(htmlHigh).not.toContain('opacity="0.25"');
      expect(htmlUpperHigh).not.toContain('opacity="0.25"');
      expect(htmlTier3).not.toContain('opacity="0.25"');
    });

    it('renders 2 bars active and 1 bar dimmed for med / medium level', () => {
      const htmlMed = renderToString(<SignalBarsIcon level="med" />);
      const htmlMedium = renderToString(<SignalBarsIcon level="medium" />);
      const htmlUpperMed = renderToString(<SignalBarsIcon level={"MED" as any} />);
      const htmlTier2 = renderToString(<SignalBarsIcon level={2} />);

      // Bar 3 should be dimmed with opacity 0.25
      expect(htmlMed).toContain('opacity="0.25"');
      expect(htmlMedium).toContain('opacity="0.25"');
      expect(htmlUpperMed).toContain('opacity="0.25"');
      expect(htmlTier2).toContain('opacity="0.25"');

      // Count occurrences of opacity="0.25" -> exactly 1 line
      expect((htmlMed.match(/opacity="0\.25"/g) || []).length).toBe(1);
      expect((htmlMedium.match(/opacity="0\.25"/g) || []).length).toBe(1);
      expect((htmlUpperMed.match(/opacity="0\.25"/g) || []).length).toBe(1);
      expect((htmlTier2.match(/opacity="0\.25"/g) || []).length).toBe(1);
    });

    it('renders 1 bar active and 2 bars dimmed for low level', () => {
      const htmlLow = renderToString(<SignalBarsIcon level="low" />);
      const htmlUpperLow = renderToString(<SignalBarsIcon level={"LOW" as any} />);
      const htmlTier1 = renderToString(<SignalBarsIcon level={1} />);

      expect((htmlLow.match(/opacity="0\.25"/g) || []).length).toBe(2);
      expect((htmlUpperLow.match(/opacity="0\.25"/g) || []).length).toBe(2);
      expect((htmlTier1.match(/opacity="0\.25"/g) || []).length).toBe(2);
    });

    it('renders all 3 bars dimmed for off / none / 0 / unknown level', () => {
      const htmlOff = renderToString(<SignalBarsIcon level="off" />);
      const htmlNone = renderToString(<SignalBarsIcon level="none" />);
      const htmlTier0 = renderToString(<SignalBarsIcon level={0} />);
      const htmlUnknown = renderToString(<SignalBarsIcon level={"unknown" as any} />);

      expect((htmlOff.match(/opacity="0\.25"/g) || []).length).toBe(3);
      expect((htmlNone.match(/opacity="0\.25"/g) || []).length).toBe(3);
      expect((htmlTier0.match(/opacity="0\.25"/g) || []).length).toBe(3);
      expect((htmlUnknown.match(/opacity="0\.25"/g) || []).length).toBe(3);
    });
  });

  describe('RadioDotIcon active state', () => {
    it('renders inner dot when active is true (default)', () => {
      const html = renderToString(<RadioDotIcon />);
      // Outer ring r="9", inner dot r="4.5"
      expect(html).toContain('r="9"');
      expect(html).toContain('r="4.5"');
      expect(html).toContain('fill="currentColor"');
    });

    it('renders inner dot when active is explicitly true', () => {
      const html = renderToString(<RadioDotIcon active={true} />);
      expect(html).toContain('r="9"');
      expect(html).toContain('r="4.5"');
    });

    it('renders inner dot with custom color when specified', () => {
      const html = renderToString(<RadioDotIcon color="#10b981" />);
      expect(html).toContain('fill="#10b981"');
    });

    it('omits inner dot when active is false', () => {
      const html = renderToString(<RadioDotIcon active={false} />);
      expect(html).toContain('r="9"');
      expect(html).not.toContain('r="4.5"');
    });
  });

  describe('Specific Icon Structure Verification', () => {
    it('TowerIcon contains radio mast and transmission waves', () => {
      const html = renderToString(<TowerIcon />);
      expect(html).toContain('<circle');
      expect(html).toContain('<path');
    });

    it('ZapIcon contains lightning polygon', () => {
      const html = renderToString(<ZapIcon />);
      expect(html).toContain('<polygon');
    });

    it('ShieldCheckIcon contains shield path and checkmark path', () => {
      const html = renderToString(<ShieldCheckIcon />);
      expect(html).toContain('d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"');
      expect(html).toContain('d="m9 12 2 2 4-4"');
    });

    it('ShieldAlertIcon contains shield path and warning lines', () => {
      const html = renderToString(<ShieldAlertIcon />);
      expect(html).toContain('d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"');
      expect(html).toContain('<line');
    });

    it('ShieldIcon contains base shield outline without checkmark or lines', () => {
      const html = renderToString(<ShieldIcon />);
      expect(html).toContain('d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"');
      expect(html).not.toContain('d="m9 12 2 2 4-4"');
      expect(html).not.toContain('<line');
    });

    it('AlertCircleIcon and AlertIcon alias contain alert circle and warning line', () => {
      const htmlCircle = renderToString(<AlertCircleIcon />);
      const htmlAlert = renderToString(<AlertIcon />);
      expect(htmlCircle).toContain('r="10"');
      expect(htmlCircle).toContain('<line x1="12" y1="8" x2="12" y2="12"');
      expect(htmlAlert).toBe(htmlCircle);
    });

    it('TrashIcon contains trash lid and bin lines', () => {
      const html = renderToString(<TrashIcon />);
      expect(html).toContain('d="M3 6h18"');
      expect(html).toContain('x1="10"');
      expect(html).toContain('x1="14"');
    });

    it('SettingsIcon contains center gear circle and teeth path', () => {
      const html = renderToString(<SettingsIcon />);
      expect(html).toContain('r="3"');
      expect(html).toContain('<path');
    });

    it('ExternalLinkIcon contains box and arrow elements', () => {
      const html = renderToString(<ExternalLinkIcon />);
      expect(html).toContain('<polyline');
      expect(html).toContain('<line');
    });

    it('CheckIcon contains checkmark polyline', () => {
      const html = renderToString(<CheckIcon />);
      expect(html).toContain('<polyline points="20 6 9 17 4 12"');
    });

    it('CompassIcon contains compass ring and needle polygon', () => {
      const html = renderToString(<CompassIcon />);
      expect(html).toContain('r="10"');
      expect(html).toContain('<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"');
    });

    it('ClockIcon contains clock face and hands', () => {
      const html = renderToString(<ClockIcon />);
      expect(html).toContain('r="10"');
      expect(html).toContain('<polyline points="12 6 12 12 16 14"');
    });

    it('RefreshCwIcon and RefreshIcon alias contain circular arrows', () => {
      const htmlCw = renderToString(<RefreshCwIcon />);
      const htmlRef = renderToString(<RefreshIcon />);
      expect(htmlCw).toContain('d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"');
      expect(htmlRef).toBe(htmlCw);
    });

    it('ChevronDownIcon contains downward chevron polyline', () => {
      const html = renderToString(<ChevronDownIcon />);
      expect(html).toContain('<polyline points="6 9 12 15 18 9"');
    });

    it('ActivityIcon and PulseIcon alias contain left-to-right pulse polyline', () => {
      const htmlAct = renderToString(<ActivityIcon />);
      const htmlPulse = renderToString(<PulseIcon />);
      expect(htmlAct).toContain('<polyline points="2 12 6 12 9 3 15 21 18 12 22 12"');
      expect(htmlPulse).toBe(htmlAct);
    });
  });
});
