import React, { useState } from 'react';
import { Phone, MapPin, Mail, Clock } from 'lucide-react';

const ContactSection = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    leadType: 'general',
    interestedCars: [] as string[],
    budgetMin: '',
    budgetMax: '',
    financingNeeded: false,
    downPayment: '',
    monthlyPaymentMax: '',
    message: '',
    source: 'website'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleCarInterest = (carId: string, checked: boolean) => {
    setFormData({
      ...formData,
      interestedCars: checked 
        ? [...formData.interestedCars, carId]
        : formData.interestedCars.filter(id => id !== carId)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // שליחת הנתונים לשרת
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : null,
          budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : null,
          downPayment: formData.downPayment ? parseInt(formData.downPayment) : null,
          monthlyPaymentMax: formData.monthlyPaymentMax ? parseInt(formData.monthlyPaymentMax) : null,
        }),
      });

      if (response.ok) {
        // יצירת הודעת WhatsApp
        const phoneNumber = '972507422522'; // אסי
        const message = `ליד חדש מהאתר של מיטב הרכב!

שם: ${formData.firstName} ${formData.lastName}
טלפון: ${formData.phone}
${formData.email ? `אימייל: ${formData.email}` : ''}
סוג פנייה: ${formData.leadType}
${formData.budgetMin ? `תקציב מינימלי: ₪${formData.budgetMin}` : ''}
${formData.budgetMax ? `תקציב מקסימלי: ₪${formData.budgetMax}` : ''}
${formData.financingNeeded ? 'מעוניין במימון' : ''}

הודעה: ${formData.message}`;
        
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        // איפוס הטופס
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          leadType: 'general',
          interestedCars: [],
          budgetMin: '',
          budgetMax: '',
          financingNeeded: false,
          downPayment: '',
          monthlyPaymentMax: '',
          message: '',
          source: 'website'
        });
        
        alert('הפנייה נשלחה בהצלחה! נציגנו יצור איתך קשר בהקדם.');
      } else {
        throw new Error('שגיאה בשליחת הנתונים');
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      alert('אירעה שגיאה בשליחת הפנייה. אנא נסה שוב או התקשר ישירות.');
    }
  };

  return (
    <section id="contact" className="section bg-white">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-neutral-900 mb-4">דברו איתנו – אנחנו כאן בשבילכם</h2>
          <p className="text-neutral-600 text-lg max-w-3xl mx-auto">
            מתלבטים איזה רכב מתאים לכם?<br />
            רוצים ייעוץ אישי ולשמוע על אפשרויות מימון משתלמות?<br />
            אנחנו זמינים לכל שאלה – נשמח לעזור לכם למצוא את הרכב הבא שלכם.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form - Right Side */}
          <div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-6 text-right">שלח הודעה</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* פרטים אישיים */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-right text-neutral-600 font-medium mb-2">
                    שם פרטי *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-slc-light-gray rounded-lg focus:ring-2 focus:ring-slc-bronze focus:border-transparent text-right"
                    placeholder="הכנס שם פרטי"
                  />
                </div>
                
                <div>
                  <label className="block text-right text-neutral-600 font-medium mb-2">
                    שם משפחה
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-slc-light-gray rounded-lg focus:ring-2 focus:ring-slc-bronze focus:border-transparent text-right"
                    placeholder="הכנס שם משפחה"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* סוג פנייה */}
              <div>
                <label className="block text-right text-gray-700 font-medium mb-2">
                  סוג פנייה *
                </label>
                <select
                  name="leadType"
                  value={formData.leadType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                >
                  <option value="general">פנייה כללית</option>
                  <option value="car_inquiry">חקירה על רכב ספציפי</option>
                  <option value="financing">ייעוץ מימון</option>
                  <option value="service">שירות ותחזוקה</option>
                </select>
              </div>

              {/* תקציב */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-right text-gray-700 font-medium mb-2">
                    תקציב מינימלי (₪)
                  </label>
                  <input
                    type="number"
                    name="budgetMin"
                    value={formData.budgetMin}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                    placeholder="₪0"
                  />
                </div>
                
                <div>
                  <label className="block text-right text-gray-700 font-medium mb-2">
                    תקציב מקסימלי (₪)
                  </label>
                  <input
                    type="number"
                    name="budgetMax"
                    value={formData.budgetMax}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                    placeholder="₪0"
                  />
                </div>
              </div>

              {/* מימון */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    name="financingNeeded"
                    checked={formData.financingNeeded}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label className="text-gray-700 font-medium">
                    מעוניין במימון
                  </label>
                </div>
                
                {formData.financingNeeded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-right text-gray-700 font-medium mb-2">
                        מקדמה (₪)
                      </label>
                      <input
                        type="number"
                        name="downPayment"
                        value={formData.downPayment}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                        placeholder="₪0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-right text-gray-700 font-medium mb-2">
                        החזר חודשי מקסימלי (₪)
                      </label>
                      <input
                        type="number"
                        name="monthlyPaymentMax"
                        value={formData.monthlyPaymentMax}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                        placeholder="₪0"
                      />
                    </div>
                  </div>
                )}
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
                className="btn-primary w-full h-12 text-lg font-bold hover-lift"
              >
                שלח פנייה
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
                  <p className="text-gray-700">חדרה</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div className="text-right">
                  <h4 className="font-bold text-darkBlue mb-1">טלפון</h4>
                  <p className="text-gray-700">📱 אסי: 050-7422522</p>
                  <p className="text-gray-700">📱 אלון: 053-5335540</p>
                  <p className="text-gray-700">📱 אלון: 053-5335540</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div className="text-right">
                  <h4 className="font-bold text-darkBlue mb-1">שעות פתיחה</h4>
                  <p className="text-gray-700">ראשון - חמישי: 08:00 - 18:00</p>
                  <p className="text-gray-700">שישי: 08:00 - 14:00</p>
                  <p className="text-gray-700">שבת: סגור</p>
                  <p className="text-primary font-medium mt-2">זמינים לכל שאלה!</p>
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