/**
 * Express 服务器入口
 * 用于代理 Google Gemini API 请求，解决前端跨域和 API Key 暴露问题
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import geminiRouter from './api/gemini.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(express.json());

// API 路由
app.use('/api', geminiRouter);

// 生产环境：静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// SPA 路由回退（放在 API 路由之后）
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 API 服务器运行在 http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
        console.log(`   开发模式：前端请访问 http://localhost:3000`);
    }
});
