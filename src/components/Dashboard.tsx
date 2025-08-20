// Arquivo: src/components/Dashboard.tsx
import { useEffect, useState, useMemo, type FormEvent } from 'react';
import {
  Button, Table, Modal, Spinner, Alert, Card, Form, Badge, InputGroup
} from 'react-bootstrap';

// Interface para os dados de uma instalação
interface Installation {
  id: number;
  nome_completo: string;
  contato: string;
  placa: string;
  modelo: string;
  ano?: string;
  cor?: string;
  endereco: string;
  usuario: string;
  senha?: string;
  base: string;
  bloqueio: string;
  status: string;
  data_instalacao?: string;
  horario?: string;
}

// Componente para o Modal de Agendamento
interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  installation: Installation;
  onSchedule: (id: number, date: string, time: string) => void;
}

function ScheduleModal({ isOpen, onClose, installation, onSchedule }: ScheduleModalProps) {
  const [dateTime, setDateTime] = useState('');
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!dateTime) return;
    const [date, time] = dateTime.split('T');
    onSchedule(installation.id, date, time);
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Agendar Instalação</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Cliente:</strong> {installation.nome_completo}</p>
        <p><strong>Veículo:</strong> {installation.modelo} ({installation.placa})</p>
        <Form onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label>Data e Hora</Form.Label>
            <Form.Control type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} required/>
          </Form.Group>
          <Modal.Footer className="mt-3">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" type="submit">Salvar Agendamento</Button>
          </Modal.Footer>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

// Componente principal do Dashboard
export function Dashboard() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Installation | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'danger' | 'info', text: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // Estado para o termo de busca

  const fetchInstallations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/get-installations');
      if (!response.ok) throw new Error('Falha ao buscar dados.');
      const data: Installation[] = await response.json();
      setInstallations(data);
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar as instalações.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallations();
  }, []);
  
  // Filtra as instalações com base no termo de busca
  const filteredInstallations = useMemo(() =>
    installations.filter(inst =>
      inst.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.modelo.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [installations, searchTerm]);


  const handleSchedule = async (id: number, date: string, time: string) => {
    try {
      const response = await fetch('/.netlify/functions/create-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, date, time }),
      });
      if (!response.ok) throw new Error('Falha ao agendar.');
      setMessage({type: 'success', text: 'Agendado com sucesso!'});
      setSelected(null);
      await fetchInstallations();
    } catch (error: any) {
        setMessage({type: 'danger', text: error.message || 'Erro ao agendar.'});
    }
  };

  const handleCopy = (inst: Installation) => {
    const formattedText = `Veiculo ${inst.modelo?.split(' ')[0] || ''}
Modelo: ${inst.modelo}
Ano Fabricação: ${inst.ano || ''}
Placa: ${inst.placa}
Cor: ${inst.cor || ''}
Nome: ${inst.nome_completo}
Telefone: ${inst.contato}
usuario: ${inst.usuario}
senha: ${inst.senha || ''}
BASE Atena ( ${inst.base === 'Atena' ? 'X' : ' '} )   Base Autocontrol ( ${inst.base === 'Autocontrol' ? 'X' : ' '} )
Bloqueio sim ( ${inst.bloqueio === 'Sim' ? 'X' : ' '} )  nao ( ${inst.bloqueio === 'Nao' ? 'X' : ' '} )`;
    navigator.clipboard.writeText(formattedText)
      .then(() => setMessage({type: 'info', text: 'Informações copiadas!'}))
      .catch(() => setMessage({type: 'danger', text: 'Erro ao copiar.'}));
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <Card>
      <Card.Header as="h5">
        <i className="bi bi-clipboard-data me-2"></i>
        Painel de Agendamentos
      </Card.Header>
      <Card.Body>
        <InputGroup className="mb-3">
          <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
          <Form.Control
            placeholder="Buscar por cliente, placa ou modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        
        {message && <Alert variant={message.type} onClose={() => setMessage(null)} dismissible>{message.text}</Alert>}

        <Table striped bordered hover responsive>
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th>Veículo</th>
              <th>Agendamento</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredInstallations.map((inst: Installation) => (
              <tr key={inst.id}>
                <td>{inst.nome_completo}</td>
                <td>{`${inst.modelo} (${inst.placa})`}</td>
                <td>
                  {inst.status === 'Agendado' ? `${inst.data_instalacao} às ${inst.horario}` : <Badge bg="warning" text="dark">{inst.status}</Badge>}
                </td>
                <td className="text-center">
                  <Button size="sm" variant="outline-secondary" onClick={() => handleCopy(inst)} className="me-2">
                    <i className="bi bi-clipboard me-1"></i> Copiar
                  </Button>
                  <Button size="sm" variant="primary" onClick={() => setSelected(inst)}>
                    <i className="bi bi-calendar-plus me-1"></i> Agendar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        
        {filteredInstallations.length === 0 && (
          <div className="text-center text-muted mt-3">
            Nenhum resultado encontrado.
          </div>
        )}

      </Card.Body>
      {selected && (
        <ScheduleModal isOpen={!!selected} onClose={() => setSelected(null)} installation={selected} onSchedule={handleSchedule} />
      )}
    </Card>
  );
}