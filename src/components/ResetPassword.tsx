// src/components/ResetPassword.tsx
import { useState, type FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Card, Form, FloatingLabel, Button, Spinner, Alert, Container } from 'react-bootstrap';

export function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'danger', text: string} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se há um token de recuperação na URL quando a página carrega
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // O Supabase já lidou com o token da URL e iniciou a sessão de recuperação
        setMessage({ type: 'success', text: 'Sessão de recuperação iniciada. Por favor, defina sua nova senha.' });
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handlePasswordReset = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'danger', text: 'As senhas não coincidem.' });
      return;
    }
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      setMessage({ type: 'danger', text: `Erro ao redefinir senha: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Sua senha foi redefinida com sucesso! Redirecionando para o login...' });
      setTimeout(() => navigate('/login'), 3000);
    }
    setLoading(false);
  };

  return (
    <Container style={{ maxWidth: '400px' }} className="mt-5">
      <Card>
        <Card.Header as="h4" className="text-center">
          <i className="bi bi-key-fill me-2"></i>
          Redefinir Senha
        </Card.Header>
        <Card.Body className="p-4">
          <Form onSubmit={handlePasswordReset}>
            {message && <Alert variant={message.type}>{message.text}</Alert>}
            <FloatingLabel controlId="floatingNewPassword" label="Nova Senha" className="mb-3">
              <Form.Control 
                type="password" 
                placeholder="Nova Senha" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FloatingLabel>

            <FloatingLabel controlId="floatingConfirmPassword" label="Confirmar Nova Senha">
              <Form.Control 
                type="password" 
                placeholder="Confirmar Nova Senha" 
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </FloatingLabel>
            
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-4 py-2" 
              disabled={loading}
            >
              {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Salvar Nova Senha'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}