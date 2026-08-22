import { RoutingMode, RoutingRule } from './types';
import { SmartRuleset } from './smart-ruleset';

// Simple glob to regex matching
export function matchPattern(urlDomain: string, pattern: string): boolean {
  // If exact match (including exact IPs)
  if (urlDomain === pattern) return true;
  // If pattern starts with *. e.g. *.example.com matches sub.example.com and example.com
  if (pattern.startsWith('*.')) {
    const baseDomain = pattern.slice(2);
    if (urlDomain === baseDomain || urlDomain.endsWith('.' + baseDomain)) {
      return true;
    }
  }
  return false;
}

export function evaluateRouting(
  url: string,
  rules: RoutingRule[],
  mode: RoutingMode,
  smartRuleset?: SmartRuleset
): 'PROXY' | 'DIRECT' {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;

    // Always bypass local and extension (Firefox exclusively)
    if (
      domain === 'localhost' || 
      domain === '127.0.0.1' || 
      domain === '::1' || 
      domain === '[::1]' ||
      domain.endsWith('.localhost') ||
      url.startsWith('moz-extension://')
    ) {
      return 'DIRECT';
    }

    if (mode === 'Global') {
      return 'PROXY';
    }

    if (mode === 'Custom') {
      const shouldProxy = rules.some(r => matchPattern(domain, r.pattern));
      return shouldProxy ? 'PROXY' : 'DIRECT';
    }

    if (mode === 'Smart') {
      if (smartRuleset && smartRuleset.matches(domain)) return 'PROXY';
      return 'DIRECT';
    }

  } catch (e) {
    console.error(`Error parsing URL during evaluateRouting for ${url}:`, e);
    return 'DIRECT';
  }

  return 'DIRECT';
}

