const multer = require('multer');
const path = require('path');

// 저장 위치 및 파일명 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // 'uploads' 폴더가 프로젝트 루트에 있어야 합니다.
    },
    filename: (req, file, cb) => {
        // 중복 방지를 위해 현재 시간 + 원래 파일명 사용
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });
module.exports = upload;