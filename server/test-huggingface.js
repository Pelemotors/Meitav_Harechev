#!/usr/bin/env node

/**
 * 🧪 סקריפט בדיקה ל-Hugging Face API
 * בודק שהמודל והמפתח עובדים כמו שצריך
 */

const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

async function testHuggingFaceAPI() {
  console.log('🚀 מתחיל בדיקת Hugging Face API...\n');

  // בדיקת משתני סביבה
  console.log('📋 בדיקת משתני סביבה:');
  console.log(`HUGGINGFACE_API_KEY: ${process.env.HUGGINGFACE_API_KEY ? '✅ קיים' : '❌ חסר'}`);
  console.log(`HUGGINGFACE_MODEL: ${process.env.HUGGINGFACE_MODEL || 'gpt2 (ברירת מחדל)'}`);
  console.log('');

  if (!process.env.HUGGINGFACE_API_KEY) {
    console.error('❌ שגיאה: HUGGINGFACE_API_KEY לא מוגדר!');
    console.log('💡 הוסף את המפתח לקובץ .env או הגדר אותו כמשתנה סביבה');
    process.exit(1);
  }

  // יצירת לקוח Hugging Face
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  const model = process.env.HUGGINGFACE_MODEL || 'distilbert-base-uncased';

  console.log(`🤖 בודק מודל: ${model}`);
  console.log('');

  try {
    // בדיקה 1: מילוי מילים חסרות (fill-mask)
    console.log('📝 בדיקה 1: מילוי מילים חסרות');
    const prompt1 = "שלום, איך [MASK]?";
    console.log(`קלט: "${prompt1}"`);
    
    const response1 = await hf.fillMask({
      model: model,
      inputs: prompt1
    });

    console.log(`פלט: ${JSON.stringify(response1, null, 2)}`);
    console.log('✅ בדיקה 1 הצליחה!\n');

    // בדיקה 2: מילוי מילים חסרות נוסף
    console.log('🚗 בדיקה 2: מילוי מילים על רכבי יוקרה');
    const prompt2 = "רכב [MASK] הוא רכב איכותי";
    console.log(`קלט: "${prompt2}"`);
    
    const response2 = await hf.fillMask({
      model: model,
      inputs: prompt2
    });

    console.log(`פלט: ${JSON.stringify(response2, null, 2)}`);
    console.log('✅ בדיקה 2 הצליחה!\n');

    // בדיקה 3: בדיקת ביצועים
    console.log('⚡ בדיקה 3: מדידת זמן תגובה');
    const startTime = Date.now();
    
    const response3 = await hf.fillMask({
      model: model,
      inputs: "המכונית [MASK] מהר"
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`זמן תגובה: ${responseTime}ms`);
    console.log(`פלט: ${JSON.stringify(response3, null, 2)}`);
    console.log('✅ בדיקה 3 הצליחה!\n');

    console.log('🎉 כל הבדיקות עברו בהצלחה!');
    console.log('💡 ה-API של Hugging Face עובד כמו שצריך');
    
  } catch (error) {
    console.error('❌ שגיאה בבדיקת API:');
    console.error(error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 פתרונות אפשריים:');
      console.log('1. ודא שה-HUGGINGFACE_API_KEY נכון');
      console.log('2. ודא שהמפתח פעיל ולא פג תוקף');
      console.log('3. נסה ליצור מפתח חדש ב-Hugging Face');
    } else if (error.message.includes('404')) {
      console.log('\n💡 פתרונות אפשריים:');
      console.log('1. ודא ששם המודל נכון');
      console.log('2. נסה מודל אחר כמו: gpt2, distilbert-base-uncased');
    } else if (error.message.includes('429')) {
      console.log('\n💡 פתרונות אפשריים:');
      console.log('1. חכה קצת לפני הבדיקה הבאה');
      console.log('2. בדוק את המגבלות של המפתח שלך');
    }
    
    process.exit(1);
  }
}

// הרצת הבדיקה
testHuggingFaceAPI().catch(console.error);
