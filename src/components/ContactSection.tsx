import React, { useState } from 'react';
import { Phone, MapPin, Mail, Clock } from 'lucide-react';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // יצירת הודעת WhatsApp
    const phoneNumber = '972505666620';
    const message = `שלום, הגעתי מהאתר של   Strong Luxury Cars

שם: ${formData.name}
טלפון: ${formData.phone}
${formData.email ? `אימייל: ${formData.email}` : ''}

הודעה: ${formData.message}`;
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // איפוס הטופס
    setFormData({
      name: '',
      phone: '',
      email: '',
      message: ''
    });
    
    alert('ההודעה נשלחה בהצלחה! תועבר לוואטסאפ.');
  };

  return (
    <section id="contact" className="section bg-white">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slc-dark mb-4">צור קשר</h2>
          <p className="text-slc-gray text-lg">נשמח לעמוד לשירותכם ולענות על כל שאלה</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form - Right Side */}
          <div>
            <h3 className="text-2xl font-bold text-slc-dark mb-6 text-right">שלח הודעה</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-right text-slc-gray font-medium mb-2">
                  שם מלא *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-slc-light-gray rounded-lg focus:ring-2 focus:ring-slc-bronze focus:border-transparent text-right"
                  placeholder="הכנס את שמך המלא"
                />
              </div>
              
              <div>
                <label className="block text-right text-gray-700 font-medium mb-2">
                  טלפון *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  placeholder="הכנס מספר טלפון"
                />
              </div>
              
              <div>
                <label className="block text-right text-gray-700 font-medium mb-2">
                  אימייל
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  placeholder="הכנס כתובת אימייל"
                />
              </div>
              
              <div>
                <label className="block text-right text-gray-700 font-medium mb-2">
                  הודעה *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right resize-none"
                  placeholder="כתוב את הודעתך כאן..."
                />
              </div>
              
              <button
                type="submit"
                className="btn-primary w-full h-12 text-lg font-bold"
              >
                שלח הודעה
              </button>
            </form>
          </div>
          
          {/* Contact Information - Left Side */}
          <div>
            <h3 className="text-2xl font-bold text-darkBlue mb-6 text-right">פרטי התקשרות</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div className="text-right">
                  <h4 className="font-bold text-darkBlue mb-1">כתובת</h4>
                  <p className="text-gray-700">רחוב ברוך 123, נתניה</p>
                  <p className="text-gray-700">ישראל 42361</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div className="text-right">
                  <h4 className="font-bold text-darkBlue mb-1">טלפון</h4>
                  <p className="text-gray-700">09-123-4567</p>
                  <p className="text-gray-700">050-123-4567 (נייד)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div className="text-right">
                  <h4 className="font-bold text-darkBlue mb-1">אימייל</h4>
                  <p className="text-gray-700">info@autotest.co.il</p>
                  <p className="text-gray-700">service@autotest.co.il</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div className="text-right">
                  <h4 className="font-bold text-darkBlue mb-1">שעות פתיחה</h4>
                  <p className="text-gray-700">ראשון - חמישי: 08:00 - 18:00</p>
                  <p className="text-gray-700">שישי: 08:00 - 14:00</p>
                  <p className="text-gray-700">שבת: סגור</p>
                  <p className="text-primary font-medium mt-2">שירות חירום 24/7</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-lightGray rounded-xl">
              <h4 className="font-bold text-darkBlue mb-3 text-right">מיקום במפה</h4>
              <div className="bg-gray-300 h-48 rounded-lg flex items-center justify-center">
                <p className="text-gray-600">מפה אינטראקטיבית</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;