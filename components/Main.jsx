import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAllTemplates } from '../utility/api';
import styles from '@/styles/Home.module.css';

const Main = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);  
  const [clickLoading, setClickLoading] = useState(false); 
  const router = useRouter();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await getAllTemplates();
        setTemplates(data);
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setLoading(false); // Done fetching
      }
    };

    fetchTemplates();
  }, []);

  const getTemplateIdByAspectRatio = (template, aspectRatio) => {
    switch(aspectRatio) {
      case '9:16':
        return template.templateId_9_16;
      case '16:9':
        return template.templateId_16_9;
      case '1:1':
        return template.templateId_1_1;
      case '4:5':
        return template.templateId_4_5;
      default:
        return template.templateId_custom;
    }
  };

  const handleTemplateClick = (template, aspectRatio) => {
    setClickLoading(true);
    const templateId = getTemplateIdByAspectRatio(template, aspectRatio);
    
    // Create query object with required projectID
    const query = { projectID: template.projectID };
    
    // Add template IDs only if they exist and are different from the main template
    if (template.templateId_9_16 && template.templateId_9_16 !== templateId) 
      query.template_9_16 = template.templateId_9_16;
    if (template.templateId_16_9 && template.templateId_16_9 !== templateId) 
      query.template_16_9 = template.templateId_16_9;
    if (template.templateId_1_1 && template.templateId_1_1 !== templateId) 
      query.template_1_1 = template.templateId_1_1;
    if (template.templateId_4_5 && template.templateId_4_5 !== templateId) 
      query.template_4_5 = template.templateId_4_5;
    if (template.templateId_custom && template.templateId_custom !== templateId) 
      query.template_custom = template.templateId_custom;

    router.push({
      pathname: `/${templateId}`,
      query,
    });
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-6">
      {loading || clickLoading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className={styles.loader} />
        </div>
      ) : templates ? (
        <div className={styles.grid}>
          {templates.map((template) => (
            <div key={template.projectID} className={styles.templateCard}>
              <div 
                className={styles.imageSection}
                style={{ backgroundImage: `url(${template.image})` }}
              >
              </div>
              <div className={styles.templateInfo}>
                <h3 className={styles.templateName}>{template.name || 'Template Name'}</h3>
              </div>
              <div 
                className={styles.overlay}
                onClick={() => handleTemplateClick(template, '9:16')}
                role="button"
                aria-label={`Select template ${template.projectID}`}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center min-h-[50vh] text-gray-600">
          No Templates Found!
        </div>
      )}
    </div>
  );
};

export default Main;