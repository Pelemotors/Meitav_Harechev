const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testSitemapEndpoints() {
  console.log('🧪 בדיקת שרת Sitemap...\n');

  try {
    // בדיקת Health Check
    console.log('1. בדיקת Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // בדיקת Sitemap מלא
    console.log('2. בדיקת Sitemap מלא...');
    const sitemapResponse = await axios.get(`${BASE_URL}/api/sitemap`);
    console.log('✅ Sitemap מלא נוצר בהצלחה');
    console.log('📄 גודל:', sitemapResponse.data.length, 'תווים');
    console.log('📋 Content-Type:', sitemapResponse.headers['content-type']);
    console.log('');

    // בדיקת Sitemap רכבים
    console.log('3. בדיקת Sitemap רכבים...');
    const carsSitemapResponse = await axios.get(`${BASE_URL}/api/sitemap-cars`);
    console.log('✅ Sitemap רכבים נוצר בהצלחה');
    console.log('📄 גודל:', carsSitemapResponse.data.length, 'תווים');
    console.log('');

    // בדיקת Sitemap Index
    console.log('4. בדיקת Sitemap Index...');
    const indexResponse = await axios.get(`${BASE_URL}/api/sitemap-index`);
    console.log('✅ Sitemap Index נוצר בהצלחה');
    console.log('📄 גודל:', indexResponse.data.length, 'תווים');
    console.log('');

    // בדיקת Robots.txt
    console.log('5. בדיקת Robots.txt...');
    const robotsResponse = await axios.get(`${BASE_URL}/api/robots`);
    console.log('✅ Robots.txt נוצר בהצלחה');
    console.log('📄 גודל:', robotsResponse.data.length, 'תווים');
    console.log('📋 Content-Type:', robotsResponse.headers['content-type']);
    console.log('');

    // בדיקת סטטיסטיקות
    console.log('6. בדיקת סטטיסטיקות...');
    const statsResponse = await axios.get(`${BASE_URL}/api/sitemap-stats`);
    console.log('✅ סטטיסטיקות:', statsResponse.data);
    console.log('');

    console.log('🎉 כל הבדיקות עברו בהצלחה!');

  } catch (error) {
    console.error('❌ שגיאה בבדיקה:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 וודא שהשרת פועל על פורט 3001');
      console.log('💡 הרץ: npm run dev בתיקיית server');
    }
  }
}

// בדיקת תוכן XML
function validateXMLContent(xmlContent) {
  const hasXMLDeclaration = xmlContent.includes('<?xml version="1.0"');
  const hasUrlset = xmlContent.includes('<urlset');
  const hasUrls = xmlContent.includes('<url>');
  
  return {
    hasXMLDeclaration,
    hasUrlset,
    hasUrls,
    isValid: hasXMLDeclaration && hasUrlset && hasUrls
  };
}

// בדיקת תוכן Robots.txt
function validateRobotsContent(robotsContent) {
  const hasUserAgent = robotsContent.includes('User-agent: *');
  const hasSitemap = robotsContent.includes('Sitemap:');
  const hasDisallow = robotsContent.includes('Disallow:');
  
  return {
    hasUserAgent,
    hasSitemap,
    hasDisallow,
    isValid: hasUserAgent && hasSitemap && hasDisallow
  };
}

// הרצת הבדיקות
if (require.main === module) {
  testSitemapEndpoints();
}

module.exports = {
  testSitemapEndpoints,
  validateXMLContent,
  validateRobotsContent
};
