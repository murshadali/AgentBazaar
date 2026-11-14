import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGeneration() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
    const result = await model.generateContent('Hello! Return {"status": "ok"} in json.');
    console.log('Result:', result.response.text());
  } catch (err) {
    console.error('Error:', err);
  }
}

testGeneration();
