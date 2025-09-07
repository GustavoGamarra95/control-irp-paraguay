import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiKey } from 'react-icons/fi';
import { supabase } from '../lib/supabaseClient';

const UserMenu: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const avatar = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="relative">
      <button
        className="w-10 h-10 rounded-full bg-white border flex items-center justify-center shadow hover:shadow-md transition"
        onClick={() => setOpen(!open)}
        title={user.email}
        style={{ boxShadow: open ? '0 4px 16px rgba(0,0,0,0.12)' : undefined }}
      >
        <span className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-primary">
          {avatar}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-primary">
              {avatar}
            </span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{user.email}</div>
              <div className="text-xs text-gray-500">Cuenta activa</div>
            </div>
          </div>
          <button
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-sm"
            onClick={() => {
              setOpen(false);
              navigate('/reset-password');
            }}
          >
            <FiKey className="text-lg" /> Cambiar contraseña
          </button>
          <div className="border-t" />
          <button
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-100 text-sm text-red-600"
            onClick={async () => {
              await supabase.auth.signOut();
              setOpen(false);
              navigate('/login');
            }}
          >
            <FiLogOut className="text-lg" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
