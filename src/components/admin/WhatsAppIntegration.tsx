import React, { useState, useEffect } from 'react';
import { QrCode, MessageCircle, Wifi, WifiOff, Send, Settings, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button, Badge, Card } from '../ui';
import { initializeWhatsApp, getWhatsAppStatus, disconnectWhatsApp, getQRCode, sendWhatsAppMessage } from '../../utils/whatsapp';
import { supabase } from '../../utils/supabase';

interface WhatsAppIntegrationProps {
  className?: string;
}

const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({ className = '' }) => {
  const [qrCode, setQrCode] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    checkConnectionStatus();
    loadSessionData();
  }, []);

  const checkConnectionStatus = () => {
    const status = getWhatsAppStatus();
    setIsConnected(status.isConnected);
  };

  const loadSessionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('whatsapp_sessions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setSessionData(data);
        }
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);

      const client = await initializeWhatsApp();
      
      // Get QR code
      const qr = await getQRCode();
      setQrCode(qr);

      // Set up connection status monitoring
      const checkStatus = setInterval(() => {
        const status = getWhatsAppStatus();
        if (status.isConnected) {
          setIsConnected(true);
          setIsConnecting(false);
          setQrCode('');
          clearInterval(checkStatus);
          saveSessionData();
        }
      }, 1000);

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(checkStatus);
        if (!isConnected) {
          setIsConnecting(false);
          setConnectionError('פג תוקף הקישור. נסה שוב.');
        }
      }, 120000);

    } catch (error) {
      setIsConnecting(false);
      setConnectionError(error instanceof Error ? error.message : 'שגיאה בחיבור');
    }
  };

  const handleDisconnect = async () => {
    try {
      disconnectWhatsApp();
      setIsConnected(false);
      setQrCode('');
      setConnectionError(null);
      await clearSessionData();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const saveSessionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('whatsapp_sessions')
          .upsert([{
            user_id: user.id,
            is_connected: true,
            last_activity: new Date().toISOString()
          }]);

        if (error) throw error;
        await loadSessionData();
      }
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  };

  const clearSessionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('whatsapp_sessions')
          .update({
            is_connected: false,
            last_activity: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
        setSessionData(null);
      }
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone || !testMessage) return;

    try {
      setSendingTest(true);
      await sendWhatsAppMessage(testPhone, testMessage);
      
      // Clear form
      setTestMessage('');
      setTestPhone('');
      
      // Show success feedback
      alert('הודעה נשלחה בהצלחה!');
    } catch (error) {
      alert(`שגיאה בשליחת ההודעה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    } finally {
      setSendingTest(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="heading-2 text-slc-dark hebrew">אינטגרציית WhatsApp</h2>
          <p className="text-slc-gray hebrew">ניהול חיבור WhatsApp לניהול לידים</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              מחובר
            </Badge>
          ) : (
            <Badge variant="error" className="flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              מנותק
            </Badge>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="heading-3 text-slc-dark hebrew">סטטוס חיבור</h3>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="flex items-center gap-2"
              >
                <WifiOff className="w-4 h-4" />
                נתק
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center gap-2"
              >
                {isConnecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4" />
                )}
                {isConnecting ? 'מתחבר...' : 'התחבר'}
              </Button>
            )}
          </div>
        </div>

        {/* Connection Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="heading-4 text-slc-dark mb-3 hebrew">מידע חיבור</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slc-gray hebrew">סטטוס:</span>
                <span className={`font-medium ${isConnected ? 'text-slc-success' : 'text-slc-error'}`}>
                  {isConnected ? 'מחובר' : 'מנותק'}
                </span>
              </div>
              
              {sessionData && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slc-gray hebrew">תאריך חיבור:</span>
                    <span className="text-slc-dark hebrew">
                      {formatDate(sessionData.created_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slc-gray hebrew">פעילות אחרונה:</span>
                    <span className="text-slc-dark hebrew">
                      {formatDate(sessionData.last_activity)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="heading-4 text-slc-dark mb-3 hebrew">הוראות חיבור</h4>
            <div className="space-y-2 text-sm text-slc-gray hebrew">
              <p>1. לחץ על "התחבר" כדי ליצור קישור</p>
              <p>2. סרוק את קוד ה-QR עם WhatsApp</p>
              <p>3. אשר את החיבור במכשיר הנייד</p>
              <p>4. המערכת תתחבר אוטומטית</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {connectionError && (
          <div className="mt-4 p-4 bg-slc-error/10 border border-slc-error/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-slc-error" />
              <p className="text-slc-error hebrew">{connectionError}</p>
            </div>
          </div>
        )}
      </Card>

      {/* QR Code Display */}
      {qrCode && (
        <Card className="p-6">
          <div className="text-center">
            <h3 className="heading-3 text-slc-dark mb-4 hebrew">סרוק קוד QR</h3>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white border border-slc-light-gray rounded-lg">
                <img
                  src={qrCode}
                  alt="QR Code for WhatsApp connection"
                  className="w-64 h-64"
                />
              </div>
            </div>
            <p className="text-slc-gray hebrew">
              פתח WhatsApp במכשיר הנייד וסרוק את הקוד
            </p>
          </div>
        </Card>
      )}

      {/* Test Message */}
      {isConnected && (
        <Card className="p-6">
          <h3 className="heading-3 text-slc-dark mb-4 hebrew">בדיקת הודעה</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                מספר טלפון (עם קוד מדינה)
              </label>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="972501234567"
                className="input-field w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slc-gray mb-2 hebrew">
                תוכן ההודעה
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="כתוב הודעת בדיקה..."
                className="input-field w-full h-24"
              />
            </div>
            
            <Button
              variant="primary"
              onClick={handleSendTestMessage}
              disabled={!testPhone || !testMessage || sendingTest}
              className="flex items-center gap-2"
            >
              {sendingTest ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sendingTest ? 'שולח...' : 'שלח הודעת בדיקה'}
            </Button>
          </div>
        </Card>
      )}

      {/* Features */}
      <Card className="p-6">
        <h3 className="heading-3 text-slc-dark mb-4 hebrew">תכונות זמינות</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-slc-light-gray rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-slc-bronze" />
              <h4 className="font-medium text-slc-dark hebrew">קבלת הודעות</h4>
            </div>
            <p className="text-sm text-slc-gray hebrew">
              קבלת הודעות אוטומטית ויצירת לידים חדשים
            </p>
          </div>
          
          <div className="p-4 border border-slc-light-gray rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-5 h-5 text-slc-bronze" />
              <h4 className="font-medium text-slc-dark hebrew">שליחת הודעות</h4>
            </div>
            <p className="text-sm text-slc-gray hebrew">
              שליחת הודעות אוטומטיות ותבניות מותאמות
            </p>
          </div>
          
          <div className="p-4 border border-slc-light-gray rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-slc-bronze" />
              <h4 className="font-medium text-slc-dark hebrew">ניהול תבניות</h4>
            </div>
            <p className="text-sm text-slc-gray hebrew">
              ניהול תבניות הודעות מותאמות אישית
            </p>
          </div>
          
          <div className="p-4 border border-slc-light-gray rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-5 h-5 text-slc-bronze" />
              <h4 className="font-medium text-slc-dark hebrew">חיבור מאובטח</h4>
            </div>
            <p className="text-sm text-slc-gray hebrew">
              חיבור מאובטח עם QR code ושמירת session
            </p>
          </div>
          
          <div className="p-4 border border-slc-light-gray rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-slc-bronze" />
              <h4 className="font-medium text-slc-dark hebrew">מעקב הודעות</h4>
            </div>
            <p className="text-sm text-slc-gray hebrew">
              מעקב אחר סטטוס הודעות והיסטוריית תקשורת
            </p>
          </div>
          
          <div className="p-4 border border-slc-light-gray rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-5 h-5 text-slc-bronze" />
              <h4 className="font-medium text-slc-dark hebrew">סנכרון אוטומטי</h4>
            </div>
            <p className="text-sm text-slc-gray hebrew">
              סנכרון אוטומטי עם מערכת ניהול הלידים
            </p>
          </div>
        </div>
      </Card>

      {/* Session Management */}
      {sessionData && (
        <Card className="p-6">
          <h3 className="heading-3 text-slc-dark mb-4 hebrew">ניהול Session</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">
                  תאריך יצירה
                </label>
                <p className="text-slc-dark hebrew">
                  {formatDate(sessionData.created_at)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slc-gray mb-1 hebrew">
                  פעילות אחרונה
                </label>
                <p className="text-slc-dark hebrew">
                  {formatDate(sessionData.last_activity)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="flex items-center gap-2"
              >
                <WifiOff className="w-4 h-4" />
                נתק Session
              </Button>
              
              <Button
                variant="outline"
                onClick={loadSessionData}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                רענן נתונים
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppIntegration;
