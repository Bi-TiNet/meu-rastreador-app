// Arquivo: src/components/InstallationForm.tsx
import { useState, type FormEvent } from 'react';
import { Button, Form, Row, Col, Card, FloatingLabel, Spinner, Alert } from 'react-bootstrap';

export function InstallationForm() {
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [cor, setCor] = useState('');
  const [endereco, setEndereco] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [base, setBase] = useState('Atena');
  const [bloqueio, setBloqueio] = useState('Sim');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'danger', text: string} | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const data = {
      nome, contato, placa, modelo, ano, cor,
      endereco, usuario, senha, base, bloqueio
    };

    try {
      const response = await fetch('/.netlify/functions/create-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha na resposta da rede.');
      }

      setMessage({type: 'success', text: 'Instalação cadastrada com sucesso!'});

      // Limpar formulário
      setNome(''); setContato(''); setPlaca(''); setModelo(''); setAno('');
      setCor(''); setEndereco(''); setUsuario(''); setSenha('');
      setBase('Atena'); setBloqueio('Sim');

    } catch (error: any) {
        setMessage({type: 'danger', text: error.message || "Não foi possível salvar os dados."});
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <Card.Header as="h5">
        <i className="bi bi-card-list me-2"></i>
        Cadastrar Nova Instalação
      </Card.Header>
      <Card.Body className="p-4">
        <Form onSubmit={handleSubmit}>
          {message && <Alert variant={message.type}>{message.text}</Alert>}
          
          <h6 className="text-primary">DADOS DO CLIENTE E VEÍCULO</h6>
          <hr className="mt-2"/>
          <Row className="g-3 mb-4">
            <Col md={4}>
              <FloatingLabel controlId="floatingNome" label="Nome Completo">
                <Form.Control type="text" placeholder="Nome Completo" required value={nome} onChange={(e) => setNome(e.target.value)} />
              </FloatingLabel>
            </Col>
            <Col md={4}>
              <FloatingLabel controlId="floatingContato" label="Número de Contato">
                <Form.Control type="text" placeholder="Número de Contato" required value={contato} onChange={(e) => setContato(e.target.value)} />
              </FloatingLabel>
            </Col>
            <Col md={4}>
              <FloatingLabel controlId="floatingPlaca" label="Placa do Veículo">
                <Form.Control type="text" placeholder="Placa do Veículo" required value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} />
              </FloatingLabel>
            </Col>
            <Col md={4}>
              <FloatingLabel controlId="floatingModelo" label="Modelo do Veículo">
                <Form.Control type="text" placeholder="Modelo do Veículo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
              </FloatingLabel>
            </Col>
            <Col md={4}>
              <FloatingLabel controlId="floatingAno" label="Ano de Fabricação">
                <Form.Control type="text" placeholder="Ano de Fabricação" value={ano} onChange={(e) => setAno(e.target.value)} />
              </FloatingLabel>
            </Col>
            <Col md={4}>
              <FloatingLabel controlId="floatingCor" label="Cor do Veículo">
                <Form.Control type="text" placeholder="Cor do Veículo" value={cor} onChange={(e) => setCor(e.target.value)} />
              </FloatingLabel>
            </Col>
            <Col md={12}>
              <FloatingLabel controlId="floatingEndereco" label="Endereço do Cliente">
                <Form.Control as="textarea" placeholder="Endereço do Cliente" style={{ height: '100px' }} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
              </FloatingLabel>
            </Col>
          </Row>

          <h6 className="text-primary">DETALHES DE ACESSO DO RASTREADOR</h6>
          <hr className="mt-2"/>
          
          <Row className="g-3">
            <Col md={6}>
              <FloatingLabel controlId="floatingUsuario" label="Usuário">
                <Form.Control type="text" placeholder="Usuário" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel controlId="floatingSenha" label="Senha">
                <Form.Control type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} />
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel controlId="floatingBase" label="Base">
                <Form.Select value={base} onChange={(e) => setBase(e.target.value)}>
                  <option value="Atena">Base Atena</option>
                  <option value="Autocontrol">Base Autocontrol</option>
                </Form.Select>
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel controlId="floatingBloqueio" label="Bloqueio">
                <Form.Select value={bloqueio} onChange={(e) => setBloqueio(e.target.value)}>
                  <option value="Sim">Sim</option>
                  <option value="Nao">Não</option>
                </Form.Select>
              </FloatingLabel>
            </Col>
          </Row>

          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 mt-4 py-2" 
            disabled={isLoading}
          >
            {isLoading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : <><i className="bi bi-check-circle me-2"></i>Cadastrar Instalação</>}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}