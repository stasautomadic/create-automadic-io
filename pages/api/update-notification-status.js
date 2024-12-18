import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { recordId, status, tableId } = req.body;

  if (!recordId || !status || !tableId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Update the record in Airtable
    const record = await base(tableId).update([
      {
        id: recordId,
        fields: {
          'email_notification_status': status
        }
      }
    ]);

    return res.status(200).json({ success: true, record: record[0] });
  } catch (error) {
    console.error('Airtable update error:', error);
    return res.status(500).json({ message: 'Failed to update Airtable record', error: error.message });
  }
}
