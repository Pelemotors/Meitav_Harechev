import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Upload, BarChart3, MessageCircle, Phone, Mail, Calendar, Tag, User, DollarSign } from 'lucide-react';
import { Lead, Car, User as UserType } from '../../types';
import { supabase } from '../../utils/supabase';
import { Button, Badge, Card } from '../ui';
import LeadsTable from './LeadsTable';
import LeadDetail from './LeadDetail';
import LeadForm from './LeadForm';

interface LeadsManagerProps {
  className?: string;
}

const LeadsManager: React.FC<LeadsManagerProps> = ({ className = '' }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');

  useEffect(() => {
    fetchLeads();
    fetchCars();
    fetchUsers();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          cars:interest_in_car(id, name, brand, model, price),
          users:assigned_to(id, username, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת לידים');
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, name, brand, model, price')
        .eq('isActive', true)
        .order('name');

      if (error) throw error;
      setCars(data || []);
    } catch (err) {
      console.error('Error fetching cars:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, role')
        .order('username');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreateLead = async (leadData: Partial<Lead>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;
      
      setLeads([data, ...leads]);
      setShowLeadForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת ליד');
    }
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      
      setLeads(leads.map(lead => lead.id === leadId ? data : lead));
      if (selectedLead?.id === leadId) {
        setSelectedLead(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון ליד');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;
      
      setLeads(leads.filter(lead => lead.id !== leadId));
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת ליד');
    }
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'urgent': return 'error';
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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    const matchesAssigned = assignedFilter === 'all' || lead.assignedTo === assignedFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssigned;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    closed: leads.filter(l => l.status === 'closed').length,
    urgent: leads.filter(l => l.priority === 'urgent').length
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-slc-bronze border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slc-gray hebrew">טוען לידים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-2 text-slc-dark hebrew">ניהול לידים</h2>
          <p className="text-slc-gray hebrew">ניהול ועקיבה אחר לידים ופניות</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {/* TODO: Export functionality */}}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            ייצוא
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {/* TODO: Import functionality */}}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            ייבוא
          </Button>
          
          <Button
            variant="primary"
            onClick={() => setShowLeadForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            ליד חדש
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slc-dark">{stats.total}</div>
          <div className="text-sm text-slc-gray hebrew">סה"כ לידים</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slc-info">{stats.new}</div>
          <div className="text-sm text-slc-gray hebrew">חדשים</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slc-warning">{stats.contacted}</div>
          <div className="text-sm text-slc-gray hebrew">נוצר קשר</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slc-success">{stats.qualified}</div>
          <div className="text-sm text-slc-gray hebrew">מתאימים</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slc-success">{stats.closed}</div>
          <div className="text-sm text-slc-gray hebrew">נסגרו</div>
        </Card>
        
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-slc-error">{stats.urgent}</div>
          <div className="text-sm text-slc-gray hebrew">דחופים</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
              חיפוש
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slc-gray" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש לפי שם, אימייל או טלפון..."
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
              סטטוס
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">כל הסטטוסים</option>
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
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">כל העדיפויות</option>
              <option value="low">נמוך</option>
              <option value="medium">בינוני</option>
              <option value="high">גבוה</option>
              <option value="urgent">דחוף</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
              מוקצה ל
            </label>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="input-field w-full"
            >
              <option value="all">כל המשתמשים</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-slc-error/10 border border-slc-error/20 rounded-lg">
          <p className="text-slc-error text-center hebrew">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads Table */}
        <div className="lg:col-span-2">
          <LeadsTable
            leads={filteredLeads}
            onSelectLead={setSelectedLead}
            onUpdateLead={handleUpdateLead}
            onDeleteLead={handleDeleteLead}
            selectedLeadId={selectedLead?.id}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            getStatusText={getStatusText}
            getPriorityText={getPriorityText}
          />
        </div>

        {/* Lead Detail Sidebar */}
        <div className="lg:col-span-1">
          {selectedLead ? (
            <LeadDetail
              lead={selectedLead}
              cars={cars}
              users={users}
              onUpdate={handleUpdateLead}
              onClose={() => setSelectedLead(null)}
            />
          ) : (
            <Card className="p-8 text-center">
              <User className="w-16 h-16 text-slc-gray mx-auto mb-4" />
              <h3 className="heading-3 text-slc-dark mb-2 hebrew">בחר ליד</h3>
              <p className="text-slc-gray hebrew">
                בחר ליד מהרשימה כדי לצפות בפרטים ולנהל אותו
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <LeadForm
          cars={cars}
          users={users}
          onSubmit={handleCreateLead}
          onCancel={() => setShowLeadForm(false)}
        />
      )}
    </div>
  );
};

export default LeadsManager;
