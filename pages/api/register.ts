import { NextApiRequest, NextApiResponse } from 'next';
import Airtable from 'airtable';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const base = new Airtable({ apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    // Check if email already exists in the database
    const existingRecords = await base('userTable').select({
      filterByFormula: `LOWER({Email}) = LOWER("${email.replace(/"/g, '\\"')}")`
    }).firstPage();

    if (existingRecords.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user in Airtable with the hashed password
    const records = await base('userTable').create([
      { fields: { Email: email, Password: hashedPassword } },
    ]);

    const jwtSecret = process.env.NEXT_PUBLIC_JWT_SECRET!;

    // Generate a JWT token for the newly registered user
    const token = jwt.sign({ userId: records[0].id }, jwtSecret, {
      expiresIn: '1h',
    });

    // Respond with success and the JWT token
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
}

