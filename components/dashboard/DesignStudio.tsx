import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { DressPart, SavedDesign } from '../../types';
import { GoogleGenAI } from "@google/genai";
import { api } from '../../services/api';
import { glassCardClass, glassButtonClass, Icon } from './DashboardShared';

interface DesignStudioProps {
  dressParts: DressPart[];
  designSelections: any;
  setDesignSelections: React.Dispatch<React.SetStateAction<any>>;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  generatedAiImage: string | null;
  setGeneratedAiImage: (img: string | null) => void;
  isGeneratingAi: boolean;
  setIsGeneratingAi: (val: boolean) => void;
  savedDesigns: SavedDesign[];
  setSavedDesigns: React.Dispatch<React.SetStateAction<SavedDesign[]>>;
}

const PART_TYPES = ['front_neckline', 'back_neckline', 'fabrics', 'skirt_styles', 'train', 'ornaments'] as const;

export const DesignStudio: React.FC<DesignStudioProps> = ({
  dressParts,
  designSelections,
  setDesignSelections,
  selectedColor,
  setSelectedColor,
  generatedAiImage,
  setGeneratedAiImage,
  isGeneratingAi,
  setIsGeneratingAi,
  savedDesigns,
  setSavedDesigns,
}) => {
  const { t } = useTranslation();

  const handleGenerateAI = async () => {
    if (Object.keys(designSelections).length === 0) {
      alert(t('dashboard_design_no_selection'));
      return;
    }

    setIsGeneratingAi(true);
    setGeneratedAiImage(null);

    try {
      let apiKey = '';
      try {
        const settings = await api.getPublicSettings();
        apiKey = settings.gemini_api_key || '';
      } catch {}
      if (!apiKey) {
        const storedKey = localStorage.getItem('modeya_gemini_key');
        if (storedKey) apiKey = storedKey;
      }
      if (!apiKey) {
        alert('Please configure Gemini API key in settings');
        return;
      }
      const ai = new GoogleGenAI({ apiKey });

      const partsDescription = [
        designSelections.front_neckline ? `Front Neckline: ${t(designSelections.front_neckline.name as any)}` : '',
        designSelections.back_neckline ? `Back Neckline: ${t(designSelections.back_neckline.name as any)}` : '',
        designSelections.fabrics ? `Fabric: ${t(designSelections.fabrics.name as any)}` : '',
        designSelections.skirt_styles ? `Skirt Style: ${t(designSelections.skirt_styles.name as any)}` : '',
        designSelections.train ? `Train: ${t(designSelections.train.name as any)}` : '',
        designSelections.ornaments ? `Ornaments: ${t(designSelections.ornaments.name as any)}` : '',
      ].filter(Boolean).join(', ');

      const prompt = `Create a high-fashion, realistic full-body photograph of a dress. The dress has the following specifications: ${partsDescription}. The color of the dress is ${selectedColor}. The style should be elegant and suitable for a boutique display. Professional studio lighting, 4k resolution, white background.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio: '3:4', imageSize: '1K' }
        }
      });

      if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64EncodeString}`;
            setGeneratedAiImage(imageUrl);
            break;
          }
        }
      } else {
        throw new Error("No image generated");
      }

    } catch (error) {
      console.error("AI Generation Error:", error);
      alert(t('dashboard_design_ai_error'));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="animate-fade-in text-start">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-white mb-1">{t('dashboard_design_title')}</h2>
        <p className="text-sm text-gray-300">{t('dashboard_design_summary')}</p>
      </div>

      <div className="grid xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 space-y-4">
          {PART_TYPES.map(partType => (
            <div key={partType} className={glassCardClass + ' p-5'}>
              <div className="flex items-center justify-between mb-3 gap-3">
                <h4 className="font-bold text-sm sm:text-base tracking-wide text-brand-gold">
                  {t(`design_part_${partType}` as any)}
                </h4>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {dressParts.filter(p => p.type === partType).length} خيارات
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {dressParts.filter(p => p.type === partType).map(part => {
                  const isSelected = designSelections[partType]?.id === part.id;
                  return (
                    <button
                      key={`${part.type}_${part.id}`}
                      onClick={() => setDesignSelections({ ...designSelections, [partType]: part })}
                      className={`rounded-xl border-2 p-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-brand-gold bg-brand-gold/10 shadow-lg shadow-brand-gold/10'
                          : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                      }`}
                    >
                      <div className="w-full h-40 sm:h-44 bg-white rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                        {part.imageUrl ? (
                          <img
                            src={part.imageUrl}
                            alt={t(part.name as any)}
                            loading="lazy"
                            className="w-full h-full object-contain p-1"
                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            No image
                          </div>
                        )}
                      </div>
                      <p className={`text-sm font-bold text-center leading-tight ${
                        isSelected ? 'text-brand-gold' : 'text-white'
                      }`}>
                        {t(part.name as any)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className={glassCardClass + ' p-5'}>
            <h4 className="font-bold text-sm sm:text-base tracking-wide text-brand-gold mb-3">
              {t('design_color_picker_label')}
            </h4>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-16 h-16 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <span className="font-mono text-sm text-white bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                {selectedColor}
              </span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2">
          <div className={glassCardClass + ' p-5 sticky top-4'}>
            <h3 className="font-serif text-xl mb-4 text-white">{t('dashboard_design_preview')}</h3>

            <div className="aspect-[3/4] bg-white/5 rounded-xl mb-4 flex items-center justify-center text-gray-400 overflow-hidden relative border border-white/10">
              {isGeneratingAi ? (
                <div className="text-center p-4">
                  <svg className="animate-spin h-8 w-8 text-brand-gold mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-xs text-white">{t('dashboard_design_generating')}</p>
                </div>
              ) : generatedAiImage ? (
                <img src={generatedAiImage} alt="AI Generated Dress" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <Icon name="sparkles" className="w-8 h-8 mx-auto mb-2 opacity-50 text-brand-gold" />
                  <p className="text-xs text-gray-300">{t('dashboard_design_no_selection')}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateAI}
              disabled={isGeneratingAi}
              className="w-full py-3 mb-3 bg-brand-gold text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
            >
              <Icon name="sparkles" className="w-4 h-4" />
              {t('dashboard_design_ai_button')}
            </button>

            <div className="space-y-2 mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
              {PART_TYPES.map(key => (
                <div key={key} className="flex justify-between gap-3 text-xs">
                  <span className="text-gray-400">{t(`design_part_${key}` as any)}:</span>
                  <span className={`font-bold text-end ${designSelections[key] ? 'text-white' : 'text-gray-500'}`}>
                    {designSelections[key] ? t(designSelections[key]?.name as any) : '-'}
                  </span>
                </div>
              ))}
              <div className="flex justify-between gap-3 text-xs pt-2 border-t border-white/10">
                <span className="text-gray-400">{t('design_color_picker_label')}:</span>
                <span className="font-bold text-white">{selectedColor}</span>
              </div>
            </div>

            <button
              onClick={async () => {
                const newDesign: SavedDesign = {
                  id: Date.now().toString(),
                  name: 'dashboard_design_default_name',
                  createdAt: new Date(),
                  parts: designSelections,
                  selectedColor: selectedColor,
                  generatedImageUrl: generatedAiImage || undefined
                };
                setSavedDesigns([...savedDesigns, newDesign]);
                try {
                  const designData: Record<string, unknown> = {
                    name: 'Custom Design',
                    design_type: 'ai_generated',
                    image_url: generatedAiImage || '',
                    price: 0,
                    is_public: false,
                  };
                  for (const [key, part] of Object.entries(designSelections)) {
                    const partId = parseInt((part as any).id);
                    if (!isNaN(partId)) {
                      if (key === 'front_neckline') designData.front_neckline_id = partId;
                      else if (key === 'back_neckline') designData.back_neckline_id = partId;
                      else if (key === 'fabrics') designData.fabric_id = partId;
                      else if (key === 'skirt_styles') designData.skirt_style_id = partId;
                      else if (key === 'train') designData.train_id = partId;
                    }
                  }
                  await api.createDesign(designData);
                } catch {}
                alert(t('profile_save_success'));
              }}
              className={glassButtonClass}
            >
              {t('dashboard_design_save_button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
