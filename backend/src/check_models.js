import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      console.log('Available models for this key:');
      const supported = data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name);
      console.log(supported);
    } else {
      console.log('Response:', data);
    }
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
}

listModels();
