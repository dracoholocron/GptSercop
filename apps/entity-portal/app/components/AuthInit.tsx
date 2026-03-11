'use client';

import { useEffect } from 'react';
import { setToken } from '@sercop/api-client';
import { getToken } from '../lib/auth';

export function AuthInit() {
  useEffect(() => {
    const t = getToken();
    if (t) setToken(t);
  }, []);
  return null;
}
