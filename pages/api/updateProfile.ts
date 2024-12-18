// pages/api/
import { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import bcrypt from 'bcrypt';

const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, userName, email, userAvatar, password } = req.body;

    try {
      // Update user information in Airtable
      const updates: any = {
          Email: email,
          userName,
          userAvatar,
      };

      if (password) {
        // Hash the new password if provided
        updates.Password = await bcrypt.hash(password, 10); // Hash the password with 10 salt rounds
      }

      await base('userTable').update(userId, updates);

      res.status(200).json({ success: true, message: 'User updated successfully!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error});
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
