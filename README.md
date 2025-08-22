# Agenda Autocontrol - Sistema de Agendamento de Instalação de Rastreadores

![Logo da Autocontrol](public/logo-icon.png)

A **Agenda Autocontrol** é uma aplicação web completa desenvolvida para otimizar o gerenciamento e agendamento de instalações de rastreadores veiculares. A plataforma oferece uma interface intuitiva e robusta para administradores, técnicos e seguradoras, simplificando todo o processo, desde o cadastro inicial até a visualização do status da instalação.

## ✨ Funcionalidades Principais

O sistema foi desenhado com diferentes níveis de acesso para atender às necessidades de cada tipo de usuário:

### Para Administradores:
* **Dashboard Centralizado:** Uma visão geral de todas as instalações, permitindo uma busca rápida por cliente, placa ou modelo do veículo.
* **Agendamento Simplificado:** Uma interface modal para agendar ou reagendar instalações de forma rápida e eficiente.
* **Agenda do Técnico:** Um calendário interativo (mensal, semanal e diário) para visualizar todos os agendamentos, com detalhes de cada serviço.
* **Cópia Rápida de Informações:** Funcionalidade para copiar os dados da instalação em um formato padronizado, agilizando a comunicação.

### Para Seguradoras e Usuários Gerais:
* **Cadastro de Novas Instalações:** Um formulário completo para registrar todos os dados necessários do cliente, do veículo e do rastreador.
* **Consulta de Status:** Uma tela de consulta para que as seguradoras possam pesquisar e acompanhar o status das instalações (Agendado, A agendar, etc.).
* **Autenticação Segura:** Sistema de login e recuperação de senha para garantir o acesso seguro à plataforma.

## 🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando um conjunto de tecnologias modernas e eficientes, garantindo uma aplicação rápida, escalável e de fácil manutenção.

* **Frontend:**
    * **React 19:** Biblioteca para construção de interfaces de usuário.
    * **Vite:** Ferramenta de build extremamente rápida para desenvolvimento frontend.
    * **TypeScript:** Superset do JavaScript que adiciona tipagem estática.
    * **React Router DOM:** Para gerenciamento de rotas na aplicação.
    * **React Bootstrap & Bootstrap 5:** Para a construção de uma interface responsiva e moderna.
    * **React Big Calendar:** Para a criação da agenda interativa do técnico.
* **Backend & Banco de Dados (Serverless):**
    * **Supabase:** Utilizado como backend completo, incluindo autenticação, e banco de dados PostgreSQL.
    * **Netlify Functions:** Funções serverless para a comunicação segura entre o frontend e o Supabase.
* **Deployment:**
    * **Netlify:** Plataforma para deploy e hospedagem contínua da aplicação e das funções serverless.

## ⚙️ Configuração do Ambiente

Siga os passos abaixo para configurar e executar o projeto em seu ambiente de desenvolvimento local.

### Pré-requisitos
* [Node.js](https://nodejs.org/) (versão 18 ou superior)
* [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)
* Uma conta no [Supabase](https://supabase.com/) para criar seu projeto de banco de dados.
* Uma conta na [Netlify](https://www.netlify.com/) para deploy (opcional para desenvolvimento local).

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/meu-rastreador-app.git](https://github.com/seu-usuario/meu-rastreador-app.git)
    cd meu-rastreador-app
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto, baseado no arquivo `supabaseClient.ts` e nas funções Netlify. Você precisará das suas chaves do Supabase.

    ```env
    # Chaves para o cliente React (prefixo VITE_)
    VITE_SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
    VITE_SUPABASE_KEY=SUA_CHAVE_ANON_SUPABASE

    # Chaves para as Netlify Functions (usadas no ambiente de deploy)
    SUPABASE_URL=URL_DO_SEU_PROJETO_SUPABASE
    SUPABASE_KEY=SUA_CHAVE_SERVICE_ROLE_SUPABASE
    ```

    > **Nota:** Para desenvolvimento local, as variáveis `SUPABASE_URL` e `SUPABASE_KEY` podem ser configuradas na UI da Netlify ou no arquivo `netlify.toml` para emulação local com a Netlify CLI.

### Scripts Disponíveis

* **Para iniciar o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
   
* **Para buildar a aplicação para produção:**
    ```bash
    npm run build
    ```
   
* **Para visualizar a build de produção localmente:**
    ```bash
    npm run preview
    ```
   
* **Para executar o linter:**
    ```bash
    npm run lint
    ```
   

## ☁️ Deploy

O projeto está configurado para deploy contínuo na **Netlify**. O arquivo `netlify.toml` na raiz do projeto contém as configurações de build e o redirecionamento necessário para o funcionamento correto das rotas do React Router.

Para fazer o deploy, basta conectar seu repositório a um novo site na Netlify e configurar as variáveis de ambiente na interface da plataforma.