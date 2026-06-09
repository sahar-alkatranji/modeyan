import React, { useState, useEffect } from 'react';
import { DressPart } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { api } from '../services/api';

interface DesignYourDressProps {
  dressParts: DressPart[];
  onBack: () => void;
  onSave?: (design: any) => void;
}

const DesignYourDress: React.FC<DesignYourDressProps> = ({ dressParts, onBack, onSave }) => {
  const { t, lang } = useTranslation();
  const isAr = lang === 'ar';

  // State
  const [step, setStep] = useState<'select' | 'generate' | 'result'>('select');
  const [selectedParts, setSelectedParts] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [userPrompt, setUserPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('gpt-image-1');
  const [selectedQuality, setSelectedQuality] = useState('medium');

  // Group parts by category
  const partsByCategory = dressParts.reduce((acc, part) => {
    if (!acc[part.type]) acc[part.type] = [];
    acc[part.type].push(part);
    return acc;
  }, {} as Record<string, DressPart[]>);

  const categories = Object.keys(partsByCategory);

  const categoryLabels: Record<string, { en: string; ar: string }> = {
    front_neckline: { en: 'Front Neckline', ar: 'الياقة الأمامية' },
    back_neckline: { en: 'Back Neckline', ar: 'الياقة الخلفية' },
    fabrics: { en: 'Fabric', ar: 'القماش' },
    skirt_styles: { en: 'Skirt Style', ar: 'スタイル التنانير' },
    train: { en: 'Train', ar: 'الذيل' },
    ornaments: { en: 'Ornaments', ar: 'الزخارف' },
  };

  const modelLabels: Record<string, { en: string; ar: string }> = {
    'gpt-image-1': { en: 'Standard', ar: 'قياسي' },
    'gpt-image-1-mini': { en: 'Fast (Mini)', ar: 'سريع' },
    'gpt-image-2': { en: 'Premium', ar: 'ممتاز' },
  };

  const qualityLabels: Record<string, { en: string; ar: string }> = {
    low: { en: 'Low (Fast)', ar: 'منخفض (سريع)' },
    medium: { en: 'Medium', ar: 'متوسط' },
    high: { en: 'High', ar: 'عالي' },
  };

  const handlePartSelect = (category: string, partName: string) => {
    setSelectedParts(prev => ({
      ...prev,
      [category]: prev[category] === partName ? '' : partName,
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setStep('generate');

    try {
      const parts = {
        ...selectedParts,
        color: selectedColor,
      };

      const result = await api.generateDesignImage(userPrompt, parts, selectedModel, selectedQuality);
      
      if (result.image_url) {
        setGeneratedImage(result.image_url);
        setModelUsed(result.model_used);
        setStep('result');
      } else {
        throw new Error('No image returned');
      }
    } catch (err: any) {
      setError(err.message || (isAr ? 'فشل التوليد' : 'Generation failed'));
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (onSave && generatedImage) {
      onSave({
        name: isAr ? 'تصميم مخصص' : 'Custom Design',
        parts: selectedParts,
        color: selectedColor,
        image: generatedImage,
        model: modelUsed,
      });
    }
  };

  const handleReset = () => {
    setGeneratedImage(null);
    setStep('select');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-black mb-4 flex items-center transition-colors"
          >
            <span className="text-lg me-2 rtl:rotate-180">←</span>
            {isAr ? 'العودة' : 'Back'}
          </button>
          <h1 className="text-3xl font-serif text-gray-900 mb-2">
            {isAr ? 'صمم فستانك' : 'Design Your Dress'}
          </h1>
          <p className="text-gray-600">
            {isAr
              ? 'اختاري أجزاء الفستان وقومي بتوليد تصميم فريد باستخدام الذكاء الاصطناعي'
              : 'Select dress parts and generate a unique design using AI'}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {['select', 'generate', 'result'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-black text-white'
                    : i < ['select', 'generate', 'result'].indexOf(step)
                    ? 'bg-gray-300 text-gray-600'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {i + 1}
              </div>
              {i < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>

        {/* Content */}
        {step === 'select' && (
          <div className="space-y-6">
            {/* Dress Parts Selection */}
            {categories.map(category => (
              <div key={category} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {categoryLabels[category]?.[lang] || category}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {partsByCategory[category].map(part => (
                    <button
                      key={part.id}
                      onClick={() => handlePartSelect(category, part.name)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        selectedParts[category] === part.name
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-gray-400 text-gray-700'
                      }`}
                    >
                      {part.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Color Picker */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isAr ? 'اللون' : 'Color'}
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={e => setSelectedColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                />
                <span className="text-gray-600">{selectedColor}</span>
                {/* Preset colors */}
                <div className="flex gap-2 ms-4">
                  {['#FFFFFF', '#F5F5DC', '#FFB6C1', '#87CEEB', '#DDA0DD', '#98FB98'].map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedColor === color ? 'border-black scale-110' : 'border-gray-200'
                      } transition-transform`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* AI Settings */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isAr ? 'إعدادات الذكاء الاصطناعي' : 'AI Settings'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isAr ? 'النموذج' : 'Model'}
                  </label>
                  <select
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {Object.entries(modelLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label[lang]}</option>
                    ))}
                  </select>
                </div>

                {/* Quality Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isAr ? 'الجودة' : 'Quality'}
                  </label>
                  <select
                    value={selectedQuality}
                    onChange={e => setSelectedQuality(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {Object.entries(qualityLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label[lang]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Prompt */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isAr ? 'تفاصيل إضافية' : 'Additional Details'}
              </h3>
              <textarea
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
                placeholder={isAr ? 'أي تفاصيل إضافية للتصميم...' : 'Any additional design details...'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-xl text-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isAr ? 'جاري التوليد...' : 'Generating...'}
                </span>
              ) : (
                isAr ? 'توليد التصميم' : 'Generate Design'
              )}
            </button>
          </div>
        )}

        {/* Loading State */}
        {step === 'generate' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-200 rounded-full animate-spin">
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-black rounded-full" />
              </div>
            </div>
            <p className="mt-6 text-lg text-gray-600">
              {isAr ? 'جاري توليد التصميم...' : 'Generating your design...'}
            </p>
            <p className="mt-2 text-sm text-gray-400">
              {isAr ? 'قد يستغرق هذا 10-30 ثانية' : 'This may take 10-30 seconds'}
            </p>
          </div>
        )}

        {/* Result */}
        {step === 'result' && generatedImage && (
          <div className="space-y-6">
            {/* Generated Image */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
              <img
                src={generatedImage}
                alt={isAr ? 'تصميم الفستان' : 'Dress Design'}
                className="w-full h-auto"
              />
            </div>

            {/* Model Info */}
            {modelUsed && (
              <div className="text-center text-sm text-gray-500">
                {isAr ? 'تم التوليد بواسطة' : 'Generated by'}: {modelUsed}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3 border-2 border-black text-black rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                {isAr ? 'تصميم جديد' : 'New Design'}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                {isAr ? 'حفظ التصميم' : 'Save Design'}
              </button>
            </div>

            {/* Download Button */}
            <a
              href={generatedImage}
              download="modeya-design.png"
              className="block text-center py-3 text-gray-600 hover:text-black transition-colors"
            >
              {isAr ? 'تحميل الصورة' : 'Download Image'} ↓
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignYourDress;
