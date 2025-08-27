import React, { useState, useEffect } from 'react';
import { X, Edit, Phone, Mail, MessageCircle, Calendar, User, Car, DollarSign, Clock, Tag, Plus, Send, FileText } from 'lucide-react';
import { Lead, Car as CarType, User as UserType, LeadCommunication } from '../../types';
import { supabase } from '../../utils/supabase';
import { Button, Badge, Card } from '../ui';

interface LeadDetailProps {
  lead: Lead;
  cars: CarType[];
  users: UserType[];
  onUpdate: (leadId: string, updates: Partial<Lead>) => void;
  onClose: () => void;
}

const LeadDetail: React.FC<LeadDetailProps> = ({
  lead,
  cars,
  users,
  onUpdate,
  onClose
}) => {
  const [communications, setCommunications] = useState<LeadCommunication[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>(lead);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchCommunications();
  }, [lead.id]);

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_communications')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunications(data || []);
    } catch (err) {
      console.error('Error fetching communications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await onUpdate(lead.id, editData);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating lead:', err);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { data, error } = await supabase
        .from('lead_communications')
        .insert([{
          lead_id: lead.id,
          type: 'note',
          direction: 'outbound',
          content: newNote,
          status: 'sent'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCommunications([data, ...communications]);
      setNewNote('');
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'info';
      case 'contacted': return 'warning';
      case 'qualified': return 'success';
      case 'proposal': return 'primary';
      case 'negotiation': return 'secondary';
      case 'closed': return 'success';
      case 'lost': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'new': 'חדש',
      'contacted': 'נוצר קשר',
      'qualified': 'מתאים',
      'proposal': 'הצעה',
      'negotiation': 'משא ומתן',
      'closed': 'נסגר',
      'lost': 'אבוד'
    };
    return statusMap[status] || status;
  };

  const getPriorityText = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'low': 'נמוך',
      'medium': 'בינוני',
      'high': 'גבוה',
      'urgent': 'דחוף'
    };
    return priorityMap[priority] || priority;
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

  const getTimelineText = (timeline: string) => {
    const timelineMap: { [key: string]: string } = {
      'immediate': 'מיידי',
      '1-3_months': '1-3 חודשים',
      '3-6_months': '3-6 חודשים',
      '6+_months': '6+ חודשים'
    };
    return timelineMap[timeline] || timeline;
  };

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      default: return <Tag className="w-4 h-4" />;
    }
  };

  const getCommunicationColor = (type: string) => {
    switch (type) {
      case 'whatsapp': return 'text-green-600';
      case 'phone': return 'text-blue-600';
      case 'email': return 'text-purple-600';
      case 'note': return 'text-slc-gray';
      default: return 'text-slc-gray';
    }
  };

  const selectedCar = cars.find(car => car.id === lead.interestInCar);
  const assignedUser = users.find(user => user.id === lead.assignedTo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="heading-2 text-slc-dark hebrew">פרטי ליד</h3>
          <p className="text-slc-gray hebrew">ניהול ועקיבה אחר הליד</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="w-4 h-4 ml-2" />
            {isEditing ? 'ביטול' : 'ערוך'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Lead Information */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="heading-3 text-slc-dark hebrew">מידע בסיסי</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">שם מלא</label>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editData.firstName || ''}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                      className="input-field"
                      placeholder="שם פרטי"
                    />
                    <input
                      type="text"
                      value={editData.lastName || ''}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                      className="input-field"
                      placeholder="שם משפחה"
                    />
                  </div>
                ) : (
                  <p className="text-slc-dark hebrew">{lead.firstName} {lead.lastName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">אימייל</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="input-field"
                  />
                ) : (
                  <p className="text-slc-dark hebrew">{lead.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">טלפון</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="input-field"
                  />
                ) : (
                  <p className="text-slc-dark hebrew">{lead.phone}</p>
                )}
              </div>

              {lead.whatsapp && (
                <div>
                  <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">WhatsApp</label>
                  <p className="text-slc-dark hebrew">{lead.whatsapp}</p>
                </div>
              )}
            </div>
          </div>

          {/* Status and Priority */}
          <div className="space-y-4">
            <h4 className="heading-3 text-slc-dark hebrew">סטטוס ועדיפות</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">סטטוס</label>
                {isEditing ? (
                  <select
                    value={editData.status || lead.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                    className="input-field"
                  >
                    <option value="new">חדש</option>
                    <option value="contacted">נוצר קשר</option>
                    <option value="qualified">מתאים</option>
                    <option value="proposal">הצעה</option>
                    <option value="negotiation">משא ומתן</option>
                    <option value="closed">נסגר</option>
                    <option value="lost">אבוד</option>
                  </select>
                ) : (
                  <Badge variant={getStatusColor(lead.status) as any}>
                    {getStatusText(lead.status)}
                  </Badge>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">עדיפות</label>
                {isEditing ? (
                  <select
                    value={editData.priority || lead.priority}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value as any })}
                    className="input-field"
                  >
                    <option value="low">נמוך</option>
                    <option value="medium">בינוני</option>
                    <option value="high">גבוה</option>
                    <option value="urgent">דחוף</option>
                  </select>
                ) : (
                  <Badge variant={editData.priority === 'urgent' ? 'error' : 'default'}>
                    {getPriorityText(lead.priority)}
                  </Badge>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">מקור</label>
                <p className="text-slc-dark hebrew">{getSourceText(lead.source)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">מוקצה ל</label>
                {isEditing ? (
                  <select
                    value={editData.assignedTo || ''}
                    onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value })}
                    className="input-field"
                  >
                    <option value="">לא מוקצה</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-slc-dark hebrew">
                    {assignedUser ? assignedUser.username : 'לא מוקצה'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Car Interest and Budget */}
        <div className="mt-6 pt-6 border-t border-slc-light-gray">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">רכב מעניין</label>
              {isEditing ? (
                <select
                  value={editData.interestInCar || ''}
                  onChange={(e) => setEditData({ ...editData, interestInCar: e.target.value })}
                  className="input-field"
                >
                  <option value="">לא נבחר</option>
                  {cars.map(car => (
                    <option key={car.id} value={car.id}>
                      {car.name} - {formatCurrency(car.price)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  {selectedCar ? (
                    <>
                      <Car className="w-4 h-4 text-slc-bronze" />
                      <span className="text-slc-dark hebrew">
                        {selectedCar.name} - {formatCurrency(selectedCar.price)}
                      </span>
                    </>
                  ) : (
                    <span className="text-slc-gray hebrew">לא נבחר רכב</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">תקציב</label>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.budget || ''}
                  onChange={(e) => setEditData({ ...editData, budget: Number(e.target.value) })}
                  className="input-field"
                  placeholder="תקציב בשקלים"
                />
              ) : (
                <div className="flex items-center gap-2">
                  {lead.budget ? (
                    <>
                      <DollarSign className="w-4 h-4 text-slc-success" />
                      <span className="text-slc-dark hebrew">{formatCurrency(lead.budget)}</span>
                    </>
                  ) : (
                    <span className="text-slc-gray hebrew">לא צוין</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline and Notes */}
        <div className="mt-6 pt-6 border-t border-slc-light-gray">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">לוח זמנים</label>
              {isEditing ? (
                <select
                  value={editData.timeline || ''}
                  onChange={(e) => setEditData({ ...editData, timeline: e.target.value as any })}
                  className="input-field"
                >
                  <option value="">לא צוין</option>
                  <option value="immediate">מיידי</option>
                  <option value="1-3_months">1-3 חודשים</option>
                  <option value="3-6_months">3-6 חודשים</option>
                  <option value="6+_months">6+ חודשים</option>
                </select>
              ) : (
                <p className="text-slc-dark hebrew">
                  {lead.timeline ? getTimelineText(lead.timeline) : 'לא צוין'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">מעקב הבא</label>
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={editData.nextFollowUpDate ? new Date(editData.nextFollowUpDate).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditData({ ...editData, nextFollowUpDate: new Date(e.target.value) })}
                  className="input-field"
                />
              ) : (
                <div className="flex items-center gap-2">
                  {lead.nextFollowUpDate ? (
                    <>
                      <Clock className="w-4 h-4 text-slc-gray" />
                      <span className="text-slc-dark hebrew">{formatDate(lead.nextFollowUpDate)}</span>
                    </>
                  ) : (
                    <span className="text-slc-gray hebrew">לא נקבע</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6 pt-6 border-t border-slc-light-gray">
          <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">הערות</label>
          {isEditing ? (
            <textarea
              value={editData.notes || ''}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              className="input-field w-full h-24"
              placeholder="הערות על הליד..."
            />
          ) : (
            <p className="text-slc-dark hebrew whitespace-pre-wrap">
              {lead.notes || 'אין הערות'}
            </p>
          )}
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditData(lead);
              }}
            >
              ביטול
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
            >
              שמור שינויים
            </Button>
          </div>
        )}
      </Card>

      {/* Communications */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="heading-3 text-slc-dark hebrew">היסטוריית תקשורת</h4>
          <div className="text-sm text-slc-gray hebrew">
            {communications.length} הודעות
          </div>
        </div>

        {/* Add Note */}
        <div className="mb-6 p-4 bg-slc-light-gray rounded-lg">
          <div className="flex gap-2">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="הוסף הערה חדשה..."
              className="input-field flex-1 h-20"
            />
            <Button
              variant="primary"
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="self-end"
            >
              <Send className="w-4 h-4 ml-2" />
              שלח
            </Button>
          </div>
        </div>

        {/* Communications List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-slc-bronze border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-slc-gray hebrew">טוען הודעות...</p>
            </div>
          ) : communications.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-slc-gray mx-auto mb-2" />
              <p className="text-slc-gray hebrew">אין הודעות עדיין</p>
            </div>
          ) : (
            communications.map((comm) => (
              <div
                key={comm.id}
                className={`p-4 border rounded-lg ${
                  comm.direction === 'inbound' 
                    ? 'border-slc-info/20 bg-slc-info/5' 
                    : 'border-slc-bronze/20 bg-slc-bronze/5'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`${getCommunicationColor(comm.type)}`}>
                      {getCommunicationIcon(comm.type)}
                    </div>
                    <span className="text-sm font-medium text-slc-dark hebrew">
                      {comm.type === 'note' ? 'הערה' : 
                       comm.type === 'whatsapp' ? 'WhatsApp' :
                       comm.type === 'phone' ? 'טלפון' :
                       comm.type === 'email' ? 'אימייל' : comm.type}
                    </span>
                    <Badge variant={comm.direction === 'inbound' ? 'info' : 'primary'} size="sm">
                      {comm.direction === 'inbound' ? 'נכנס' : 'יוצא'}
                    </Badge>
                  </div>
                  <span className="text-xs text-slc-gray hebrew">
                    {formatDate(comm.createdAt)}
                  </span>
                </div>
                
                <div className="text-slc-dark hebrew whitespace-pre-wrap">
                  {comm.content}
                </div>
                
                {comm.subject && (
                  <div className="mt-2 text-sm text-slc-gray hebrew">
                    <strong>נושא:</strong> {comm.subject}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default LeadDetail;
