// src/components/Login.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      const userRole = user?.app_metadata?.role;
      if (userRole === 'admin' || userRole === 'tecnico') {
        navigate('/painel');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl">
        <div className="text-center">
            <img src="/logo-icon.png" className="w-20 h-20 mx-auto" alt="Logo"/>
            <h2 className="mt-6 text-3xl font-bold text-center text-white">
                Bem-vindo de volta
            </h2>
            <p className="mt-2 text-center text-sm text-slate-400">
                Acesse sua conta para continuar
            </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="p-3 text-sm text-center text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg" role="alert">
              {error}
            </div>
          )}
          
          <div className="relative">
            <input
              type="email"
              id="email"
              className="block w-full px-4 py-3 text-white bg-slate-700/50 border border-slate-600 rounded-lg peer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder=" "
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="email" className="absolute text-sm text-slate-400 duration-300 transform -translate-y-4 scale-75 top-3 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 left-4">
              Email
            </label>
          </div>

          <div className="relative">
            <input
              type="password"
              id="password"
              className="block w-full px-4 py-3 text-white bg-slate-700/50 border border-slate-600 rounded-lg peer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder=" "
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
             <label htmlFor="password" className="absolute text-sm text-slate-400 duration-300 transform -translate-y-4 scale-75 top-3 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 left-4">
              Senha
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-3 text-center transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
            ) : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}