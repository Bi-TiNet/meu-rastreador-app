// Arquivo: src/components/InstallationForm.tsx
import { useState, useRef } from 'react';
import { Form, Button, Card, Row, Col, FloatingLabel, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import './InstallationForm.css';

interface InstallationFormProps {
  onSuccess?: () => void;
}

// Interface para definir a estrutura de uma observação
interface Observacao {
  texto: string;
  destaque: boolean;
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
    // --- LÓGICA DE OBSERVAÇÃO ATUALIZADA PARA UM ARRAY ---
    observacoes: [{ texto: '', destaque: false }] as Observacao[],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);
  const [validated, setValidated] = useState(false);

  // --- FUNÇÕES PARA MANIPULAR O ARRAY DE OBSERVAÇÕES ---

  // Adiciona um novo campo de observação em branco
  const adicionarObservacao = () => {
    setFormData(prev => ({
      ...prev,
      observacoes: [...prev.observacoes, { texto: '', destaque: false }]
    }));
  };

  // Remove um campo de observação pelo seu índice
  const removerObservacao = (index: number) => {
    setFormData(prev => ({
      ...prev,
      observacoes: prev.observacoes.filter((_, i) => i !== index)
    }));
  };

  // Atualiza uma observação específica no array
  const handleObservacaoChange = (index: number, field: keyof Observacao, value: string | boolean) => {
    const novasObservacoes = [...formData.observacoes];
    novasObservacoes[index] = { ...novasObservacoes[index], [field]: value };
    setFormData(prev => ({ ...prev, observacoes: novasObservacoes }));
  };


  // --- MANIPULADOR DE MUDANÇAS GERAL ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: id === 'placa' ? value.toUpperCase() : value,
    }));
  };
  
  const handleBack = () => {
    setValidated(false);
    setCurrentStep(prev => prev - 1);
  };

  const validateCurrentStep = () => {
    const form = formRef.current;
    if (!form) return false;
    
    const activeStepFields = form.querySelectorAll('.form-step.active .form-control, .form-step.active .form-select');
    let isStepValid = true;
    
    for (const field of Array.from(activeStepFields)) {
        if (!(field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).checkValidity()) {
            isStepValid = false;
        }
    }

    return isStepValid;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setValidated(false);
      setCurrentStep(prev => prev + 1);
    } else {
      setValidated(true);
    }
  };

  const handleSubmit = async () => {
    if (!formRef.current?.checkValidity()) {
      setValidated(true);
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      // Filtra observações com texto vazio antes de enviar
      const dadosParaEnviar = {
        ...formData,
        observacoes: formData.observacoes.filter(obs => obs.texto.trim() !== '')
      };

      const response = await fetch('/.netlify/functions/create-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(dadosParaEnviar),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar instalação.');
      }

      setMessage({ type: 'success', text: 'Solicitação cadastrada com sucesso!' });
      setFormData({
        nome_completo: '', contato: '', placa: '', modelo: '', ano: '', cor: '', endereco: '',
        usuario: '', senha: '', base: 'Atena', bloqueio: 'Sim', tipo_servico: 'Instalação', 
        observacoes: [{ texto: '', destaque: false }],
      });
      setCurrentStep(1);
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
        
        <Form ref={formRef} noValidate validated={validated}>
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
            </Row>

            <hr className="my-4" />

            <h5 className="text-primary mb-3">Observações</h5>
            {formData.observacoes.map((obs, index) => (
              <Card key={index} className="mb-3 bg-light border">
                <Card.Body>
                  <Row className="g-2">
                    <Col xs={12}>
                       <FloatingLabel label={`Observação ${index + 1}`}>
                          <Form.Control 
                              as="textarea" 
                              style={{ height: '100px' }} 
                              value={obs.texto}
                              onChange={(e) => handleObservacaoChange(index, 'texto', e.target.value)}
                          />
                       </FloatingLabel>
                    </Col>
                    <Col xs={12} sm={8}>
                      <Form.Check 
                          type="checkbox"
                          label="Destacar para o técnico"
                          checked={obs.destaque}
                          onChange={(e) => handleObservacaoChange(index, 'destaque', e.target.checked)}
                          className="pt-2"
                      />
                    </Col>
                    {formData.observacoes.length > 1 && (
                      <Col xs={12} sm={4} className="d-flex align-items-end justify-content-end">
                          <Button variant="outline-danger" size="sm" onClick={() => removerObservacao(index)}>
                              <i className="bi bi-trash-fill me-1"></i> Remover
                          </Button>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            ))}
            <Button variant="outline-primary" onClick={adicionarObservacao}>
                <i className="bi bi-plus-circle-fill me-2"></i> Adicionar outra observação
            </Button>
          </div>
          
          <div className="form-navigation-buttons">
            {currentStep > 1 && (
                <Button variant="secondary" type="button" onClick={handleBack} className="px-4">
                    <i className="bi bi-arrow-left me-2"></i> Voltar
                </Button>
            )}
            
            {currentStep < steps.length ? (
                <Button variant="primary" type="button" onClick={handleNext} className="ms-auto px-4">
                    Avançar <i className="bi bi-arrow-right ms-2"></i>
                </Button>
            ) : (
                <Button variant="success" type="button" onClick={handleSubmit} disabled={loading} className="ms-auto px-5">
                    {loading ? <Spinner as="span" size="sm" /> : <span><i className="bi bi-check-lg me-2"></i>Finalizar</span>}
                </Button>
            )}
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
