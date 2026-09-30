import { useAppSelector } from '@/store';
import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

function AdminProtector() {
    const { user } = useAppSelector((state: any) => state.userState);
    const navigate =  useNavigate()
    useEffect(() => {
      

        if (!user || user.role !=="admin" ) {
            navigate('/login');
        }
        
    }, [user, navigate]);

  return (
    <div><Outlet /></div>
  )
}

export default AdminProtector