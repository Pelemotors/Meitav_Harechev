import React, { useState } from 'react';
import { X, Send, Car, MessageCircle, Phone, Mail, User, DollarSign, Calendar, Tag } from 'lucide-react';
import { Lead, Car as CarType, User as UserType } from '../../types';
import { Button, Badge, Card } from '../ui';
import { createLead } from '../../utils/leads';
import { sendCarInformation } from '../../utils/leads';

interface LeadFormProps {
  cars: CarType[];
  users: UserType[];
  onSubmit: (leadData: Partial<Lead>) => void;
  onCancel: () => void;
  initialData?: Partial<Lead>;
}

const LeadForm: React.FC<LeadFormProps> = ({
  cars,
  users,
  onSubmit,
  onCancel,
  initialData = {}
}) => {
  const [formData, setFormData] = useState<Partial<Lead>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    whatsapp: '',
    source: 'website',
    status: 'new',
    priority: 'medium',
    interestInCar: '',
    budget: undefined,
    timeline: undefined,
    notes: '',
    assignedTo: '',
    nextFollowUpDate: undefined,
    ...initialData
  });

  const [loading, setLoading] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);

  const handleInputChange = (field: keyof Lead, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      alert('נא למלא את כל השדות החובה');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('שגיאה ביצירת הליד');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCarInfo = async () => {
    if (!selectedCar || !formData.phone) {
      alert('נא לבחור רכב ולהזין מספר טלפון');
      return;
    }

    try {
      setLoading(true);
      
      // Create lead first if not exists
      const lead = await createLead({
        ...formData,
        source: 'website',
        status: 'new'
      });

      // Send car information
      await sendCarInformation(lead, selectedCar);
      
      alert('מידע הרכב נשלח בהצלחה!');
    } catch (error) {
      console.error('Error sending car info:', error);
      alert('שגיאה בשליחת מידע הרכב');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'website': return <Tag className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getSourceText = (source: string) => {
    const sourceMap: { [key: string]: string } = {
      'website': 'אתר',
      'whatsapp': 'WhatsApp',
      'phone': 'טלפון',
      'email': 'אימייל',
      'social': 'רשתות חברתיות',
      'referral': 'המלצה'
    };
    return sourceMap[source] || source;
  };

  return (
    <div className="fixed inset-0 bg-slc-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slc-light-gray">
          <div className="flex items-center justify-between">
            <h3 className="heading-2 text-slc-dark hebrew">ליד חדש</h3>
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-slc-gray hover:text-slc-dark"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="heading-3 text-slc-dark mb-4 hebrew">מידע בסיסי</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    שם פרטי *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    שם משפחה *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    אימייל *
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    טלפון *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp || ''}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    className="input-field w-full"
                    placeholder="972501234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    מקור
                  </label>
                  <select
                    value={formData.source || 'website'}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="website">אתר</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">טלפון</option>
                    <option value="email">אימייל</option>
                    <option value="social">רשתות חברתיות</option>
                    <option value="referral">המלצה</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Lead Details */}
            <div>
              <h4 className="heading-3 text-slc-dark mb-4 hebrew">פרטי הליד</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    סטטוס
                  </label>
                  <select
                    value={formData.status || 'new'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="new">חדש</option>
                    <option value="contacted">נוצר קשר</option>
                    <option value="qualified">מתאים</option>
                    <option value="proposal">הצעה</option>
                    <option value="negotiation">משא ומתן</option>
                    <option value="closed">נסגר</option>
                    <option value="lost">אבוד</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    עדיפות
                  </label>
                  <select
                    value={formData.priority || 'medium'}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="low">נמוך</option>
                    <option value="medium">בינוני</option>
                    <option value="high">גבוה</option>
                    <option value="urgent">דחוף</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    תקציב
                  </label>
                  <input
                    type="number"
                    value={formData.budget || ''}
                    onChange={(e) => handleInputChange('budget', Number(e.target.value))}
                    className="input-field w-full"
                    placeholder="תקציב בשקלים"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    לוח זמנים
                  </label>
                  <select
                    value={formData.timeline || ''}
                    onChange={(e) => handleInputChange('timeline', e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">לא צוין</option>
                    <option value="immediate">מיידי</option>
                    <option value="1-3_months">1-3 חודשים</option>
                    <option value="3-6_months">3-6 חודשים</option>
                    <option value="6+_months">6+ חודשים</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    מוקצה ל
                  </label>
                  <select
                    value={formData.assignedTo || ''}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">לא מוקצה</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    מעקב הבא
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleInputChange('nextFollowUpDate', new Date(e.target.value))}
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>

            {/* Car Interest */}
            <div>
              <h4 className="heading-3 text-slc-dark mb-4 hebrew">רכב מעניין</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                    רכב נבחר
                  </label>
                  <select
                    value={formData.interestInCar || ''}
                    onChange={(e) => {
                      handleInputChange('interestInCar', e.target.value);
                      const car = cars.find(c => c.id === e.target.value);
                      setSelectedCar(car || null);
                    }}
                    className="input-field w-full"
                  >
                    <option value="">לא נבחר</option>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.name} - {formatCurrency(car.price)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCar && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-slc-gray hebrew">רכב נבחר:</div>
                      <div className="font-medium text-slc-dark hebrew">{selectedCar.name}</div>
                      <div className="text-sm text-slc-bronze">{formatCurrency(selectedCar.price)}</div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleSendCarInfo}
                      disabled={loading || !formData.phone}
                      className="flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      שלח מידע רכב
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                הערות
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="input-field w-full h-24"
                placeholder="הערות על הליד..."
              />
            </div>

            {/* Quick Actions */}
            <div className="border-t border-slc-light-gray pt-6">
              <h4 className="heading-3 text-slc-dark mb-4 hebrew">פעולות מהירות</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleInputChange('source', 'whatsapp')}
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  מקור: WhatsApp
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleInputChange('priority', 'urgent')}
                  className="flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  עדיפות: דחוף
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    handleInputChange('nextFollowUpDate', tomorrow);
                  }}
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  מעקב: מחר
                </Button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-slc-light-gray">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                ביטול
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    יוצר ליד...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    צור ליד
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default LeadForm;
