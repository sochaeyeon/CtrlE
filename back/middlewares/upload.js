const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createUploader = (folder) => {
    const dest = path.join(__dirname, `../uploads/${folder}`);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, dest),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });

    return multer({
        storage,
        limits: { fileSize: 20 * 1024 * 1024 }
    });
};

module.exports = createUploader;