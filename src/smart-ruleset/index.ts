export interface SmartRuleset {
  matches(domain: string): boolean;
}

export function createSmartRuleset(domains: string[]): SmartRuleset {
  const set = new Set(domains);
  return {
    matches(domain: string): boolean {
      if (set.has(domain)) return true;
      const parts = domain.split('.');
      for (let i = 1; i < parts.length; i++) {
        const parent = parts.slice(i).join('.');
        if (set.has('*.' + parent)) return true;
        if (set.has(parent)) return true;
      }
      return false;
    }
  };
}

let _builtIn: SmartRuleset | null = null;

export function getBuiltInRuleset(): SmartRuleset {
  if (!_builtIn) {
    const domains = [
      'rutracker.org', '*.rutracker.org',
      'reddit.com', '*.reddit.com',
      'twitter.com', '*.twitter.com', 'x.com', '*.x.com',
      'youtube.com', '*.youtube.com',
      'instagram.com', '*.instagram.com',
      'facebook.com', '*.facebook.com',
      'tiktok.com', '*.tiktok.com',
      'discord.com', '*.discord.com',
      'telegram.org', '*.telegram.org',
      'wikipedia.org', '*.wikipedia.org',
      'github.com', '*.github.com',
      'openai.com', '*.openai.com',
    ];
    _builtIn = createSmartRuleset(domains);
  }
  return _builtIn;
}
