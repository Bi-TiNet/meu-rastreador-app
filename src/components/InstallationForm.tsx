// Arquivo: src/components/InstallationForm.tsx
import { useState, type FormEvent } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Heading,
  SimpleGrid,
  Divider,
  useToast,
} from '@chakra-ui/react';

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
  const toast = useToast();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);

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

      toast({
        title: 'Instalação Cadastrada.',
        description: "Os dados foram salvos com sucesso no banco de dados.",
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setNome(''); setContato(''); setPlaca(''); setModelo(''); setAno('');
      setCor(''); setEndereco(''); setUsuario(''); setSenha('');

    } catch (error) {
      // CORREÇÃO: Verificamos o tipo do erro antes de o usar
      let errorMessage = "Não foi possível salvar os dados.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro ao Cadastrar.',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Erro ao enviar o formulário:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box
      as="form"
      maxWidth="1000px"
      mx="auto"
      p={8}
      bg="white"
      borderRadius="lg"
      boxShadow="lg"
      onSubmit={handleSubmit}
    >
      <Heading as="h2" size="lg" textAlign="center" mb={6}>
        Cadastrar Nova Instalação
      </Heading>
      
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <FormControl isRequired>
          <FormLabel>Nome Completo</FormLabel>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Número de Contato</FormLabel>
          <Input value={contato} onChange={(e) => setContato(e.target.value)} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Placa do Veículo</FormLabel>
          <Input value={placa} onChange={(e) => setPlaca(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Modelo do Veículo</FormLabel>
          <Input value={modelo} onChange={(e) => setModelo(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Ano de Fabricação</FormLabel>
          <Input value={ano} onChange={(e) => setAno(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Cor do Veículo</FormLabel>
          <Input value={cor} onChange={(e) => setCor(e.target.value)} />
        </FormControl>
        <FormControl gridColumn="1 / -1">
          <FormLabel>Endereço do Cliente</FormLabel>
          <Textarea value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        </FormControl>
      </SimpleGrid>

      <Divider my={8} />

      <Heading as="h3" size="md" textAlign="center" mb={6}>
        Detalhes de Acesso do Rastreador
      </Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <FormControl>
          <FormLabel>Usuário</FormLabel>
          <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Senha</FormLabel>
          <Input value={senha} onChange={(e) => setSenha(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Base</FormLabel>
          <Select value={base} onChange={(e) => setBase(e.target.value)}>
            <option value="Atena">Base Atena</option>
            <option value="Autocontrol">Base Autocontrol</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Bloqueio</FormLabel>
          <Select value={bloqueio} onChange={(e) => setBloqueio(e.target.value)}>
            <option value="Sim">Sim</option>
            <option value="Nao">Não</option>
          </Select>
        </FormControl>
      </SimpleGrid>

      <Button
        mt={8}
        colorScheme="blue"
        size="lg"
        width="full"
        type="submit"
        isLoading={isLoading}
        loadingText="A Cadastrar..."
      >
        Cadastrar Instalação
      </Button>
    </Box>
  );
}