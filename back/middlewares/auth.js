const jwt = require('jsonwebtoken');
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET; 

const jwtAuthentication = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: '인증 토큰 없음', isLogin: false });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // 해독된 정보 (userId 등)
        next();
    } catch (err) {
        console.error("토큰 검증 에러:", err); // 터미널에서 어떤 에러인지 정확히 볼 수 있게 로그 추가
        return res.status(403).json({ message: '유효하지 않은 토큰', isLogin: false });
    }
};

module.exports = jwtAuthentication;