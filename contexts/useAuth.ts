// ✅ Separate file for useAuth hook to fix Vite Fast Refresh HMR warning:
// "Could not Fast Refresh: useAuth export is incompatible"
// Vite requires that files exporting React components do NOT also export hooks.

import { useContext } from 'react';
import { AuthContext } from './AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
