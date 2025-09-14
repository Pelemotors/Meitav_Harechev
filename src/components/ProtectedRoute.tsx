import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Permission } from '../utils/permissions';
import { validateSingleAdmin } from '../utils/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">אין לך הרשאה</h2>
        <p className="text-gray-600">אין לך הרשאה לגשת לדף זה</p>
      </div>
    </div>
  )
}) => {
  const { user, isAuthenticated, hasPermission } = useAuth();
  const [isValidated, setIsValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateAccess = async () => {
      if (isAuthenticated && user) {
        const isValid = await validateSingleAdmin();
        setIsValidated(isValid);
      } else {
        setIsValidated(false);
      }
      setIsValidating(false);
    };

    validateAccess();
  }, [isAuthenticated, user]);

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">נדרשת התחברות</h2>
          <p className="text-gray-600">אנא התחבר כדי לגשת לדף זה</p>
        </div>
      </div>
    );
  }

  // Check if user is validated as authorized admin
  if (!isValidated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">גישה נדחתה</h2>
          <p className="text-gray-600 mb-4">אין לך הרשאה לגשת למערכת הניהול</p>
          <p className="text-sm text-gray-500">רק מנהל מורשה יכול לגשת למערכת זו</p>
        </div>
      </div>
    );
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? permissions.every(p => hasPermission(p))
      : permissions.some(p => hasPermission(p));

    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
