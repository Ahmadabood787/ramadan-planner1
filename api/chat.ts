import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'الطريقة غير مسموحة' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'مفتاح API مفقود' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

    const userMessage = req.body.message;

    const result = await model.generateContent(userMessage);
    const text = result.response.text();

    res.status(200).json({ reply: text });
    
  } catch (error) {
    console.error("حدث خطأ:", error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
}
