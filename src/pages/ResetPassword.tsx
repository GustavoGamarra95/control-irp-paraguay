import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('type') === 'recovery') {
      setRecoveryMode(true);
    } else {
      setRecoveryMode(false);
    }
  }, [location.search]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setMessage('Si el email existe, recibirás instrucciones para cambiar tu contraseña.');
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setError(error.message);
    else {
      setMessage('Contraseña actualizada correctamente. Ahora puedes iniciar sesión.');
      setTimeout(() => navigate('/login'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 border rounded shadow bg-white">
      <h2 className="text-2xl font-bold mb-2 text-center">
        {recoveryMode ? 'Restablecer contraseña' : 'Solicitar cambio de contraseña'}
      </h2>
      {recoveryMode ? (
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña"
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
            onClick={() => navigate('/login')}
          >
            Volver al login
          </button>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          {message && <div className="text-green-600 text-sm text-center">{message}</div>}
        </form>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4 text-center">
            Ingresa tu email y recibirás instrucciones para cambiar tu contraseña.
          </p>
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="border px-3 py-2 rounded"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-4 py-2 rounded"
            >
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
            <button
              type="button"
              className="text-blue-600 underline"
              onClick={() => navigate('/login')}
            >
              Volver al login
            </button>
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            {message && <div className="text-green-600 text-sm text-center">{message}</div>}
          </form>
        </>
      )}
    </div>
  );
}
