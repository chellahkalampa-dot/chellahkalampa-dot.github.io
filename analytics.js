
/* Digital Hub Stage 16.2 — Anonymous visitor analytics */
(() => {
  'use strict';

  const STORAGE_VISITOR = 'digital_hub_visitor_id';
  const STORAGE_SESSION = 'digital_hub_session_id';

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function getOrCreateId(storage, key) {
    try {
      let id = storage.getItem(key);

      if (!id) {
        id = createId();
        storage.setItem(key, id);
      }

      return id;
    } catch (error) {
      return createId();
    }
  }

  function getPageKey() {
    const page = document.body.dataset.page || 'home';

    return page === 'resource' ? 'resources' : page;
  }

  function initialise(client) {
    if (!client || typeof client.rpc !== 'function') return;

    const visitorId = getOrCreateId(
      window.localStorage,
      STORAGE_VISITOR
    );

    const sessionId = getOrCreateId(
      window.sessionStorage,
      STORAGE_SESSION
    );

    const allowedPages = [
      'home',
      'music',
      'metallurgy',
      'technology',
      'resources',
      'album',
      'artist'
    ];

    const pageKey = getPageKey();

    if (!allowedPages.includes(pageKey)) return;

    client.rpc('record_hub_analytics_event', {
      p_visitor_id: visitorId,
      p_session_id: sessionId,
      p_event_type: 'page_view',
      p_page_key: pageKey,
      p_content_id: null,
      p_duration_seconds: null
    }).then(({ error }) => {
      if (error) {
        console.warn('Digital Hub analytics unavailable:', error.message);
      }
    }).catch(() => {
      // Analytics failures must not interrupt the website.
    });
  }

  window.DigitalHubAnalytics = {
    initialise
  };
})();
