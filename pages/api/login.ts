// pages/api/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = req.body;
  console.log(email , password)

  try {
    // Fetch the user record by email
    const records = await base('userTable').select({
      filterByFormula: `{Email} = "${email}"`
    }).firstPage();

    if (records.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = records[0];
    const hashedPassword = String(user.fields.Password);

    if (!hashedPassword) {
      throw new Error('User record found, but no password set.');
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, hashedPassword);

    if (isMatch) {
      const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET!;

     if (!jwtSecret) {
       throw new Error('JWT_SECRET is not defined');
     }

      const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '1h' });
      const userAvatarUrl = Array.isArray(user.fields.userAvatar) && user.fields.userAvatar.length > 0 ? user.fields.userAvatar[0].url : null;

      res.status(200).json({ success: true, token , userName : user.fields.userName , userAvatar : userAvatarUrl , company : user.fields.companyGroups , id: user.fields.userID});
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.log(error)
    console.log("error")
    res.status(500).json({ success: false, message: error });
    console.log(error)
  }
}

