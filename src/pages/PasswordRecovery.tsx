import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

export default function PasswordRecovery() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    // Validaciones básicas
    if (!currentPassword || !newPassword || !repeatPassword) {
      setError('Completa todos los campos.');
      return;
    }

    // Validar longitud mínima
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    // Validar que las contraseñas coincidan
    if (newPassword !== repeatPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }

    // Validar que la nueva contraseña sea diferente a la actual
    if (newPassword === currentPassword) {
      setError('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setLoading(true);
    try {
      // Reautenticar con la contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      
      if (signInError) {
        setError('La contraseña actual es incorrecta.');
        return;
      }

      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (updateError) throw updateError;
      
      setMessage('Contraseña actualizada correctamente.');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 border rounded shadow bg-white">
      <h2 className="text-2xl font-bold mb-2 text-center">Cambiar contraseña</h2>
      <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
        <input
          type="password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          placeholder="Contraseña actual"
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="Nueva contraseña"
          required
          className="border px-3 py-2 rounded"
        />
        <input
          type="password"
          value={repeatPassword}
          onChange={e => setRepeatPassword(e.target.value)}
          placeholder="Repetir nueva contraseña"
          required
          className="border px-3 py-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
        <button
          type="button"
          className="text-blue-600 underline"
          onClick={() => navigate('/')}
        >
          Volver al inicio
        </button>
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        {message && <div className="text-green-600 text-sm text-center">{message}</div>}
      </form>
    </div>
  );
}
