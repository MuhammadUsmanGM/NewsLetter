import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, userMessage } = req.body;

  if (!prompt && !userMessage) {
    return res.status(400).json({ error: 'Prompt or message is required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use the user's preferred model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const fullPrompt = prompt ? `The following is an AI specialized prompt:\n\n"${prompt}"\n\nUser input/request for this prompt:\n${userMessage || "Please execute the prompt as is."}` : userMessage;

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();

    return res.status(200).json({ response: responseText });
  } catch (error) {
    console.error('Playground error:', error);
    return res.status(500).json({ error: 'Neural processing failure in playground.' });
  }
}
