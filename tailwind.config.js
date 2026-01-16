/** @type {import('tailwindcss').Config} */
// Tailwind CSS 配置文件 - 用于生产环境构建
export default {
  // 扫描内容路径，用于清除未使用的 CSS
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 自定义颜色配置
      colors: {
        glass: "rgba(255, 255, 255, 0.05)",
        glassBorder: "rgba(255, 255, 255, 0.1)",
        primary: "#6366f1",
      },
      // 自定义动画配置
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
