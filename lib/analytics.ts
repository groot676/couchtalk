// Add gtag to the window interface
declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      parameters?: {
        event_category?: string;
        event_label?: string;
        value?: number;
      }
    ) => void;
  }
}

// Helper function to track events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Specific tracking functions for your app
export const trackMessageSent = () => {
  trackEvent('message_sent', 'engagement');
};

export const trackConversationStarted = () => {
  trackEvent('conversation_started', 'engagement');
};

export const trackConversationCleared = () => {
  trackEvent('conversation_cleared', 'engagement');
};

export const trackError = (error: string) => {
  trackEvent('error', 'technical', error);
};