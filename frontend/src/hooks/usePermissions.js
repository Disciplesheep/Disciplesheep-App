import { useState, useEffect, useCallback } from 'react';

/**
 * Permissions relevant to a church planter journal PWA:
 *  - notifications  : daily devotional reminders
 *  - camera         : profile photo, document scanning
 *  - microphone     : voice prayer notes
 *  - geolocation    : location tagging for ministry visits
 *  - persistent-storage : prevent browser from clearing localStorage data
 */

const PERMISSION_DEFS = [
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Daily devotional reminders & prayer alerts',
    emoji: '🔔',
    apiName: 'notifications',          // PermissionAPI name
  },
  {
    id: 'camera',
    label: 'Camera',
    description: 'Profile photo & document scanning',
    emoji: '📷',
    apiName: 'camera',
  },
  {
    id: 'microphone',
    label: 'Microphone',
    description: 'Voice prayer & journal notes',
    emoji: '🎙️',
    apiName: 'microphone',
  },
  {
    id: 'geolocation',
    label: 'Location',
    description: 'Tag ministry visits & outreach locations',
    emoji: '📍',
    apiName: 'geolocation',
  },
  {
    id: 'persistent-storage',
    label: 'Persistent Storage',
    description: 'Protect journal data from being auto-cleared',
    emoji: '💾',
    apiName: 'persistent-storage',
  },
];

// 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported'
const initialState = () =>
  Object.fromEntries(PERMISSION_DEFS.map(p => [p.id, 'unknown']));

const usePermissions = () => {
  const [statuses, setStatuses] = useState(initialState);

  /* ── Query current status without prompting ─────────────────────────── */
  const queryAll = useCallback(async () => {
    const next = { ...initialState() };

    for (const def of PERMISSION_DEFS) {
      try {
        if (def.id === 'persistent-storage') {
          if (navigator.storage?.persisted) {
            const persisted = await navigator.storage.persisted();
            next[def.id] = persisted ? 'granted' : 'prompt';
          } else {
            next[def.id] = 'unsupported';
          }
          continue;
        }

        if (def.id === 'notifications') {
          if (!('Notification' in window)) { next[def.id] = 'unsupported'; continue; }
          next[def.id] = Notification.permission === 'default' ? 'prompt' : Notification.permission;
          continue;
        }

        if (navigator.permissions?.query) {
          try {
            const result = await navigator.permissions.query({ name: def.apiName });
            next[def.id] = result.state; // 'granted' | 'denied' | 'prompt'
            // Live updates when user changes permission in browser settings
            result.onchange = () =>
              setStatuses(prev => ({ ...prev, [def.id]: result.state }));
          } catch {
            next[def.id] = 'unknown';
          }
        } else {
          next[def.id] = 'unknown';
        }
      } catch {
        next[def.id] = 'unknown';
      }
    }

    setStatuses(next);
  }, []);

  useEffect(() => { queryAll(); }, [queryAll]);

  /* ── Request a specific permission ──────────────────────────────────── */
  const request = useCallback(async (id) => {
    setStatuses(prev => ({ ...prev, [id]: 'unknown' })); // show loading

    try {
      if (id === 'notifications') {
        if (!('Notification' in window)) {
          setStatuses(prev => ({ ...prev, [id]: 'unsupported' }));
          return 'unsupported';
        }
        const result = await Notification.requestPermission();
        const mapped = result === 'default' ? 'prompt' : result;
        setStatuses(prev => ({ ...prev, [id]: mapped }));
        return mapped;
      }

      if (id === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        setStatuses(prev => ({ ...prev, [id]: 'granted' }));
        return 'granted';
      }

      if (id === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setStatuses(prev => ({ ...prev, [id]: 'granted' }));
        return 'granted';
      }

      if (id === 'geolocation') {
        await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
        );
        setStatuses(prev => ({ ...prev, [id]: 'granted' }));
        return 'granted';
      }

      if (id === 'persistent-storage') {
        if (!navigator.storage?.persist) {
          setStatuses(prev => ({ ...prev, [id]: 'unsupported' }));
          return 'unsupported';
        }
        const granted = await navigator.storage.persist();
        const status  = granted ? 'granted' : 'denied';
        setStatuses(prev => ({ ...prev, [id]: status }));
        return status;
      }
    } catch (err) {
      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.code === 1 || // GeolocationPositionError.PERMISSION_DENIED
        err?.message?.toLowerCase().includes('denied');
      const status = isDenied ? 'denied' : 'unknown';
      setStatuses(prev => ({ ...prev, [id]: status }));
      return status;
    }
  }, []);

  return { statuses, request, refresh: queryAll, defs: PERMISSION_DEFS };
};

export default usePermissions;
export { PERMISSION_DEFS };