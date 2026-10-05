'use client';

import React, { useEffect, useState } from 'react';
import { getCachedAdSettings, subscribeToAdSettings, AdSettings } from '../lib/ad-manager';

export function AdSenseScript() {
  const [settings, setSettings] = useState<AdSettings>(() => getCachedAdSettings());

  useEffect(() => {
    const unsubscribe = subscribeToAdSettings((newSettings) => {
      setSettings(newSettings);
    });
    return unsubscribe;
  }, []);

  const publisherId = settings.adsense?.publisherId?.trim();
  const isEnabled = settings.enabled && settings.adsense?.enabled && publisherId;

  useEffect(() => {
    if (!isEnabled || !publisherId) return;

    // Check if script already exists in document
    const scriptId = 'google-adsense-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

    return () => {
      // Keep script cached once injected for performance
    };
  }, [isEnabled, publisherId]);

  return null;
}
