// pages/api/uploads/[filename].ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { filename } = req.query;
    const filePath = path.join(process.cwd(), 'uploads', filename as string);

    fs.readFile(filePath, (err, file) => {
        if (err) {
            res.status(404).json({ message: 'File not found.' });
            return;
        }
        res.setHeader('Content-Type', 'image/png'); 
        res.send(file);
    });
}
