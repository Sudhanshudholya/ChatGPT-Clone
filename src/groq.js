// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({
//   apiKey: import.meta.env.VITE_GEMINI_API_KEY,
// });

// export const sendMsgToGemini = async (message) => {
//   try {
//     const response = await ai.models.generateContent({
//       model: "gemini-3.6-flash",
//       contents: message,
//     });

//     return response.text;
//   } catch (error) {
//     console.error("Gemini Error:", error);
//     return "Something went wrong. Please try again.";
//   }
// };

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const sendMsgToGroq = async (message) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      model: "openai/gpt-oss-120b",
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Groq Error:", error);
    return "Sorry, something went wrong.";
  }
};