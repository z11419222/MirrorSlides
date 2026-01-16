import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY;

// Helper to ensure we have a key
const getAIClient = () => {
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

// --- SYSTEM INSTRUCTION: VISUALIZING A SPOKEN SCRIPT ---
const SYSTEM_INSTRUCTION = `
You are a specialized "Script-to-Slide" Visual Engine. 
Your job is to take a segment of a spoken script (narration) and turn it into a high-fidelity presentation slide that ACCOMPANIES the speaker.

VISUAL STYLE GUIDE (Strict High-Fidelity):
1. BACKGROUND: Cinematic Dark Mode. Use deep radial gradients (e.g., #050505 to #1a1a2e). 
2. GLASSMORPHISM: All containers must use \`backdrop-filter: blur(20px)\`, \`background: rgba(255,255,255,0.03)\`, and \`border: 1px solid rgba(255,255,255,0.08)\`.
3. TYPOGRAPHY: Huge, bold system fonts (Inter, SF Pro). tracking-tight.
4. LAYOUT: Asymmetric, modern layouts. NO basic bullet points. Use grids, big numbers, or floating cards.

CRITICAL LAYOUT & SCALING RULES (NO SCROLLBARS):
1. VIEWPORT ONLY: The slide MUST fit exactly 100vw x 100vh.
2. NO PIXELS: DO NOT use \`px\` for font-sizes, padding, or margins. 
   - YOU MUST USE \`vw\` and \`vh\` units for everything.
   - Example: Use \`font-size: 4vw\` instead of \`60px\`. Use \`padding: 2vw\`.
   - This ensures the slide scales perfectly from a small thumbnail to a full screen 4K display.
3. OVERFLOW HIDDEN: The design must never overflow the viewport.

CRITICAL CONTENT RULE:
- You are visualizing a SPECIFIC PART of the user's script.
- EXTRACT the most impactful 1-2 sentences from the provided script segment to use as the Headline/Subhead.
- Do NOT summarize the whole topic. Only visualize what is being said in THIS segment.

ANIMATION (The "Teleprompter" Flow):
- Since this accompanies speech, elements must appear IN ORDER of the script.
- Keyframe: \`@keyframes rise-in { from { opacity:0; transform: translateY(5vh); filter:blur(10px); } to { opacity:1; transform:translateY(0); filter:blur(0); } }\`
- Stagger delays significantly (0s, 1s, 2s) so the slide builds while the speaker talks.

OUTPUT FORMAT:
- Return ONLY raw HTML string.
- Full 16:9 aspect ratio container.
`;

export interface SlidePlan {
  phase: string;
  instruction: string;
}

/**
 * Helper to force-inject CSS/JS that ensures safety and animation control.
 */
const injectSafetyStyles = (html: string): string => {
  const safetyCSS = `
    <style>
      html, body {
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        background-color: #050505 !important;
        color: #ffffff !important;
      }
      *, *::before, *::after {
        box-sizing: inherit;
      }
      /* Ensure scrollbars are strictly hidden */
      ::-webkit-scrollbar { 
        display: none; 
      }
    </style>
  `;

  // Script to allow the parent to restart animations
  // We place this in the HEAD so it persists even if we reset document.body.innerHTML
  const controlScript = `
    <script>
      window.addEventListener('message', (e) => {
        if (e.data === 'play') {
          // Force a Reflow/Repaint of the body to restart CSS animations from 0
          // This is the cleanest way to restart animations without reloading the iframe
          const currentContent = document.body.innerHTML;
          document.body.innerHTML = ''; 
          // Trigger reflow
          void document.body.offsetWidth;
          document.body.innerHTML = currentContent;
        }
      });
    </script>
  `;

  // Inject before head close
  if (html.includes('</head>')) {
    return html.replace('</head>', `${safetyCSS}${controlScript}</head>`);
  } else {
    return `<head>${safetyCSS}${controlScript}</head>` + html;
  }
};

/**
 * STEP 1: Plan the presentation structure based on the script.
 * The AI decides how many slides are needed.
 */
export const planPresentation = async (script: string): Promise<SlidePlan[]> => {
  try {
    const ai = getAIClient();
    const modelId = "gemini-3-flash-preview";

    const prompt = `
      Analyze the following spoken presentation script. 
      Break it down into a logical sequence of slides.

      SCRIPT:
      "${script}"

      RULES:
      1. Determine the optimal number of slides to cover ALL key points (Minimum 3, Maximum 8).
      2. If the script is long or complex, split it into more slides.
      3. For each slide, provide:
         - 'phase': A short title for the slide's role (e.g., "Market Gap", "The Solution", "Pricing").
         - 'instruction': Specific instructions on what visual elements to show for this part of the script.
      
      IMPORTANT:
      If the input SCRIPT is in Chinese, the 'phase' AND 'instruction' MUST be in Chinese.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              phase: { type: Type.STRING },
              instruction: { type: Type.STRING }
            },
            required: ["phase", "instruction"]
          }
        }
      }
    });

    const text = response.text || "[]";
    return JSON.parse(text);

  } catch (error) {
    console.error("Error planning presentation:", error);
    // Fallback to 3 slides if planning fails
    return [
      { phase: "介绍", instruction: "Cover the beginning of the script." },
      { phase: "细节", instruction: "Cover the main details." },
      { phase: "总结", instruction: "Cover the ending." }
    ];
  }
};

/**
 * STEP 2: Generate a single slide based on the plan.
 */
export const generateSlide = async (fullScript: string, context: { phase: string, instruction: string }): Promise<string> => {
  try {
    const ai = getAIClient();
    const modelId = "gemini-3-flash-preview";
    
    const prompt = `
      USER'S FULL SCRIPT:
      "${fullScript}"

      YOUR TASK: Create the slide for the **${context.phase}** of this script.
      
      SPECIFIC INSTRUCTIONS:
      ${context.instruction}
      
      DESIGN RULES:
      1. USE VW/VH UNITS ONLY. NO PIXELS.
      2. Identify the key lines spoken in this part of the script. Use them as the main text.
      3. If the script mentions numbers/data in this part, visualize them.
      4. If the script tells a story here, use a layout that implies flow or emotion.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1.0, 
      }
    });

    const text = response.text || "";
    let cleanHtml = text.replace(/```html/g, '').replace(/```/g, '').trim();
    return injectSafetyStyles(cleanHtml);

  } catch (error) {
    console.error("Error generating slide:", error);
    return injectSafetyStyles(`
      <div style="width:100%;height:100%;background:#000;color:white;display:flex;align-items:center;justify-content:center;font-family:sans-serif;">
        <div style="text-align:center;">
            <h1>生成幻灯片出错</h1>
            <p>请检查 API Key。</p>
        </div>
      </div>
    `);
  }
};

export const remixSlideLayout = async (originalHtml: string, direction: 'visual' | 'text-heavy' | 'split'): Promise<string> => {
  try {
    const ai = getAIClient();
    const modelId = "gemini-3-flash-preview";

    const prompt = `
      Refactor this HTML slide to a new layout: "${direction}".
      Original: ${originalHtml}
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });

    const text = response.text || "";
    let cleanHtml = text.replace(/```html/g, '').replace(/```/g, '').trim();
    return injectSafetyStyles(cleanHtml);

  } catch (error) {
    return originalHtml;
  }
};