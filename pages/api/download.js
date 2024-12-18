// pages/api/download.js
export default async function handler(req, res) {
    const { url, filename } = req.query;
  
    if (!url || !filename) {
      return res.status(400).json({ error: 'Missing file URL or filename.' });
    }
  
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
  
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', blob.type);
  
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Failed to download file.' });
    }
  }
  
