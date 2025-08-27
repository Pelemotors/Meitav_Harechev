import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, MessageCircle, Eye, Copy, Settings } from 'lucide-react';
import { WhatsAppTemplate } from '../../types';
import { supabase } from '../../utils/supabase';
import { Button, Badge, Card } from '../ui';

interface WhatsAppTemplatesProps {
  className?: string;
}

const WhatsAppTemplates: React.FC<WhatsAppTemplatesProps> = ({ className = '' }) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת תבניות');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (templateData: Partial<WhatsAppTemplate>) => {
    try {
      if (editingTemplate) {
        // Update existing template
        const { data, error } = await supabase
          .from('whatsapp_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)
          .select()
          .single();

        if (error) throw error;
        
        setTemplates(templates.map(t => t.id === editingTemplate.id ? data : t));
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('whatsapp_templates')
          .insert([templateData])
          .select()
          .single();

        if (error) throw error;
        
        setTemplates([...templates, data]);
      }

      setShowForm(false);
      setEditingTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירת תבנית');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תבנית זו?')) return;

    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      
      setTemplates(templates.filter(t => t.id !== templateId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת תבנית');
    }
  };

  const handleToggleActive = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .update({ is_active: isActive })
        .eq('id', templateId);

      if (error) throw error;
      
      setTemplates(templates.map(t => 
        t.id === templateId ? { ...t, isActive } : t
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון תבנית');
    }
  };

  const replaceTemplateVariables = (content: string, variables: Record<string, string>): string => {
    let result = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || `{{${key}}}`);
    });
    
    return result;
  };

  const getCategoryText = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'greeting': 'ברכה',
      'follow_up': 'מעקב',
      'car_info': 'מידע רכב',
      'pricing': 'הצעה',
      'appointment': 'פגישה',
      'closing': 'סגירה'
    };
    return categoryMap[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'greeting': 'success',
      'follow_up': 'warning',
      'car_info': 'info',
      'pricing': 'primary',
      'appointment': 'secondary',
      'closing': 'success'
    };
    return colorMap[category] || 'default';
  };

  const getDefaultVariables = (category: string) => {
    const variableMap: { [key: string]: Record<string, string> } = {
      'greeting': { firstName: 'ישראל' },
      'follow_up': { firstName: 'ישראל' },
      'car_info': { 
        firstName: 'ישראל', 
        carName: 'BMW X5 2023', 
        price: '₪350,000', 
        year: '2023', 
        kilometers: '15,000' 
      },
      'pricing': { 
        firstName: 'ישראל', 
        carName: 'BMW X5 2023', 
        price: '₪350,000', 
        financeTerms: '60 חודשים, 7% ריבית' 
      },
      'appointment': { firstName: 'ישראל', carName: 'BMW X5 2023' },
      'closing': { firstName: 'ישראל' }
    };
    return variableMap[category] || { firstName: 'ישראל' };
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-slc-bronze border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slc-gray hebrew">טוען תבניות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-2 text-slc-dark hebrew">תבניות WhatsApp</h2>
          <p className="text-slc-gray hebrew">ניהול תבניות הודעות אוטומטיות</p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          תבנית חדשה
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-slc-error/10 border border-slc-error/20 rounded-lg">
          <p className="text-slc-error text-center hebrew">{error}</p>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="heading-3 text-slc-dark hebrew">{template.name}</h3>
                <Badge variant={getCategoryColor(template.category) as any} size="sm">
                  {getCategoryText(template.category)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewData(getDefaultVariables(template.category));
                    setShowPreview(template.id);
                  }}
                  className="text-slc-info hover:text-slc-info"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingTemplate(template);
                    setShowForm(true);
                  }}
                  className="text-slc-bronze hover:text-slc-bronze"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-slc-error hover:text-slc-error"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-slc-gray hebrew mb-2">תוכן:</p>
              <div className="text-sm text-slc-dark hebrew bg-slc-light-gray p-3 rounded-lg max-h-24 overflow-y-auto">
                {template.content}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-slc-gray hebrew mb-2">משתנים:</p>
              <div className="flex flex-wrap gap-1">
                {template.variables.map((variable) => (
                  <Badge key={variable} variant="outline" size="sm">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={template.isActive}
                  onChange={(e) => handleToggleActive(template.id, e.target.checked)}
                  className="rounded border-slc-gray"
                />
                <span className="text-sm text-slc-gray hebrew">פעיל</span>
              </div>
              
              <div className="text-xs text-slc-gray hebrew">
                {new Date(template.updatedAt).toLocaleDateString('he-IL')}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <TemplateForm
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setShowForm(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          template={templates.find(t => t.id === showPreview)!}
          previewData={previewData}
          onClose={() => setShowPreview(null)}
        />
      )}
    </div>
  );
};

