// Arquivo: src/components/Dashboard.tsx
import { useEffect, useState, type FormEvent } from 'react';
import {
  Box, Button, Heading, useToast, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, FormControl, FormLabel, Input, Spinner, Center, Text
} from '@chakra-ui/react';

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
    const [date, time] = dateTime.split('T');
    onSchedule(installation.id, date, time);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>Agendar Instalação</ModalHeader>
        <ModalBody>
          <Text mb={2}><strong>Cliente:</strong> {installation.nome_completo}</Text>
          <Text><strong>Veículo:</strong> {installation.modelo}</Text>
          <FormControl mt={4} isRequired>
            <FormLabel>Data e Hora</FormLabel>
            <Input type="datetime-local" value={dateTime} onChange={e => setDateTime(e.target.value)} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="brand" type="submit">Salvar Agendamento</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function Dashboard() {
  // ... (toda a sua lógica de state e fetch permanece a mesma)
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Installation | null>(null);
  const toast = useToast();

  const fetchInstallations = async () => { /* ... */ };
  useEffect(() => { fetchInstallations(); }, []);
  const handleSchedule = async (id: number, date: string, time: string) => { /* ... */ };
  const handleCopy = (inst: Installation) => { /* ... */ };

  if (loading) return <Center p={10}><Spinner size="xl" color="brand.500" /></Center>;
  if (error) return <Text color="red.400" textAlign="center">{error}</Text>;

  return (
    <Box p={8} bg="gray.800" borderRadius="lg" boxShadow="xl" mt={10} mx="auto" maxW="1200px">
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
                  <Button size="sm" mr={2} variant="outline" onClick={() => handleCopy(inst)}>Copiar</Button>
                  <Button size="sm" colorScheme="brand" onClick={() => setSelected(inst)}>Agendar</Button>
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