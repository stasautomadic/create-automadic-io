export async function finishVideo(preview, userId, templateNames, additionalPreviewRefs, onProgress) {
  // Handle main preview
  const mainResponse = await fetch('/api/videos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: preview.getSource(),
      userId,
      templateNames,
    }),
  });

  if (!mainResponse.ok) {
    if (mainResponse.status === 401) {
      throw new Error('No API key was provided. Please refer to the README.md for instructions.');
    } else {
      throw new Error(`The request failed with status code ${mainResponse.status}`);
    }
  }

  const mainResult = await mainResponse.json();
  // Notify progress after main video is done
  onProgress?.({
    main: mainResult,
    additional: []
  });
  
  // Handle additional previews if they exist
  let additionalResults = [];
  if (additionalPreviewRefs?.current) {
    const keys = Object.keys(additionalPreviewRefs.current);
    for (const key of keys) {
      const additionalPreview = additionalPreviewRefs.current[key];
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: additionalPreview.getSource(),
          userId,
          templateNames,
        }),
      });

      if (!response.ok) {
        throw new Error(`Additional preview request failed with status code ${response.status}`);
      }

      const result = await response.json();
      additionalResults.push({ key, result });
      // Notify progress after each additional video is done
      onProgress?.({
        main: mainResult,
        additional: additionalResults
      });
    }
  }

  return {
    main: mainResult,
    additional: additionalResults
  };
}