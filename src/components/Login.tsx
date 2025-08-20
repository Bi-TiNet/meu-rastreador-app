// src/components/Login.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Card, Form, FloatingLabel, Button, Spinner, Alert, Container } from 'react-bootstrap';

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
      // Verifica a role do usuário e redireciona para a página correta
      const userRole = user?.app_metadata?.role || 'admin';
      navigate(userRole === 'admin' ? '/painel' : '/');
    }
  };

  return (
    <Container style={{ maxWidth: '400px' }} className="mt-5">
      <Card>
        <Card.Header as="h4" className="text-center">
          <i className="bi bi-box-arrow-in-right me-2"></i>
          Login
        </Card.Header>
        <Card.Body className="p-4">
          <Form onSubmit={handleLogin}>
            {error && <Alert variant="danger">{error}</Alert>}
            <FloatingLabel controlId="floatingEmail" label="Email" className="mb-3">
              <Form.Control 
                type="email" 
                placeholder="seu@email.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FloatingLabel>

            <FloatingLabel controlId="floatingPassword" label="Senha">
              <Form.Control 
                type="password" 
                placeholder="Senha" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FloatingLabel>
            
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-4 py-2" 
              disabled={loading}
            >
              {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Entrar'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}