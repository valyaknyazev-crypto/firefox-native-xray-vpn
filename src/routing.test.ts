import { describe, it, expect } from 'vitest';
import { evaluateRouting, matchPattern } from './routing';
import { RoutingRule } from './types';

describe('matchPattern', () => {
  it('matches exact domains and IPs', () => {
    expect(matchPattern('rutracker.org', 'rutracker.org')).toBe(true);
    expect(matchPattern('google.com', 'rutracker.org')).toBe(false);
    expect(matchPattern('192.168.1.1', '192.168.1.1')).toBe(true);
  });

  it('matches wildcard subdomains', () => {
    expect(matchPattern('api.twitter.com', '*.twitter.com')).toBe(true);
    expect(matchPattern('twitter.com', '*.twitter.com')).toBe(true); 
    expect(matchPattern('not-twitter.com', '*.twitter.com')).toBe(false);
  });
});

describe('evaluateRouting', () => {
  const customRules: RoutingRule[] = [{ id: '1', pattern: '*.github.com' }, { id: '2', pattern: '1.1.1.1' }];

  it('always bypasses internal requests and localhosts', () => {
    expect(evaluateRouting('moz-extension://uuid/index.html', [], 'Global')).toBe('DIRECT');
    expect(evaluateRouting('http://localhost:3000', [], 'Global')).toBe('DIRECT');
    expect(evaluateRouting('http://127.0.0.1:8080', [], 'Global')).toBe('DIRECT');
    expect(evaluateRouting('http://[::1]:8080', [], 'Global')).toBe('DIRECT');
    expect(evaluateRouting('http://test.localhost:8080', [], 'Global')).toBe('DIRECT');
  });

  it('Global mode proxies everything else', () => {
    expect(evaluateRouting('https://google.com', [], 'Global')).toBe('PROXY');
  });

  it('Custom mode respects user rules including IPs', () => {
    expect(evaluateRouting('https://github.com/microsoft', customRules, 'Custom')).toBe('PROXY');
    expect(evaluateRouting('https://api.github.com', customRules, 'Custom')).toBe('PROXY');
    expect(evaluateRouting('https://1.1.1.1', customRules, 'Custom')).toBe('PROXY');
    expect(evaluateRouting('https://x.com', customRules, 'Custom')).toBe('DIRECT');
  });

  it('Handles invalid URLs gracefully', () => {
    expect(evaluateRouting('not_a_url', [], 'Global')).toBe('DIRECT');
  });
});

// ---- Smart Mode tests (ticket 07) ----
import { createSmartRuleset } from './smart-ruleset';

describe('evaluateRouting - Smart Mode', () => {
  const stubRuleset = createSmartRuleset(['rutracker.org', '*.rutracker.org', 'reddit.com']);

  it('Smart + domain in ruleset -> PROXY', () => {
    expect(evaluateRouting('https://rutracker.org/forum', [], 'Smart', stubRuleset)).toBe('PROXY');
  });

  it('Smart + subdomain in wildcard ruleset -> PROXY', () => {
    expect(evaluateRouting('https://www.rutracker.org/forum', [], 'Smart', stubRuleset)).toBe('PROXY');
  });

  it('Smart + domain not in ruleset -> DIRECT', () => {
    expect(evaluateRouting('https://google.com', [], 'Smart', stubRuleset)).toBe('DIRECT');
  });

  it('Smart + localhost -> DIRECT (bypass takes priority)', () => {
    expect(evaluateRouting('http://localhost:3000', [], 'Smart', stubRuleset)).toBe('DIRECT');
  });

  it('Smart + 127.0.0.1 -> DIRECT (bypass takes priority)', () => {
    expect(evaluateRouting('http://127.0.0.1:8080', [], 'Smart', stubRuleset)).toBe('DIRECT');
  });

  it('Smart + moz-extension:// -> DIRECT (bypass takes priority)', () => {
    expect(evaluateRouting('moz-extension://uuid/index.html', [], 'Smart', stubRuleset)).toBe('DIRECT');
  });

  it('Smart + no ruleset provided -> DIRECT (safe default)', () => {
    expect(evaluateRouting('https://rutracker.org', [], 'Smart')).toBe('DIRECT');
  });

  it('mode Global after Smart -> PROXY for non-local', () => {
    expect(evaluateRouting('https://google.com', [], 'Global', stubRuleset)).toBe('PROXY');
  });
});
