import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Check for required environment variables
if (!process.env.GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY is not set in .env file');
  process.exit(1);
}

// Validate API key format
if (!process.env.GEMINI_API_KEY.startsWith('AI')) {
  console.error('Error: Invalid GEMINI_API_KEY format. It should start with "AI"');
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Citemap API is running',
    endpoints: {
      root: '/',
      health: '/health',
      analyze: '/analyze (POST)',
      test: '/test (GET)'
    },
    status: 'ok'
  });
});

// Test endpoint
app.get('/test', async (req, res) => {
  try {
    console.log('Testing Gemini API connection...');
    console.log('Using API key:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
    
    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    console.log('Model initialized, sending test request...');
    const result = await model.generateContent({
      contents: [{
        parts: [{
          text: "Say 'Hello, World!'"
        }]
      }]
    });
    
    console.log('Got response, processing...');
    const response = await result.response;
    const text = response.text();
    
    console.log('Test successful:', text);
    res.json({ 
      status: 'success',
      message: text,
      apiKeyPrefix: process.env.GEMINI_API_KEY.substring(0, 10) + '...'
    });
  } catch (error) {
    console.error('Test failed:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'error',
      message: error.message,
      details: error.cause?.message || 'No additional details',
      type: error.name
    });
  }
});

// Analysis endpoint
app.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    console.log('Received text for analysis:', text.substring(0, 100) + '...');

    // Get the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create the prompt
    const prompt = `Analyze the following text and extract the key research discourse, literature references, and academic insights. Format the response in a clear, structured way:

${text}

Please provide:
1. Main research themes
2. Key literature references
3. Academic insights and implications
4. Potential research gaps or areas for further study`;

    console.log('Sending request to Gemini API...');

    // Generate content
    const result = await model.generateContent({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    });
    
    const response = await result.response;
    const analysis = response.text();

    console.log('Successfully received analysis from Gemini API');
    res.json({ analysis });
  } catch (error) {
    console.error('Analysis error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Failed to analyze text',
      details: error.message,
      type: error.name,
      cause: error.cause?.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const apiKeyStatus = process.env.GEMINI_API_KEY 
    ? (process.env.GEMINI_API_KEY.startsWith('AI') ? 'valid format' : 'invalid format')
    : 'missing';
    
  res.json({ 
    status: 'ok',
    apiKey: apiKeyStatus,
    apiKeyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10) + '...',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log('API Key status:', process.env.GEMINI_API_KEY 
    ? (process.env.GEMINI_API_KEY.startsWith('AI') ? 'valid format' : 'invalid format')
    : 'missing');
  console.log('API Key prefix:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');
  console.log(`Visit http://localhost:${port} for API information`);
}); 