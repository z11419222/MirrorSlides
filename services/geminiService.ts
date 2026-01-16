/**
 * Gemini 服务 - 前端 API 调用
 * 通过本地服务器代理调用 Google Gemini API
 */

export interface SlidePlan {
  phase: string;
  instruction: string;
}

/**
 * 规划演示文稿结构
 * @param script 用户输入的演讲稿
 * @returns 幻灯片规划数组
 */
export const planPresentation = async (script: string): Promise<SlidePlan[]> => {
  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Plan API Error:', error);
      // 返回降级方案
      return error.fallback || [
        { phase: '介绍', instruction: 'Cover the beginning of the script.' },
        { phase: '细节', instruction: 'Cover the main details.' },
        { phase: '总结', instruction: 'Cover the ending.' }
      ];
    }

    return await response.json();

  } catch (error) {
    console.error('Error planning presentation:', error);
    return [
      { phase: '介绍', instruction: 'Cover the beginning of the script.' },
      { phase: '细节', instruction: 'Cover the main details.' },
      { phase: '总结', instruction: 'Cover the ending.' }
    ];
  }
};

/**
 * 生成单张幻灯片
 * @param fullScript 完整演讲稿
 * @param context 幻灯片上下文（阶段和指令）
 * @returns 幻灯片 HTML
 */
export const generateSlide = async (
  fullScript: string,
  context: { phase: string; instruction: string }
): Promise<string> => {
  try {
    const response = await fetch('/api/slide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullScript, context })
    });

    const data = await response.json();
    return data.html;

  } catch (error) {
    console.error('Error generating slide:', error);
    return `
      <div style="width:100%;height:100%;background:#000;color:white;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">
        <div style="text-align:center;">
          <h1>生成幻灯片出错</h1>
          <p>请检查网络连接。</p>
        </div>
      </div>
    `;
  }
};

/**
 * 重新布局幻灯片
 * @param originalHtml 原始 HTML
 * @param direction 布局方向
 * @returns 新的幻灯片 HTML
 */
export const remixSlideLayout = async (
  originalHtml: string,
  direction: 'visual' | 'text-heavy' | 'split'
): Promise<string> => {
  try {
    const response = await fetch('/api/remix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalHtml, direction })
    });

    const data = await response.json();
    return data.html;

  } catch (error) {
    console.error('Error remixing slide:', error);
    return originalHtml;
  }
};