import React, { useState } from 'react';
import { Edit, Trash2, Eye, Phone, Mail, MessageCircle, Calendar, User, Car, DollarSign, Clock, Tag } from 'lucide-react';
import { Lead } from '../../types';
import { Button, Badge, Card } from '../ui';

interface LeadsTableProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
  onDeleteLead: (leadId: string) => void;
  selectedLeadId?: string;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  getStatusText: (status: string) => string;
  getPriorityText: (priority: string) => string;
}

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onSelectLead,
  onUpdateLead,
  onDeleteLead,
  selectedLeadId,
  getStatusColor,
  getPriorityColor,
  getStatusText,
  getPriorityText
}) => {
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      case 'website': return <Eye className="w-4 h-4" />;
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

  const getTimelineText = (timeline: string) => {
    const timelineMap: { [key: string]: string } = {
      'immediate': 'מיידי',
      '1-3_months': '1-3 חודשים',
      '3-6_months': '3-6 חודשים',
      '6+_months': '6+ חודשים'
    };
    return timelineMap[timeline] || timeline;
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    let aValue: any = a[sortBy as keyof Lead];
    let bValue: any = b[sortBy as keyof Lead];

    if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'lastContactDate' || sortBy === 'nextFollowUpDate') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const isOverdue = (date: Date | string | undefined) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (leads.length === 0) {
    return (
      <Card className="p-8 text-center">
        <User className="w-16 h-16 text-slc-gray mx-auto mb-4" />
        <h3 className="heading-3 text-slc-dark mb-2 hebrew">אין לידים</h3>
        <p className="text-slc-gray hebrew">
          עדיין לא נוצרו לידים במערכת
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slc-light-gray">
            <tr>
              <th className="text-right p-4 hebrew">
                <button
                  onClick={() => handleSort('firstName')}
                  className="flex items-center gap-2 hover:text-slc-bronze transition-colors"
                >
                  שם
                  {sortBy === 'firstName' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="text-center p-4 hebrew">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-2 hover:text-slc-bronze transition-colors"
                >
                  סטטוס
                  {sortBy === 'status' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="text-center p-4 hebrew">
                <button
                  onClick={() => handleSort('priority')}
                  className="flex items-center gap-2 hover:text-slc-bronze transition-colors"
                >
                  עדיפות
                  {sortBy === 'priority' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="text-center p-4 hebrew">מקור</th>
              <th className="text-center p-4 hebrew">רכב</th>
              <th className="text-center p-4 hebrew">תקציב</th>
              <th className="text-center p-4 hebrew">
                <button
                  onClick={() => handleSort('nextFollowUpDate')}
                  className="flex items-center gap-2 hover:text-slc-bronze transition-colors"
                >
                  מעקב הבא
                  {sortBy === 'nextFollowUpDate' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="text-center p-4 hebrew">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-2 hover:text-slc-bronze transition-colors"
                >
                  תאריך יצירה
                  {sortBy === 'createdAt' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="text-center p-4 hebrew">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.map((lead) => (
              <tr
                key={lead.id}
                className={`
                  border-b border-slc-light-gray hover:bg-slc-light-gray/50 transition-colors cursor-pointer
                  ${selectedLeadId === lead.id ? 'bg-slc-bronze/10' : ''}
                  ${isOverdue(lead.nextFollowUpDate) ? 'bg-slc-error/5' : ''}
                `}
                onClick={() => onSelectLead(lead)}
              >
                {/* Name and Contact */}
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slc-bronze/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slc-bronze" />
                    </div>
                    <div>
                      <div className="font-medium text-slc-dark hebrew">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-sm text-slc-gray hebrew">{lead.email}</div>
                      <div className="text-sm text-slc-gray hebrew">{lead.phone}</div>
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="p-4 text-center">
                  <Badge variant={getStatusColor(lead.status) as any} size="sm">
                    {getStatusText(lead.status)}
                  </Badge>
                </td>

                {/* Priority */}
                <td className="p-4 text-center">
                  <Badge variant={getPriorityColor(lead.priority) as any} size="sm">
                    {getPriorityText(lead.priority)}
                  </Badge>
                </td>

                {/* Source */}
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {getSourceIcon(lead.source)}
                    <span className="text-sm hebrew">{getSourceText(lead.source)}</span>
                  </div>
                </td>

                {/* Car Interest */}
                <td className="p-4 text-center">
                  {lead.interestInCar ? (
                    <div className="flex items-center justify-center gap-2">
                      <Car className="w-4 h-4 text-slc-bronze" />
                      <span className="text-sm hebrew">רכב נבחר</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slc-gray hebrew">לא צוין</span>
                  )}
                </td>

                {/* Budget */}
                <td className="p-4 text-center">
                  {lead.budget ? (
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="w-4 h-4 text-slc-success" />
                      <span className="text-sm font-medium">{formatCurrency(lead.budget)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slc-gray hebrew">לא צוין</span>
                  )}
                </td>

                {/* Next Follow Up */}
                <td className="p-4 text-center">
                  {lead.nextFollowUpDate ? (
                    <div className={`flex items-center justify-center gap-2 ${isOverdue(lead.nextFollowUpDate) ? 'text-slc-error' : ''}`}>
                      <Clock className={`w-4 h-4 ${isOverdue(lead.nextFollowUpDate) ? 'text-slc-error' : 'text-slc-gray'}`} />
                      <span className={`text-sm ${isOverdue(lead.nextFollowUpDate) ? 'font-bold' : ''}`}>
                        {formatDate(lead.nextFollowUpDate)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slc-gray hebrew">לא נקבע</span>
                  )}
                </td>

                {/* Created Date */}
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4 text-slc-gray" />
                    <span className="text-sm hebrew">{formatDate(lead.createdAt)}</span>
                  </div>
                </td>

                {/* Actions */}
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLead(lead);
                      }}
                      className="text-slc-bronze hover:text-slc-bronze"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Quick edit functionality
                      }}
                      className="text-slc-info hover:text-slc-info"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('האם אתה בטוח שברצונך למחוק ליד זה?')) {
                          onDeleteLead(lead.id);
                        }
                      }}
                      className="text-slc-error hover:text-slc-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="p-4 bg-slc-light-gray border-t border-slc-light-gray">
        <div className="flex items-center justify-between text-sm text-slc-gray hebrew">
          <span>סה"כ {leads.length} לידים</span>
          <div className="flex items-center gap-4">
            <span>חדשים: {leads.filter(l => l.status === 'new').length}</span>
            <span>דחופים: {leads.filter(l => l.priority === 'urgent').length}</span>
            <span>מעקב: {leads.filter(l => isOverdue(l.nextFollowUpDate)).length}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LeadsTable;
