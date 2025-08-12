// Arquivo: src/components/Dashboard.tsx
import { useEffect, useState, type FormEvent } from 'react';
import {
  Box, Button, Heading, useToast, Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, FormControl, 
  FormLabel, Input, Spinner, Center, Text, HStack
} from '@chakra-ui/react';

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
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>Agendar Instalação</ModalHeader>
        <ModalBody>
          <Text mb={2}><strong>Cliente:</strong> {installation.nome_completo}</Text>
          <Text><strong>Veículo:</strong> {installation.modelo} ({installation.placa})</Text>
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


// Componente principal do Dashboard
export function Dashboard() {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Installation | null>(null);
  const toast = useToast();

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

  const handleSchedule = async (id: number, date: string, time: string) => {
    try {
      const response = await fetch('/.netlify/functions/create-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, date, time }),
      });
      if (!response.ok) throw new Error('Falha ao agendar.');
      toast({ title: 'Agendado!', status: 'success', duration: 3000, isClosable: true, position: 'top' });
      setSelected(null);
      await fetchInstallations(); // Atualiza a lista após agendar
    } catch (error: any) {
      toast({ title: 'Erro ao agendar', description: error.message, status: 'error', duration: 3000, isClosable: true, position: 'top' });
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
      .then(() => toast({ title: 'Informações copiadas!', status: 'info', duration: 3000, isClosable: true, position: 'top' }))
      .catch(() => toast({ title: 'Erro ao copiar', status: 'error', duration: 3000, isClosable: true, position: 'top' }));
  };

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
            <Tr>
              <Th>Cliente</Th>
              <Th>Veículo</Th>
              <Th>Agendamento</Th>
              <Th>Ações</Th>
            </Tr>
          </Thead>
          <Tbody>
            {installations.map((inst) => (
              <Tr key={inst.id} _hover={{ bg: 'gray.700' }}>
                <Td>{inst.nome_completo}</Td>
                <Td>{`${inst.modelo} (${inst.placa})`}</Td>
                <Td>
                  {inst.status === 'Agendado' ? `${inst.data_instalacao} às ${inst.horario}` : inst.status}
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Button size="sm" variant="outline" onClick={() => handleCopy(inst)}>Copiar</Button>
                    <Button size="sm" colorScheme="brand" onClick={() => setSelected(inst)}>Agendar</Button>
                  </HStack>
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