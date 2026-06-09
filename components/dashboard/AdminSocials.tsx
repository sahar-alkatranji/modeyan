import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { SocialLink } from '../../types';
import { api } from '../../services/api';
import { glassCardClass, glassButtonClass } from './DashboardShared';

interface AdminSocialsProps {
  socialLinks: SocialLink[];
  setSocialLinks: React.Dispatch<React.SetStateAction<SocialLink[]>>;
}

export const AdminSocials: React.FC<AdminSocialsProps> = ({ socialLinks, setSocialLinks }) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  // Safe Immutable Handler for updating URL strings (H-13)
  const handleUrlChange = (idx: number, newUrl: string) => {
    setSocialLinks(prev =>
      prev.map((link, i) => (i === idx ? { ...link, href: newUrl } : link))
    );
  };

  // Safe Immutable Handler for toggling status (H-13)
  const handleToggleEnabled = (idx: number) => {
    setSocialLinks(prev =>
      prev.map((link, i) => (i === idx ? { ...link, isEnabled: !link.isEnabled } : link))
    );
  };

  // Validate Link Structure (H-14)
  const validateUrl = (url: string): boolean => {
    if (!url) return true; // empty link is fine (or treated as unconfigured)
    try {
      // Check if it's a valid website structure
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.length > 3;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    // Validate all active URLs first (H-14)
    const invalidLinks = socialLinks.filter(l => l.isEnabled && !validateUrl(l.href));
    if (invalidLinks.length > 0) {
      const names = invalidLinks.map(l => l.name).join(', ');
      alert(`${t('admin_socials_invalid_links' as any) || 'Invalid link structure detected for:'} ${names}. ${t('admin_socials_valid_urls_needed' as any) || 'Please input valid URLs starting with http:// or https://'}`);
      return;
    }

    setIsSaving(true);
    try {
      const payload = socialLinks.map(l => ({
        name: l.name,
        href: l.href,
        is_enabled: l.isEnabled,
      }));
      await api.updateSocialLinks(payload);
      alert(t('admin_socials_success'));
    } catch (err: any) {
      alert(err.message || 'Failed to update social channels links');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in text-start">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-white mb-1">{t('admin_socials_title')}</h2>
        <p className="text-sm text-gray-300">{t('admin_socials_subtitle')}</p>
      </div>

      <div className={glassCardClass + " p-6 max-w-2xl"}>
        <div className="space-y-6">
          {socialLinks.map((link, idx) => {
            const isUrlValid = validateUrl(link.href);
            return (
              <div
                key={link.name}
                className="flex items-center gap-4 pb-4 border-b last:border-0 border-white/10"
              >
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-center justify-center">
                  {link.icon ? (
                    <span className="w-5 h-5 flex items-center justify-center">{link.icon}</span>
                  ) : (
                    <span className="w-5 h-5 flex items-center justify-center text-sm font-bold uppercase text-brand-gold">
                      {link.name.slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs uppercase tracking-widest text-white mb-1.5">
                    {link.name}
                  </p>
                  <input
                    type="text"
                    value={link.href}
                    onChange={e => handleUrlChange(idx, e.target.value)}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-all ${
                      !isUrlValid && link.isEnabled
                        ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                        : 'border-white/10 focus:border-white focus:ring-white'
                    }`}
                    placeholder="https://instagram.com/profile"
                  />
                  {!isUrlValid && link.isEnabled && (
                    <span className="text-xs text-red-400 mt-1 block">
                      {t('admin_socials_invalid_url_hint' as any) || 'Please enter a valid URL (e.g. https://domain.com)'}
                    </span>
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer scale-75 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={link.isEnabled}
                    onChange={() => handleToggleEnabled(idx)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={glassButtonClass + " mt-8 disabled:opacity-50"}
        >
          {isSaving ? t('wallet_processing') : t('admin_socials_save')}
        </button>
      </div>
    </div>
  );
};
