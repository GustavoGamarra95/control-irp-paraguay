import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 border rounded shadow bg-white">
      <h2 className="text-2xl font-bold mb-2 text-center">Cambiar contraseña</h2>
      <p className="text-sm text-gray-600 mb-4 text-center">Ingresa tu email y recibirás instrucciones para cambiar tu contraseña.</p>
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
    </div>
  );
}
