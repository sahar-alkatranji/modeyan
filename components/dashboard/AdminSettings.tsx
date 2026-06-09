import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { api } from '../../services/api';

interface SettingEntry {
  id: number;
  key: string;
  value: string | null;
  is_secret: boolean;
  updated_at?: string;
}

const AdminSettings: React.FC = () => {
  const { lang } = useTranslation();
  const [settings, setSettings] = useState<SettingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'all' | 'public' | 'secret'>('all');

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAdminSettings();
      setSettings(Array.isArray(data) ? data : []);
      // Initialize edited values
      const vals: Record<string, string> = {};
      (Array.isArray(data) ? data : []).forEach((s: SettingEntry) => {
        vals[s.key] = s.value || '';
      });
      setEditedValues(vals);
    } catch {
      setSettings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleChange = (key: string, newVal: string) => {
    setEditedValues(prev => ({ ...prev, [key]: newVal }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = settings.map(s => ({
        key: s.key,
        value: editedValues[s.key] ?? s.value,
        is_secret: s.is_secret,
      }));
      await api.updateAdminSettings(payload);
      alert(lang === 'ar' ? '✅ تم حفظ الإعدادات' : '✅ Settings saved');
      await loadSettings();
    } catch {
      alert(lang === 'ar' ? '❌ فشل حفظ الإعدادات' : '❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const filtered = settings.filter(s => {
    if (filter === 'public') return !s.is_secret;
    if (filter === 'secret') return s.is_secret;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-serif text-gray-900">
            {lang === 'ar' ? 'إعدادات الموقع' : 'Site Settings'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {lang === 'ar' ? 'إدارة إعدادات المتجر والمفاتيح' : 'Manage store settings and API keys'}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving
            ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...')
            : (lang === 'ar' ? '💾 حفظ الكل' : '💾 Save All')}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'public', 'secret'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? (lang === 'ar' ? 'الكل' : 'All')
              : f === 'public' ? (lang === 'ar' ? 'عام' : 'Public')
              : (lang === 'ar' ? 'سري' : 'Secret')}
          </button>
        ))}
      </div>

      {/* Settings list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">{lang === 'ar' ? 'لا توجد إعدادات' : 'No settings found'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div
              key={s.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  s.is_secret ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                }`}>
                  {s.is_secret ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 font-mono">{s.key}</span>
                    {s.is_secret && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600 rounded-full">
                        {lang === 'ar' ? 'سري' : 'SECRET'}
                      </span>
                    )}
                  </div>

                  <input
                    type={s.is_secret ? 'password' : 'text'}
                    value={editedValues[s.key] ?? ''}
                    onChange={(e) => handleChange(s.key, e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-all font-mono"
                    placeholder={`${s.key}...`}
                  />

                  {s.updated_at && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      {lang === 'ar' ? 'آخر تحديث:' : 'Updated:'} {new Date(s.updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
