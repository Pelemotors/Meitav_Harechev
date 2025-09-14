import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  Filter, 
  Search, 
  Plus,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Star
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
  created_at: string;
  last_contact_at?: string;
  communications_count: number;
  pending_tasks: number;
  next_task_due?: string;
  assigned_to?: string;
  assigned_to_email?: string;
}

interface LeadFilters {
  status: string;
  priority: string;
  lead_type: string;
  source: string;
  assigned_to: string;
  date_from: string;
  date_to: string;
}

const LeadsManager: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<LeadFilters>({
    status: '',
    priority: '',
    lead_type: '',
    source: '',
    assigned_to: '',
    date_from: '',
    date_to: ''
  });
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // טעינת לידים
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // סינון לידים
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      lead.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filters.status === '' || lead.status === filters.status;
    const matchesPriority = filters.priority === '' || lead.priority === filters.priority;
    const matchesType = filters.lead_type === '' || lead.lead_type === filters.lead_type;
    const matchesSource = filters.source === '' || lead.source === filters.source;

    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesSource;
  });

  // עדכון סטטוס ליד
  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;
      
      // רענון הרשימה
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  // מחיקת ליד
  const deleteLead = async (leadId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הליד?')) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;
      
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  // קבלת צבע סטטוס
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-emerald-100 text-emerald-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // קבלת צבע עדיפות
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // קבלת שם סטטוס בעברית
  const getStatusName = (status: string) => {
    const statusNames: { [key: string]: string } = {
      'new': 'חדש',
      'contacted': 'יצרתי קשר',
      'qualified': 'מתאים',
      'converted': 'התגייר',
      'lost': 'אבד'
    };
    return statusNames[status] || status;
  };

  // קבלת שם עדיפות בעברית
  const getPriorityName = (priority: string) => {
    const priorityNames: { [key: string]: string } = {
      'urgent': 'דחוף',
      'high': 'גבוה',
      'medium': 'בינוני',
      'low': 'נמוך'
    };
    return priorityNames[priority] || priority;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* כותרת וכלי בקרה */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול לידים</h1>
          <p className="text-gray-600">ניהול ועקיבה אחר לידים פוטנציאליים</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            סינון
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            ליד חדש
          </button>
        </div>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">סה"כ לידים</p>
              <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">התגיירו</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(l => l.status === 'converted').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">ממתינים</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(l => l.status === 'new').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">דחופים</p>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(l => l.priority === 'urgent').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* סינון וחיפוש */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="חיפוש לידים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
              />
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
            >
              <option value="">כל הסטטוסים</option>
              <option value="new">חדש</option>
              <option value="contacted">יצרתי קשר</option>
              <option value="qualified">מתאים</option>
              <option value="converted">התגייר</option>
              <option value="lost">אבד</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
            >
              <option value="">כל העדיפויות</option>
              <option value="urgent">דחוף</option>
              <option value="high">גבוה</option>
              <option value="medium">בינוני</option>
              <option value="low">נמוך</option>
            </select>

            <select
              value={filters.lead_type}
              onChange={(e) => setFilters({...filters, lead_type: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
            >
              <option value="">כל הסוגים</option>
              <option value="general">כללי</option>
              <option value="car_inquiry">חקירה על רכב</option>
              <option value="financing">מימון</option>
              <option value="service">שירות</option>
            </select>

            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({...filters, date_from: e.target.value})}
              placeholder="מתאריך"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />

            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({...filters, date_to: e.target.value})}
              placeholder="עד תאריך"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />

            <button
              onClick={() => setFilters({
                status: '',
                priority: '',
                lead_type: '',
                source: '',
                assigned_to: '',
                date_from: '',
                date_to: ''
              })}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              נקה סינון
            </button>
          </div>
        )}
      </div>

      {/* טבלת לידים */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ליד
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קשר
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  עדיפות
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תקשורת
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  משימות
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תאריך יצירה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.first_name} {lead.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.lead_type === 'general' ? 'כללי' : 
                           lead.lead_type === 'car_inquiry' ? 'חקירה על רכב' :
                           lead.lead_type === 'financing' ? 'מימון' : 'שירות'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.phone}</div>
                    {lead.email && (
                      <div className="text-sm text-gray-500">{lead.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={lead.status}
                      onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)} border-0 focus:ring-2 focus:ring-primary`}
                    >
                      <option value="new">חדש</option>
                      <option value="contacted">יצרתי קשר</option>
                      <option value="qualified">מתאים</option>
                      <option value="converted">התגייר</option>
                      <option value="lost">אבד</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(lead.priority)}`}>
                      {getPriorityName(lead.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {lead.communications_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.pending_tasks > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {lead.pending_tasks} ממתינות
                      </span>
                    ) : (
                      <span className="text-gray-500">אין</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex gap-2 justify-end">
                      <button className="text-primary hover:text-primary-dark">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteLead(lead.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">אין לידים</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'לא נמצאו לידים התואמים לסינון שלך'
                : 'עדיין לא נוספו לידים למערכת'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsManager;