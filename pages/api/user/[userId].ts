// pages/api/user/[userId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY}).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  try {
    const records = await base('userTable').select({
      filterByFormula: `{userID} = "${userId}"`
    }).firstPage();

    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = records[0].fields;

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching user data' });
  }
}
