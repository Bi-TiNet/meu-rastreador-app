// src/components/UserManagement.tsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Form, Button, Row, Col, FloatingLabel, Spinner, Alert, Tabs, Tab, ListGroup, Badge } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

interface Profile extends User {
    full_name: string;
    role: 'admin' | 'tecnico' | 'seguradora';
}

export function UserManagement() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('seguradora');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');
    if (data) {
        setUsers(data as Profile[]);
    }
    if (error) {
        setMessage({ type: 'danger', text: 'Não foi possível carregar os usuários.' });
    }
    setLoadingUsers(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Separa os usuários por função para as abas
  const { admins, technicians, insurances } = useMemo(() => {
    const admins: Profile[] = [];
    const technicians: Profile[] = [];
    const insurances: Profile[] = [];
    users.forEach(user => {
      if (user.role === 'admin') admins.push(user);
      else if (user.role === 'tecnico') technicians.push(user);
      else insurances.push(user);
    });
    return { admins, technicians, insurances };
  }, [users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Acesso negado.");

        const response = await fetch('/.netlify/functions/create-user', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role, fullName })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Falha ao criar usuário.');

        setMessage({ type: 'success', text: result.message });
        setFullName('');
        setEmail('');
        setPassword('');
        fetchUsers();
    } catch (err: any) {
        setMessage({ type: 'danger', text: err.message });
    } finally {
        setLoading(false);
    }
  };

  const handleResetPassword = async (userEmail: string | null) => {
    if (!userEmail || !window.confirm(`Tem certeza que deseja enviar um link de recuperação de senha para ${userEmail}?`)) {
        return;
    }
    setMessage(null);
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Acesso negado.");

        const response = await fetch('/.netlify/functions/reset-password', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        
        setMessage({ type: 'success', text: `Email de recuperação enviado para ${userEmail}.` });
    } catch (err: any) {
        setMessage({ type: 'danger', text: err.message });
    }
  };

  const renderUserList = (userList: Profile[]) => {
    if (loadingUsers) return <div className="text-center p-4"><Spinner animation="border" /></div>;
    if (userList.length === 0) return <p className="text-muted p-4 text-center">Nenhum usuário encontrado.</p>;

    return (
        <ListGroup variant="flush">
            {userList.map(user => (
                <ListGroup.Item key={user.id} className="d-flex justify-content-between align-items-center">
                    <div>
                        <div className="fw-bold">{user.full_name || 'Nome não definido'}</div>
                        <div className="text-muted small">{user.email}</div>
                    </div>
                    {/* CORREÇÃO APLICADA AQUI: Adicionado '|| null' para garantir o tipo correto */}
                    <Button variant="outline-secondary" size="sm" onClick={() => handleResetPassword(user.email || null)}>
                        <i className="bi bi-key-fill me-1"></i> Redefinir Senha
                    </Button>
                </ListGroup.Item>
            ))}
        </ListGroup>
    );
  }

  return (
    <Row className="g-4">
      <Col lg={5}>
        <Card className="h-100">
          <Card.Header as="h5"><i className="bi bi-person-plus-fill me-2"></i>Cadastrar Novo Usuário</Card.Header>
          <Card.Body>
            {message && <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>{message.text}</Alert>}
            <Form onSubmit={handleSubmit}>
                <FloatingLabel label="Nome Completo" className="mb-3">
                    <Form.Control type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </FloatingLabel>
                <FloatingLabel label="Email" className="mb-3">
                    <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </FloatingLabel>
                <FloatingLabel label="Senha" className="mb-3">
                    <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </FloatingLabel>
                <FloatingLabel label="Nível de Acesso" className="mb-3">
                    <Form.Select value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="seguradora">Seguradora</option>
                        <option value="tecnico">Técnico</option>
                        <option value="admin">Administrador</option>
                    </Form.Select>
                </FloatingLabel>
              <Button type="submit" className="w-100" disabled={loading}>
                {loading ? <Spinner as="span" size="sm" /> : 'Cadastrar Usuário'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
      <Col lg={7}>
          <Card className="h-100">
              <Card.Header as="h5"><i className="bi bi-people-fill me-2"></i>Usuários Cadastrados</Card.Header>
              <Card.Body className="p-0">
                  <Tabs defaultActiveKey="admins" id="user-roles-tabs" className="px-3" fill>
                      <Tab eventKey="admins" title={<><Badge bg="primary" pill className="me-2">{admins.length}</Badge> Administradores</>}>
                          {renderUserList(admins)}
                      </Tab>
                      <Tab eventKey="technicians" title={<><Badge bg="success" pill className="me-2">{technicians.length}</Badge> Técnicos</>}>
                          {renderUserList(technicians)}
                      </Tab>
                      <Tab eventKey="insurances" title={<><Badge className="badge-purple me-2" pill>{insurances.length}</Badge> Seguradoras</>}>
                          {renderUserList(insurances)}
                      </Tab>
                  </Tabs>
              </Card.Body>
          </Card>
      </Col>
    </Row>
  );
}