/* Digital Hub Stage 16.3 — Visitor and download analytics */
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
    if (!client || !client.supabaseUrl || !client.supabaseKey) return;

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

    const endpoint =
      client.supabaseUrl.replace(/\/+$/, '') +
      '/rest/v1/rpc/record_hub_analytics_event';

    const apiKey = client.supabaseKey;

    function recordEvent(eventType, contentId = null) {
      const payload = {
        p_visitor_id: visitorId,
        p_session_id: sessionId,
        p_event_type: eventType,
        p_page_key: pageKey,
        p_content_id: contentId,
        p_duration_seconds: null
      };

      fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(async response => {
          const result = await response.text();

          if (!response.ok || result !== 'true') {
            console.warn(
              'Digital Hub analytics unavailable:',
              response.status,
              result
            );
          }
        })
        .catch(error => {
          console.warn(
            'Digital Hub analytics network error:',
            error
          );
        });
    }

    // Record the current page visit.
    recordEvent('page_view');

    // Track actual download-link clicks without blocking downloads.
    document.addEventListener('click', event => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      const link = target.closest('a[data-download]');

      if (!link) return;

      const contentId = (link.dataset.download || '').trim();
      const downloadUrl = (link.getAttribute('href') || '').trim();

      if (!contentId || !downloadUrl) return;

      recordEvent('download_click', contentId);
    });
  }

  window.DigitalHubAnalytics = {
    initialise
  };
})();
