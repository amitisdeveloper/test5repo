import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../utils/api';

const HEARTBEAT_INTERVAL_MS = 15000;
const SESSION_STORAGE_KEY = 'admin_presence_session_id';

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `admin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getSessionId = () => {
  const existingSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = createSessionId();
  sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
};

export function useAdminPresence(page: string) {
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const pageRef = useRef(page);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    const sessionId = getSessionId();
    let isDisposed = false;

    const syncPresence = async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/presence/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            sessionId,
            page: pageRef.current
          })
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!isDisposed) {
          setActiveUsers(typeof data.activeUsers === 'number' ? data.activeUsers : 0);
        }
      } catch (error) {
        console.error('Failed to sync admin presence:', error);
      }
    };

    const releasePresence = () => {
      fetch(`${API_BASE}/admin/presence/heartbeat/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        },
        keepalive: true
      }).catch(() => {});
    };

    syncPresence();
    const intervalId = window.setInterval(syncPresence, HEARTBEAT_INTERVAL_MS);
    window.addEventListener('beforeunload', releasePresence);
    window.addEventListener('pagehide', releasePresence);

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
      window.removeEventListener('beforeunload', releasePresence);
      window.removeEventListener('pagehide', releasePresence);
    };
  }, []);

  return activeUsers;
}
