import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Car,
  DollarSign,
  Edit,
  Save,
  X,
  Send
} from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface Lead {
  id: string;
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
  lead_type: string;
  source: string;
  status: string;
  priority: string;
  interested_cars: string[];
  notes?: string;
  budget_min?: number;
  budget_max?: number;
  financing_needed: boolean;
  down_payment?: number;
  monthly_payment_max?: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  last_contact_at?: string;
}

interface Communication {
  id: string;
  communication_type: string;
  subject?: string;
  content: string;
  direction: string;
  outcome?: string;
  follow_up_date?: string;
  created_at: string;
  user_id?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  task_type: string;
  due_date?: string;
  completed_at?: string;
  status: string;
  assigned_to?: string;
  created_at: string;
}

interface LeadDetailProps {
  leadId: string;
  onBack: () => void;
}

const LeadDetail: React.FC<LeadDetailProps> = ({ leadId, onBack }) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAddCommunication, setShowAddCommunication] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  
  // טופס תקשורת חדשה
  const [newCommunication, setNewCommunication] = useState({
    communication_type: 'call',
    subject: '',
    content: '',
    direction: 'outbound',
    outcome: '',
    follow_up_date: ''
  });

  // טופס משימה חדשה
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_type: 'call',
    due_date: '',
    assigned_to: ''
  });

  // טעינת נתוני הליד
  const fetchLeadData = async () => {
    try {
      setLoading(true);
      
      // טעינת פרטי הליד
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;
      setLead(leadData);

      // טעינת תקשורות
      const { data: commData, error: commError } = await supabase
        .from('lead_communications')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (commError) throw commError;
      setCommunications(commData || []);

      // טעינת משימות
      const { data: tasksData, error: tasksError } = await supabase
        .from('lead_tasks')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

    } catch (error) {
      console.error('Error fetching lead data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
  }, [leadId]);

  // עדכון פרטי ליד
  const updateLead = async (updates: Partial<Lead>) => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId);

      if (error) throw error;
      
      setLead({ ...lead, ...updates });
      setEditing(false);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  // הוספת תקשורת חדשה
  const addCommunication = async () => {
    try {
      const { error } = await supabase
        .from('lead_communications')
        .insert({
          lead_id: leadId,
          ...newCommunication,
          follow_up_date: newCommunication.follow_up_date || null
        });

      if (error) throw error;
      
      setNewCommunication({
        communication_type: 'call',
        subject: '',
        content: '',
        direction: 'outbound',
        outcome: '',
        follow_up_date: ''
      });
      setShowAddCommunication(false);
      fetchLeadData();
    } catch (error) {
      console.error('Error adding communication:', error);
    }
  };

  // הוספת משימה חדשה
  const addTask = async () => {
    try {
      const { error } = await supabase
        .from('lead_tasks')
        .insert({
          lead_id: leadId,
          ...newTask,
          due_date: newTask.due_date || null,
          assigned_to: newTask.assigned_to || null
        });

      if (error) throw error;
      
      setNewTask({
        title: '',
        description: '',
        task_type: 'call',
        due_date: '',
        assigned_to: ''
      });
      setShowAddTask(false);
      fetchLeadData();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // עדכון סטטוס משימה
  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('lead_tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      fetchLeadData();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">ליד לא נמצא</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* כותרת וניווט */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowRight className="w-4 h-4" />
            חזור לרשימה
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {lead.first_name} {lead.last_name}
            </h1>
            <p className="text-gray-600">פרטי ליד</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setEditing(!editing)}
            className="btn-secondary flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            {editing ? 'בטל עריכה' : 'ערוך'}
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Send className="w-4 h-4" />
            שלח הודעה
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* פרטי ליד */}
        <div className="lg:col-span-2 space-y-6">
          {/* מידע בסיסי */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטים אישיים</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם פרטי
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={lead.first_name}
                    onChange={(e) => setLead({...lead, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  />
                ) : (
                  <p className="text-gray-900">{lead.first_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם משפחה
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={lead.last_name || ''}
                    onChange={(e) => setLead({...lead, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  />
                ) : (
                  <p className="text-gray-900">{lead.last_name || '-'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  טלפון
                </label>
                <div className="flex items-center gap-2">
                  {editing ? (
                    <input
                      type="tel"
                      value={lead.phone}
                      onChange={(e) => setLead({...lead, phone: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                    />
                  ) : (
                    <>
                      <p className="text-gray-900">{lead.phone}</p>
                      <button className="text-primary hover:text-primary-dark">
                        <Phone className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  אימייל
                </label>
                <div className="flex items-center gap-2">
                  {editing ? (
                    <input
                      type="email"
                      value={lead.email || ''}
                      onChange={(e) => setLead({...lead, email: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                    />
                  ) : (
                    <>
                      <p className="text-gray-900">{lead.email || '-'}</p>
                      {lead.email && (
                        <button className="text-primary hover:text-primary-dark">
                          <Mail className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {editing && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => updateLead(lead)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  שמור שינויים
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  בטל
                </button>
              </div>
            )}
          </div>

          {/* הערות */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">הערות</h2>
            {editing ? (
              <textarea
                value={lead.notes || ''}
                onChange={(e) => setLead({...lead, notes: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                placeholder="הוסף הערות..."
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">
                {lead.notes || 'אין הערות'}
              </p>
            )}
          </div>

          {/* תקשורות */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">תקשורות</h2>
              <button
                onClick={() => setShowAddCommunication(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                הוסף תקשורת
              </button>
            </div>

            {showAddCommunication && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-md font-medium text-gray-900 mb-4">תקשורת חדשה</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newCommunication.communication_type}
                      onChange={(e) => setNewCommunication({...newCommunication, communication_type: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="call">שיחה</option>
                      <option value="email">אימייל</option>
                      <option value="sms">SMS</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="meeting">פגישה</option>
                      <option value="note">הערה</option>
                    </select>

                    <select
                      value={newCommunication.direction}
                      onChange={(e) => setNewCommunication({...newCommunication, direction: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="inbound">נכנס</option>
                      <option value="outbound">יוצא</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="נושא"
                    value={newCommunication.subject}
                    onChange={(e) => setNewCommunication({...newCommunication, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  />

                  <textarea
                    placeholder="תוכן התקשורת"
                    value={newCommunication.content}
                    onChange={(e) => setNewCommunication({...newCommunication, content: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="תוצאה"
                      value={newCommunication.outcome}
                      onChange={(e) => setNewCommunication({...newCommunication, outcome: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                    />

                    <input
                      type="datetime-local"
                      value={newCommunication.follow_up_date}
                      onChange={(e) => setNewCommunication({...newCommunication, follow_up_date: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={addCommunication}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      שמור
                    </button>
                    <button
                      onClick={() => setShowAddCommunication(false)}
                      className="btn-secondary"
                    >
                      בטל
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {communications.map((comm) => (
                <div key={comm.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {comm.communication_type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        comm.direction === 'inbound' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {comm.direction === 'inbound' ? 'נכנס' : 'יוצא'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(comm.created_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  
                  {comm.subject && (
                    <h4 className="font-medium text-gray-900 mb-2">{comm.subject}</h4>
                  )}
                  
                  <p className="text-gray-700 text-sm">{comm.content}</p>
                  
                  {comm.outcome && (
                    <p className="text-sm text-gray-600 mt-2">
                      <strong>תוצאה:</strong> {comm.outcome}
                    </p>
                  )}
                  
                  {comm.follow_up_date && (
                    <p className="text-sm text-gray-600">
                      <strong>מעקב:</strong> {new Date(comm.follow_up_date).toLocaleDateString('he-IL')}
                    </p>
                  )}
                </div>
              ))}

              {communications.length === 0 && (
                <p className="text-gray-500 text-center py-4">אין תקשורות עדיין</p>
              )}
            </div>
          </div>

          {/* משימות */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">משימות</h2>
              <button
                onClick={() => setShowAddTask(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                הוסף משימה
              </button>
            </div>

            {showAddTask && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-md font-medium text-gray-900 mb-4">משימה חדשה</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="כותרת המשימה"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  />

                  <textarea
                    placeholder="תיאור המשימה"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={newTask.task_type}
                      onChange={(e) => setNewTask({...newTask, task_type: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="call">שיחה</option>
                      <option value="email">אימייל</option>
                      <option value="meeting">פגישה</option>
                      <option value="follow_up">מעקב</option>
                      <option value="other">אחר</option>
                    </select>

                    <input
                      type="datetime-local"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={addTask}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      שמור
                    </button>
                    <button
                      onClick={() => setShowAddTask(false)}
                      className="btn-secondary"
                    >
                      בטל
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className={`px-2 py-1 text-xs rounded-full border-0 focus:ring-2 focus:ring-primary ${
                        task.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="pending">ממתין</option>
                      <option value="in_progress">בביצוע</option>
                      <option value="completed">הושלם</option>
                      <option value="cancelled">בוטל</option>
                    </select>
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-700 text-sm mb-2">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {task.task_type}
                    </span>
                    {task.due_date && (
                      <span>תאריך יעד: {new Date(task.due_date).toLocaleDateString('he-IL')}</span>
                    )}
                    <span>נוצר: {new Date(task.created_at).toLocaleDateString('he-IL')}</span>
                  </div>
                </div>
              ))}

              {tasks.length === 0 && (
                <p className="text-gray-500 text-center py-4">אין משימות עדיין</p>
              )}
            </div>
          </div>
        </div>

        {/* סיידבר */}
        <div className="space-y-6">
          {/* סטטוס ועדיפות */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">סטטוס</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סטטוס ליד
                </label>
                <select
                  value={lead.status}
                  onChange={(e) => updateLead({ status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="new">חדש</option>
                  <option value="contacted">יצרתי קשר</option>
                  <option value="qualified">מתאים</option>
                  <option value="converted">התגייר</option>
                  <option value="lost">אבד</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  עדיפות
                </label>
                <select
                  value={lead.priority}
                  onChange={(e) => updateLead({ priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="low">נמוך</option>
                  <option value="medium">בינוני</option>
                  <option value="high">גבוה</option>
                  <option value="urgent">דחוף</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סוג ליד
                </label>
                <select
                  value={lead.lead_type}
                  onChange={(e) => updateLead({ lead_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="general">כללי</option>
                  <option value="car_inquiry">חקירה על רכב</option>
                  <option value="financing">מימון</option>
                  <option value="service">שירות</option>
                </select>
              </div>
            </div>
          </div>

          {/* מידע על התקציב */}
          {(lead.budget_min || lead.budget_max || lead.financing_needed) && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">מידע תקציבי</h2>
              
              <div className="space-y-3">
                {lead.budget_min && (
                  <div>
                    <span className="text-sm text-gray-600">תקציב מינימלי:</span>
                    <p className="font-medium">₪{lead.budget_min.toLocaleString()}</p>
                  </div>
                )}
                
                {lead.budget_max && (
                  <div>
                    <span className="text-sm text-gray-600">תקציב מקסימלי:</span>
                    <p className="font-medium">₪{lead.budget_max.toLocaleString()}</p>
                  </div>
                )}
                
                {lead.financing_needed && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium">מעוניין במימון</span>
                    </div>
                    
                    {lead.down_payment && (
                      <p className="text-sm text-blue-700 mt-1">
                        מקדמה: ₪{lead.down_payment.toLocaleString()}
                      </p>
                    )}
                    
                    {lead.monthly_payment_max && (
                      <p className="text-sm text-blue-700">
                        החזר חודשי מקסימלי: ₪{lead.monthly_payment_max.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* מידע על התאריכים */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">מידע נוסף</h2>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">נוצר:</span>
                <p className="font-medium">{new Date(lead.created_at).toLocaleDateString('he-IL')}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">עודכן:</span>
                <p className="font-medium">{new Date(lead.updated_at).toLocaleDateString('he-IL')}</p>
              </div>
              
              {lead.last_contact_at && (
                <div>
                  <span className="text-sm text-gray-600">קשר אחרון:</span>
                  <p className="font-medium">{new Date(lead.last_contact_at).toLocaleDateString('he-IL')}</p>
                </div>
              )}
              
              <div>
                <span className="text-sm text-gray-600">מקור:</span>
                <p className="font-medium">{lead.source}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;