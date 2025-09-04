// Arquivo: src/components/InstallationForm.tsx
import { useState } from 'react';
import { Form, Button, Card, Row, Col, FloatingLabel, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../supabaseClient';

interface InstallationFormProps {
  onSuccess?: () => void;
}

export function InstallationForm({ onSuccess }: InstallationFormProps) {
  const [formData, setFormData] = useState({
    nome_completo: '',
    contato: '',
    placa: '',
    modelo: '',
    ano: '',
    cor: '',
    endereco: '',
    usuario: '',
    senha: '',
    base: 'Atena',
    bloqueio: 'Sim',
    tipo_servico: 'Instalação',
    observacao: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: id === 'placa' ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const response = await fetch('/.netlify/functions/create-installation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar instalação.');
      }

      setMessage({ type: 'success', text: 'Instalação cadastrada com sucesso!' });
      setFormData({
        nome_completo: '',
        contato: '',
        placa: '',
        modelo: '',
        ano: '',
        cor: '',
        endereco: '',
        usuario: '',
        senha: '',
        base: 'Atena',
        bloqueio: 'Sim',
        tipo_servico: 'Instalação',
        observacao: '',
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Header as="h5">
        <i className="bi bi-plus-circle me-2"></i>Nova Solicitação
      </Card.Header>
      <Card.Body>
        {message && (
          <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
            {message.text}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <h6 className="text-primary">DADOS DO CLIENTE E VEÍCULO</h6>
          <hr className="mt-2" />

          <Row className="g-3 mb-4">
            <Col md={6}>
              <FloatingLabel label="Nome Completo">
                <Form.Control id="nome_completo" value={formData.nome_completo} onChange={handleChange} required />
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel label="Contato">
                <Form.Control id="contato" value={formData.contato} onChange={handleChange} required />
              </FloatingLabel>
            </Col>
            <Col md={4}>
              <FloatingLabel label="Placa">
                <Form.Control id="placa" value={formData.placa} onChange={handleChange} required />
              </FloatingLabel>
            </Col>
            <Col md={4}>
              <FloatingLabel label="Modelo">
                <Form.Control id="modelo" value={formData.modelo} onChange={handleChange} />
              </FloatingLabel>
            </Col>
            <Col md={2}>
              <FloatingLabel label="Ano">
                <Form.Control id="ano" value={formData.ano} onChange={handleChange} />
              </FloatingLabel>
            </Col>
            <Col md={2}>
              <FloatingLabel label="Cor">
                <Form.Control id="cor" value={formData.cor} onChange={handleChange} />
              </FloatingLabel>
            </Col>
            <Col md={12}>
              <FloatingLabel label="Endereço">
                <Form.Control
                  as="textarea"
                  style={{ height: '80px' }}
                  id="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                />
              </FloatingLabel>
            </Col>
          </Row>

          <h6 className="text-primary">DETALHES DO SERVIÇO E ACESSO</h6>
          <hr className="mt-2" />

          <Row className="g-3">
            <Col md={6}>
              <FloatingLabel label="Tipo de Serviço">
                <Form.Select id="tipo_servico" value={formData.tipo_servico} onChange={handleChange}>
                  <option>Instalação</option>
                  <option>Manutenção</option>
                  <option>Remoção</option>
                </Form.Select>
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel label="Base">
                <Form.Select id="base" value={formData.base} onChange={handleChange}>
                  <option>Atena</option>
                  <option>Autocontrol</option>
                </Form.Select>
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel label="Usuário">
                <Form.Control id="usuario" value={formData.usuario} onChange={handleChange} />
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel label="Senha">
                <Form.Control type="text" id="senha" value={formData.senha} onChange={handleChange} />
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel label="Bloqueio">
                <Form.Select id="bloqueio" value={formData.bloqueio} onChange={handleChange}>
                  <option>Sim</option>
                  <option>Nao</option>
                </Form.Select>
              </FloatingLabel>
            </Col>
            <Col md={12}>
              <FloatingLabel label="Observação">
                <Form.Control
                  as="textarea"
                  style={{ height: '100px' }}
                  id="observacao"
                  value={formData.observacao}
                  onChange={handleChange}
                />
              </FloatingLabel>
            </Col>
          </Row>

          <div className="mt-4 text-end">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner as="span" size="sm" /> : 'Cadastrar'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
