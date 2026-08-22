import browser from 'webextension-polyfill';
import { SettingsRepository } from '../settings-repository';
import { syncSubscription } from '../subscription';

const SUBSCRIPTION_ALARM_NAME = 'subscription-sync';
const SUBSCRIPTION_ALARM_PERIOD_MINUTES = 360; // 6 hours

/**
 * Registers the subscription sync alarm and its handler.
 * Separated from message handlers so new alarm types can be added
 * without touching the message routing code.
 */
export function registerAlarms(settingsRepo: SettingsRepository): void {
  // Create the recurring sync alarm if not already registered
  browser.alarms.create(SUBSCRIPTION_ALARM_NAME, {
    periodInMinutes: SUBSCRIPTION_ALARM_PERIOD_MINUTES,
  });

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === SUBSCRIPTION_ALARM_NAME) {
      await handleSubscriptionSyncAlarm(settingsRepo);
    }
  });
}

async function handleSubscriptionSyncAlarm(settingsRepo: SettingsRepository): Promise<void> {
  try {
    const url = await settingsRepo.get('subscriptionUrl');
    if (url) {
      console.log('[Alarm] Auto-syncing subscription:', url);
      await syncSubscription(url, globalThis.fetch.bind(globalThis), settingsRepo);
    }
  } catch (error) {
    console.error('[Alarm] Subscription auto-sync failed:', error);
  }
}
