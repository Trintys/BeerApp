/// <reference lib="webworker" />
// The app's one service worker (vite-plugin-pwa, injectManifest mode).
// For now: cache the app so it opens without signal. Push notifications
// ("recap ready") get added here in a later step.

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

// Replaced at build time with the list of app files to cache.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Any page (e.g. /join?code=…) opens the cached app when offline.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// A new version takes over as soon as it's installed.
self.addEventListener('install', () => void self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
