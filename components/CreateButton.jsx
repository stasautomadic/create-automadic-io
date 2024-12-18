import React, { useState } from 'react';
import { Preview } from '@creatomate/preview';
import { finishVideo } from '@/utility/finishVideo';
import styles from '@/styles/Home.module.css';

export const CreateButton = (props) => {
  const [isRendering, setIsRendering] = useState(false);
  const [renders, setRenders] = useState({ main: null, additional: [] });
  const [totalVideos, setTotalVideos] = useState(0);
  const [completedVideos, setCompletedVideos] = useState(0);

  const userId = localStorage.getItem('userId');

  const handleDownload = async (url) => {
    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      try {
        // Fetch the video file
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Create a temporary anchor element
        const a = document.createElement('a');
        a.style.display = 'none';
        document.body.appendChild(a);
        
        // Create a blob URL and set download attribute
        const blobUrl = window.URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = 'video.mp4'; // You can customize the filename
        
        // Trigger click programmatically
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Download failed:', error);
        // Fallback to opening in new tab if download fails
        window.open(url, '_blank');
      }
    } else {
      // For non-iOS devices, keep the current behavior
      window.open(url, '_blank');
    }
  };

  // Calculate how many videos are currently completed
  const completedCount = (renders.main ? 1 : 0) + 
    renders.additional.filter(r => r.result.status === "succeeded").length;

  // Show both rendering and download states if some videos are done but others are still rendering
  const showMixed = isRendering && completedCount > 0;

  // Extract format from template name (e.g., "Template_16:9" -> "16:9")
  const getFormatFromKey = (key) => {
    const parts = key.split('_');
    return parts[1] || 'Unknown Format';
  };

  return (
    <div className={styles.buttonContainer}>
      {/* Show download buttons for completed videos */}
      {(renders.main || renders.additional.length > 0) && (
        <div className={styles.downloadButtonsContainer}>
          {renders.main?.status === "succeeded" && (
            <button
              className={styles.downloadButton}
              onClick={() => {
                handleDownload(renders.main.url);
                setRenders(prev => ({ ...prev, main: null }));
              }}
            >
              Download Main Video
            </button>
          )}
          {renders.additional.map((render, index) => 
            render.result.status === "succeeded" && (
              <button
                key={render.key}
                className={styles.downloadButton}
                onClick={() => {
                  handleDownload(render.result.url);
                  setRenders(prev => ({
                    ...prev,
                    additional: prev.additional.filter((_, i) => i !== index)
                  }));
                }}
              >
                Download {getFormatFromKey(render.key)} Format
              </button>
            )
          )}
        </div>
      )}

      {/* Show rendering button if still processing */}
      {isRendering && (
        <button 
          className={styles.renderingButton}
          disabled
        >
          Video {completedCount + 1}/{totalVideos} is rendering...
        </button>
      )}

      {/* Show create button if not rendering */}
      {!isRendering && !renders.main && renders.additional.length === 0 && (
        <button
          className={styles.createButton}
          onClick={async () => {
            setIsRendering(true);
            // Calculate total number of videos to be created
            const additionalCount = props.additionalPreviewRefs?.current ? 
              Object.keys(props.additionalPreviewRefs.current).length : 0;
            setTotalVideos(1 + additionalCount); // main video + additional videos

            try {
              await finishVideo(
                props.preview, 
                userId, 
                props.templateNames, 
                props.additionalPreviewRefs,
                (progress) => {
                  setRenders(progress);
                  setCompletedVideos(
                    (progress.main ? 1 : 0) + progress.additional.length
                  );
                }
              );
            } catch (error) {
              window.alert(error);
            } finally {
              setIsRendering(false);
            }
          }}
        >
          Create Videos
        </button>
      )}
    </div>
  );
};