// Template Form Component
interface TemplateFormProps {
  template: WhatsAppTemplate | null;
  onSave: (data: Partial<WhatsAppTemplate>) => void;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<WhatsAppTemplate>>({
    name: '',
    category: 'greeting',
    content: '',
    variables: [],
    isActive: true,
    ...template
  });

  const [newVariable, setNewVariable] = useState('');

  const handleInputChange = (field: keyof WhatsAppTemplate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddVariable = () => {
    if (newVariable && !formData.variables?.includes(newVariable)) {
      setFormData(prev => ({
        ...prev,
        variables: [...(prev.variables || []), newVariable]
      }));
      setNewVariable('');
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables?.filter(v => v !== variable) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.content) {
      alert('נא למלא את כל השדות החובה');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-slc-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slc-light-gray">
          <div className="flex items-center justify-between">
            <h3 className="heading-2 text-slc-dark hebrew">
              {template ? 'ערוך תבנית' : 'תבנית חדשה'}
            </h3>
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
            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                שם התבנית *
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="input-field w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                קטגוריה
              </label>
              <select
                value={formData.category || 'greeting'}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="input-field w-full"
              >
                <option value="greeting">ברכה</option>
                <option value="follow_up">מעקב</option>
                <option value="car_info">מידע רכב</option>
                <option value="pricing">הצעה</option>
                <option value="appointment">פגישה</option>
                <option value="closing">סגירה</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                תוכן ההודעה *
              </label>
              <textarea
                value={formData.content || ''}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="input-field w-full h-32"
                placeholder="כתוב את תוכן ההודעה כאן. השתמש ב-{{משתנה}} להכנסת משתנים."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                משתנים
              </label>
              
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  className="input-field flex-1"
                  placeholder="שם משתנה"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddVariable}
                  disabled={!newVariable}
                >
                  הוסף
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.variables?.map((variable) => (
                  <Badge key={variable} variant="outline" className="flex items-center gap-1">
                    {variable}
                    <button
                      type="button"
                      onClick={() => handleRemoveVariable(variable)}
                      className="text-slc-error hover:text-slc-error"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-slc-gray"
              />
              <span className="text-sm text-slc-gray hebrew">תבנית פעילה</span>
            </div>

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
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {template ? 'עדכן' : 'צור'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

// Preview Modal Component
interface PreviewModalProps {
  template: WhatsAppTemplate;
  previewData: Record<string, string>;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ template, previewData, onClose }) => {
  const [currentPreviewData, setCurrentPreviewData] = useState(previewData);

  const replaceTemplateVariables = (content: string, variables: Record<string, string>): string => {
    let result = content;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || `{{${key}}}`);
    });
    
    return result;
  };

  const previewContent = replaceTemplateVariables(template.content, currentPreviewData);

  return (
    <div className="fixed inset-0 bg-slc-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-slc-light-gray">
          <div className="flex items-center justify-between">
            <h3 className="heading-2 text-slc-dark hebrew">תצוגה מקדימה</h3>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slc-gray hover:text-slc-dark"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            <div>
              <h4 className="heading-3 text-slc-dark mb-2 hebrew">{template.name}</h4>
              <Badge variant="outline">{template.category}</Badge>
            </div>

            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                ערכי משתנים לבדיקה
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {template.variables.map((variable) => (
                  <div key={variable}>
                    <label className="block text-xs text-slc-gray mb-1 hebrew">
                      {variable}
                    </label>
                    <input
                      type="text"
                      value={currentPreviewData[variable] || ''}
                      onChange={(e) => setCurrentPreviewData(prev => ({
                        ...prev,
                        [variable]: e.target.value
                      }))}
                      className="input-field w-full text-sm"
                      placeholder={`ערך עבור ${variable}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                תצוגה מקדימה
              </label>
              <div className="bg-slc-light-gray p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-slc-dark hebrew whitespace-pre-wrap">
                        {previewContent}
                      </p>
                    </div>
                    <div className="text-xs text-slc-gray mt-2 hebrew">
                      {new Date().toLocaleTimeString('he-IL')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WhatsAppTemplates;
