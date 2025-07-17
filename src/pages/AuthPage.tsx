import React from 'react';
import AuthForm from '@/components/auth/AuthForm';
// import Navbar from '@/components/ui/navbar';
import { useLocation } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const msg = params.get('msg');
  return (
    <>
      {/* <Navbar /> */}
      {msg && (
        <div className="mb-4 text-center text-red-600 font-semibold">{decodeURIComponent(msg)}</div>
      )}
      <AuthForm />
    </>
  );
};

export default AuthPage; 