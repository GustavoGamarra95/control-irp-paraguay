import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setError('Por favor ingresa un email válido.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/login'
      }
    });
    if (error) setError(error.message);
    else setMessage('¡Registro exitoso! Revisa tu correo y haz clic en el enlace para validar tu cuenta.');
    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto mt-12 p-6 border rounded shadow bg-white">
      <h2 className="text-2xl font-bold mb-2 text-center">Crear cuenta</h2>
      <p className="text-sm text-gray-600 mb-4 text-center">Regístrate para guardar y acceder a tus datos fiscales de forma segura.</p>
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
          className={`border px-3 py-2 rounded ${error && !email.match(/^[^@]+@[^@]+\.[^@]+$/) ? 'border-red-500' : ''}`}
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña (mínimo 6 caracteres)"
          required
          className={`border px-3 py-2 rounded ${error && password.length < 6 ? 'border-red-500' : ''}`}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition"
        >
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
        <button
          type="button"
          className="text-blue-600 underline"
          onClick={() => navigate('/login')}
        >
          ¿Ya tienes cuenta? Inicia sesión
        </button>
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        {message && <div className="text-green-600 text-sm text-center">{message}</div>}
      </form>
      <div className="mt-4 text-xs text-gray-500 text-center">
        <span>Recibirás un correo de confirmación. Debes validar tu email antes de poder iniciar sesión.</span>
      </div>
    </div>
  );
}
