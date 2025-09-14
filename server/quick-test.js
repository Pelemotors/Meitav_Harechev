#!/usr/bin/env node

const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

async function quickTest() {
  console.log('🚀 בדיקה מהירה של Hugging Face API...');
  
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  const model = process.env.HUGGINGFACE_MODEL || 'distilbert-base-uncased';
  
  try {
    const response = await hf.fillMask({
      model: model,
      inputs: "Hello [MASK] world!"
    });
    
    console.log('✅ API עובד!');
    console.log('תשובה:', response[0]?.sequence || 'לא נמצאה תשובה');
    
  } catch (error) {
    console.error('❌ שגיאה:', error.message);
  }
}

quickTest();
