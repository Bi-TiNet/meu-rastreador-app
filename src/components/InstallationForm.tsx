// Arquivo: src/components/InstallationForm.tsx
import { useState, useRef, type FormEvent } from 'react';
import { Form, Button, Card, Row, Col, FloatingLabel, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import './InstallationForm.css'; // Importando o novo CSS

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

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  
  // Usamos um ref para o formulário para acionar a validação visual do Bootstrap
  const formRef = useRef<HTMLFormElement>(null);
  const [validated, setValidated] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: id === 'placa' ? value.toUpperCase() : value,
    }));
  };
  
  // Função para validar apenas os campos da etapa atual
  const validateStep = () => {
    const inputs = formRef.current?.querySelectorAll(`.form-step.active .form-control, .form-step.active .form-select`);
    if (!inputs) return false;

    for (const input of Array.from(inputs)) {
        if (!(input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).checkValidity()) {
            // Aciona a validação visual do Bootstrap
            setValidated(true); 
            return false;
        }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setValidated(false); // Reseta a validação para a próxima etapa
      setCurrentStep(prev => prev + 1);
    } else {
        // Força a exibição das mensagens de erro do navegador se o formulário for inválido
        formRef.current?.reportValidity();
    }
  };
  
  const handleBack = () => {
    setValidated(false); // Reseta a validação ao voltar
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep()) {
        formRef.current?.reportValidity();
        return;
    }

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

      setMessage({ type: 'success', text: 'Solicitação cadastrada com sucesso!' });
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
      setCurrentStep(1); // Resetar para o primeiro passo
      setValidated(false);
      if (onSuccess) onSuccess();

    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, name: 'Cliente', icon: 'bi-person' },
    { number: 2, name: 'Veículo', icon: 'bi-car-front' },
    { number: 3, name: 'Serviço', icon: 'bi-gear' }
  ];

  return (
    <Card className="p-4 p-md-5 border-0 shadow-lg">
      <Card.Body>
        <div className="text-center mb-5">
          <h2 className="fw-bold">Nova Solicitação de Instalação</h2>
          <p className="text-muted">Preencha os dados em 3 passos para concluir o cadastro.</p>
        </div>

        {/* Barra de Progresso */}
        <div className="progress-bar-container">
            <div className="progress-bar-line"></div>
            <div className="progress-bar-line-active" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}></div>
            {steps.map(step => (
                <div key={step.number} className={`progress-step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}>
                    <div className="step-circle"><i className={`bi ${step.icon}`}></i></div>
                    <div className="step-name">{step.name}</div>
                </div>
            ))}
        </div>

        {message && (
          <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>
            {message.text}
          </Alert>
        )}

        <Form ref={formRef} onSubmit={handleSubmit} noValidate validated={validated}>
          {/* Passo 1: Dados do Cliente */}
          <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
            <h4 className="text-primary mb-4">Dados do Cliente</h4>
            <Row className="g-3">
              <Col md={6}>
                <FloatingLabel label="Nome Completo">
                  <Form.Control id="nome_completo" value={formData.nome_completo} onChange={handleChange} required />
                </FloatingLabel>
              </Col>
              <Col md={6}>
                <FloatingLabel label="Contato (Telefone/WhatsApp)">
                  <Form.Control id="contato" value={formData.contato} onChange={handleChange} required />
                </FloatingLabel>
              </Col>
              <Col md={12}>
                <FloatingLabel label="Endereço Completo da Instalação">
                  <Form.Control as="textarea" style={{ height: '100px' }} id="endereco" value={formData.endereco} onChange={handleChange} required />
                </FloatingLabel>
              </Col>
            </Row>
          </div>

          {/* Passo 2: Dados do Veículo */}
          <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
            <h4 className="text-primary mb-4">Dados do Veículo</h4>
            <Row className="g-3">
                <Col md={4}>
                    <FloatingLabel label="Placa">
                        <Form.Control id="placa" value={formData.placa} onChange={handleChange} required minLength={7} />
                    </FloatingLabel>
                </Col>
                <Col md={8}>
                    <FloatingLabel label="Modelo do Veículo">
                        <Form.Control id="modelo" value={formData.modelo} onChange={handleChange} required />
                    </FloatingLabel>
                </Col>
                <Col md={6}>
                    <FloatingLabel label="Ano">
                        <Form.Control id="ano" type="number" value={formData.ano} onChange={handleChange} required />
                    </FloatingLabel>
                </Col>
                <Col md={6}>
                    <FloatingLabel label="Cor">
                        <Form.Control id="cor" value={formData.cor} onChange={handleChange} required />
                    </FloatingLabel>
                </Col>
            </Row>
          </div>

          {/* Passo 3: Detalhes do Serviço */}
          <div className={`form-step ${currentStep === 3 ? 'active' : ''}`}>
            <h4 className="text-primary mb-4">Detalhes do Serviço e Acesso</h4>
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
                    <FloatingLabel label="Base do Rastreador">
                        <Form.Select id="base" value={formData.base} onChange={handleChange}>
                        <option>Atena</option>
                        <option>Autocontrol</option>
                        </Form.Select>
                    </FloatingLabel>
                </Col>
                <Col md={6}>
                    <FloatingLabel label="Usuário de Acesso">
                        <Form.Control id="usuario" value={formData.usuario} onChange={handleChange} />
                    </FloatingLabel>
                </Col>
                <Col md={6}>
                    <FloatingLabel label="Senha de Acesso">
                        <Form.Control type="text" id="senha" value={formData.senha} onChange={handleChange} />
                    </FloatingLabel>
                </Col>
                <Col md={12}>
                    <FloatingLabel label="Observações (opcional)">
                        <Form.Control as="textarea" style={{ height: '100px' }} id="observacao" value={formData.observacao} onChange={handleChange} />
                    </FloatingLabel>
                </Col>
            </Row>
          </div>
          
          {/* Botões de Navegação - VERIFIQUE AQUI */}
          <div className="form-navigation-buttons">
            {currentStep > 1 ? (
                // Este botão NÃO envia o formulário
                <Button variant="secondary" type="button" onClick={handleBack} className="px-4">
                    <i className="bi bi-arrow-left me-2"></i> Voltar
                </Button>
            ) : <div/> /* Placeholder para manter o alinhamento */}
            
            {currentStep < steps.length ? (
                // Este botão NÃO envia o formulário
                <Button variant="primary" type="button" onClick={handleNext} className="px-4">
                    Avançar <i className="bi bi-arrow-right ms-2"></i>
                </Button>
            ) : (
                // Este é o ÚNICO botão que envia o formulário
                <Button variant="success" type="submit" disabled={loading} className="px-5">
                    {loading ? <Spinner as="span" size="sm" /> : <span><i className="bi bi-check-lg me-2"></i>Finalizar</span>}
                </Button>
            )}
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}