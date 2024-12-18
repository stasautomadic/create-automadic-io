import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Inter } from 'next/font/google';
import { Preview, PreviewState } from '@creatomate/preview';
import { SettingsPanel } from '@/components/SettingsPanel';
import { useWindowWidth } from '@/utility/useWindowWidth';

const inter = Inter({ subsets: ['latin'] });

export const Detail = ({ id }) => {
  const router = useRouter();
  const windowWidth = useWindowWidth();
  const [videoAspectRatio, setVideoAspectRatio] = useState();
  const previewRef = useRef();
  const additionalPreviewRefs = useRef({});
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentState, setCurrentState] = useState(null);

  // Extract projectID and template IDs from query params
  const { projectID, template_9_16, template_16_9, template_1_1, template_4_5, template_custom } = router.query;

  const setUpPreview = (htmlElement, templateId = id, previewRef = null) => {
    if (previewRef?.current) {
      previewRef.current.dispose();
      previewRef.current = undefined;
    }

    const preview = new Preview(htmlElement, 'player', projectID);

    preview.onReady = async () => {
      await preview.loadTemplate(templateId);
      if (templateId === id) setIsReady(true);
    };

    preview.onLoad = () => {
      if (templateId === id) setIsLoading(true);
    };

    preview.onLoadComplete = () => {
      if (templateId === id) setIsLoading(false);
    };

    preview.onStateChange = (state) => {
      if (templateId === id) {
        setCurrentState(state);
        setVideoAspectRatio(state.width / state.height);
      }
    };

    if (previewRef) {
      previewRef.current = preview;
    }
    return preview;
  };

  // Function to create a unique key for each preview
  const createPreviewKey = (templateId, ratio) => `${templateId}_${ratio}`;

  const setUpAdditionalPreview = (htmlElement, templateId, ratio) => {
    if (!templateId || !ratio) return;
    
    const previewKey = createPreviewKey(templateId, ratio);
    
    if (!additionalPreviewRefs.current[previewKey]) {
      additionalPreviewRefs.current[previewKey] = {};
    }
    
    if (htmlElement && htmlElement !== additionalPreviewRefs.current[previewKey]?.element) {
      const preview = new Preview(htmlElement, 'player', projectID);

      preview.onReady = async () => {
        await preview.loadTemplate(templateId);
      };

      additionalPreviewRefs.current[previewKey] = preview;
    }
  };

  useEffect(() => {
    if (previewRef.current && id) {
      setUpPreview(previewRef.current.element, id, previewRef);
    }
  }, [id, projectID]);

  // Get all available template IDs
  const getAdditionalTemplates = () => {
    const templates = [];
    if (template_9_16) templates.push({ id: template_9_16, ratio: '9:16', key: createPreviewKey(template_9_16, '9:16') });
    if (template_16_9) templates.push({ id: template_16_9, ratio: '16:9', key: createPreviewKey(template_16_9, '16:9') });
    if (template_1_1) templates.push({ id: template_1_1, ratio: '1:1', key: createPreviewKey(template_1_1, '1:1') });
    if (template_4_5) templates.push({ id: template_4_5, ratio: '4:5', key: createPreviewKey(template_4_5, '4:5') });
    if (template_custom) templates.push({ id: template_custom, ratio: 'custom', key: createPreviewKey(template_custom, 'custom') });
    return templates.filter(t => t.id !== id); // Exclude the main template
  };

  useEffect(() => {
    if (projectID) {
      // Create previews for all available template IDs with their ratios
      if (template_9_16) setUpAdditionalPreview(document.createElement('div'), template_9_16, '9:16');
      if (template_16_9) setUpAdditionalPreview(document.createElement('div'), template_16_9, '16:9');
      if (template_1_1) setUpAdditionalPreview(document.createElement('div'), template_1_1, '1:1');
      if (template_4_5) setUpAdditionalPreview(document.createElement('div'), template_4_5, '4:5');
      if (template_custom) setUpAdditionalPreview(document.createElement('div'), template_custom, 'custom');
    }
  }, [projectID, template_9_16, template_16_9, template_1_1, template_4_5, template_custom]);

  return (
    <div className="h-full flex overflow-y-auto flex-col lg:flex-row">
      {/* Main Preview Section */}
      <div className="flex-1 min-h-[140vh] lg:min-h-0 bg-white p-4 lg:p-6">
        <div className="h-full flex flex-col">
          {/* Preview Container */}
          <div className="relative flex-1 rounded-xl bg-gray-50 shadow-inner overflow-hidden">
            <div
              className="absolute inset-0"
              ref={(htmlElement) => {
                if (htmlElement && htmlElement !== previewRef.current?.element) {
                  setUpPreview(htmlElement, id, previewRef);
                }
              }}
              style={{
                height: videoAspectRatio && windowWidth && windowWidth < 768
                  ? window.innerWidth / videoAspectRatio
                  : '100%',
              }}
            />
            
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white/90 rounded-lg p-4 shadow-lg flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-600">Loading preview...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {isReady && previewRef.current && (
        <div className="flex-none w-full lg:w-[400px] xl:w-[480px] bg-white lg:border-l border-gray-200">
          <div className="h-full overflow-y-auto p-[2rem]" id="panel">
            <SettingsPanel 
              id={id} 
              preview={previewRef.current} 
              currentState={currentState} 
              additionalPreviewRefs={additionalPreviewRefs}
            />
          </div>
        </div>
      )}

      {/* Hidden Additional Previews */}
      <div className="hidden">
        {getAdditionalTemplates().map((template) => (
          <div key={template.key}>
            <div
              ref={(htmlElement) => setUpAdditionalPreview(htmlElement, template.id, template.ratio)}
              style={{
                width: template.ratio === '9:16' ? '169px' :
                       template.ratio === '16:9' ? '533px' :
                       template.ratio === '1:1' ? '300px' :
                       template.ratio === '4:5' ? '240px' :
                       '300px',
                height: '300px',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};