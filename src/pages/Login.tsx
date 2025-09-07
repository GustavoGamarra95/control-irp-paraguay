import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      // Validación por email
      if (user.email_confirmed_at || user.confirmed_at) {
        navigate('/');
      } else {
        setError('Debes verificar tu email antes de continuar.');
      }
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else setMessage('Login exitoso.');
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setMessage('Si el email existe, recibirás instrucciones para recuperar tu contraseña.');
    setLoading(false);
  };

  if (authLoading) {
    return <div className="text-center mt-12">Cargando...</div>;
  }

  if (user && !(user.email_confirmed_at || user.confirmed_at)) {
    return (
      <div className="max-w-sm mx-auto mt-12 p-6 border rounded shadow text-center">
        <h2 className="text-2xl font-bold mb-4">Verifica tu email</h2>
        <p className="mb-4">Debes verificar tu correo electrónico antes de continuar.</p>
        <button className="bg-primary text-white px-4 py-2 rounded" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Iniciar sesión</h2>
      <form onSubmit={showReset ? handleReset : handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="border px-3 py-2 rounded"
        />
        {!showReset && (
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            className="border px-3 py-2 rounded"
          />
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          {showReset ? 'Recuperar contraseña' : 'Ingresar'}
        </button>
        <button
          type="button"
          className="text-blue-600 underline"
          onClick={() => setShowReset(!showReset)}
        >
          {showReset ? 'Volver a login' : '¿Olvidaste tu contraseña?'}
        </button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {message && <div className="text-green-600 text-sm">{message}</div>}
        <button
          type="button"
          className="text-blue-600 underline mt-2"
          onClick={() => window.location.href = '/register'}
        >
          ¿No tienes cuenta? Crear una
        </button>
      </form>
    </div>
  );
}
