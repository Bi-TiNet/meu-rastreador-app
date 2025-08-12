// Arquivo: src/components/Dashboard.tsx
import { useEffect, useState, type FormEvent } from 'react';
import {
  Box, Button, Heading, useToast, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, FormControl, FormLabel, Input
} from '@chakra-ui/react';

// ... (Interface Installation - sem alterações)
interface Installation {
  id: number;
  nome_completo: string;
  contato: string;
  placa: string;
  modelo: string;
  status: string;
  data_instalacao?: string;
  horario?: string;
  [key: string]: any;
}

// Modal de Agendamento com Chakra UI
function ScheduleModal({ isOpen, onClose, installation, onSchedule }) {
  const [dateTime, setDateTime] = useState('');
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const [date, time] = dateTime.split('T');
    onSchedule(installation.id, date, time);
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>Agendar Instalação</ModalHeader>
        <ModalBody>
          <p><strong>Cliente:</strong> {installation.nome_completo}</p>
          <p><strong>Veículo:</strong> {installation.modelo}</p>
          <FormControl mt={4} isRequired>
            <FormLabel>Data e Hora</FormLabel>
            <Input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="blue" type="submit">Salvar Agendamento</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function Dashboard() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Installation | null>(null);
  const toast = useToast();

  const fetchInstallations = async () => { /* ... (lógica igual, não precisa de alterar) */ };
  useEffect(() => { /* ... (lógica igual, não precisa de alterar) */ }, []);
  const handleCopy = (inst: Installation) => { /* ... (lógica igual, não precisa de alterar) */ };

  const handleSchedule = async (id: number, date: string, time: string) => {
    try {
      const response = await fetch('/.netlify/functions/create-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, date, time }),
      });
      if (!response.ok) throw new Error('Falha ao agendar.');
      toast({ title: 'Agendado!', status: 'success', duration: 3000, isClosable: true });
      setSelected(null);
      fetchInstallations();
    } catch (error) {
      toast({ title: 'Erro ao agendar', status: 'error', duration: 3000, isClosable: true });
    }
  };

  return (
    <Box p={8} bg="var(--card-bg)" borderRadius="lg" boxShadow="var(--card-shadow)" mt={10}>
      <Heading as="h2" size="lg" textAlign="center" mb={6}>
        Painel de Agendamentos
      </Heading>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr><Th>Cliente</Th><Th>Veículo</Th><Th>Agendamento</Th><Th>Ações</Th></Tr>
          </Thead>
          <Tbody>
            {installations.map((inst) => (
              <Tr key={inst.id}>
                <Td>{inst.nome_completo}</Td>
                <Td>{`${inst.modelo} (${inst.placa})`}</Td>
                <Td>
                  {inst.status === 'Agendado' ? `${inst.data_instalacao} às ${inst.horario}` : inst.status}
                </Td>
                <Td>
                  <Button size="sm" mr={2} onClick={() => handleCopy(inst)}>Copiar</Button>
                  <Button size="sm" colorScheme="green" onClick={() => setSelected(inst)}>Agendar</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      {selected && (
        <ScheduleModal isOpen={!!selected} onClose={() => setSelected(null)} installation={selected} onSchedule={handleSchedule} />
      )}
    </Box>
  );
}