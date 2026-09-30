import { isLoggedIn } from '@/hooks/api/auth';
import { useAppSelector } from '@/store';
import { storage } from '@/utils';
import { Navigate } from 'react-router-dom';




export const RoleProtector = ({ element, role } : { element: JSX.Element, role: string }): JSX.Element => {
    const token = storage.getToken()

    const user = isLoggedIn();
  

  
    if (!token && !user) return <Navigate to={'/login'} />;


    return element;
};
