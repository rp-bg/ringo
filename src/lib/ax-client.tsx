'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import type { AXReact } from '@appxiom/4react';
import packageJson from '../../package.json';
import buildInfo from '../../build-info.json';

let axInstance: AXReact | null = null;
let initPromise: Promise<AXReact | null> | null = null;

export const initAX = async (): Promise<AXReact | null> => {
  if (typeof window === 'undefined') return null;
  if (axInstance) return axInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { default: init } = await import('@appxiom/4react');
      const appKey = process.env.NEXT_PUBLIC_APPXIOM_APP_KEY;
      const platformKey = process.env.NEXT_PUBLIC_APPXIOM_PLATFORM_KEY;

      if (!appKey || !platformKey) {
        console.warn('Appxiom keys not found in environment variables. Initialization skipped.');
        return null;
      }

      const version =
        process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version || '0.1.0';
      const buildId =
        process.env.NEXT_PUBLIC_BUILD_ID || String(buildInfo.buildNumber || '1');

      const instance = await init(appKey, platformKey, version, buildId);
      axInstance = instance;
      if (typeof window !== 'undefined') {
        (window as unknown as { ax: AXReact }).ax = instance;
      }
      return instance;
    } catch (err) {
      console.warn('Appxiom 4React initialization notice:', err);
      return null;
    }
  })();

  return initPromise;
};

export const getAXInstance = (): AXReact | null => {
  return axInstance;
};

const AXContext = createContext<AXReact | null>(null);

export function AXProvider({ children }: { children: React.ReactNode }) {
  const [ax, setAx] = useState<AXReact | null>(null);

  useEffect(() => {
    let mounted = true;
    initAX().then(inst => {
      if (mounted && inst) {
        setAx(inst);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return <AXContext.Provider value={ax}>{children}</AXContext.Provider>;
}

export const useAX = () => {
  return useContext(AXContext);
};
