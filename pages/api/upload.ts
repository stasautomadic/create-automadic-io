import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';

export const config = {
    api: {
        bodyParser: false,
    },
};

const uploadDir = 'uploads';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        const form = new IncomingForm({ uploadDir, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                res.status(500).json({ message: 'Error parsing the files' });
                return;
            }

            //const file = files.file as formidable.File;
            const file = Array.isArray(files.file) ? files.file[0] : files.file;
            const upFileName = file?.toString().split(',')[0].replace('PersistentFile: ','');

            try {
                res.status(200).json({
                     message: 'File uploaded successfully',
                     filename: upFileName,
                     image_url: process.env.NEXT_PUBLIC_SITE_URL + 'api/uploads/' + upFileName 
                });
            } catch (error) {                
                res.status(500).json({ message: 'Error saving the file' });
            }
        });
    } else {
        res.status(404).json({ message: 'Only POST method is supported' });
    }
};

export default handler;
