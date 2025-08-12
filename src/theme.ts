// src/theme.ts
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// 1. Configuração do Tema
const config: ThemeConfig = {
  initialColorMode: 'dark', // Define o modo escuro como padrão
  useSystemColorMode: false, // Impede que o tema mude com o sistema operacional
};

// 2. Definição da paleta de cores e fontes
const theme = extendTheme({
  config,
  styles: {
    global: {
      'html, body': {
        background: 'gray.900', // Fundo principal da aplicação
        color: 'gray.50',       // Cor do texto padrão
      },
      // Estilo da barra de rolagem para um visual mais limpo
      '::-webkit-scrollbar': {
        width: '8px',
      },
      '::-webkit-scrollbar-track': {
        background: 'gray.700',
      },
      '::-webkit-scrollbar-thumb': {
        background: 'cyan.500',
        borderRadius: '4px',
      },
      '::-webkit-scrollbar-thumb:hover': {
        background: 'cyan.400',
      }
    },
  },
  colors: {
    // Paleta de cores tecnológica
    brand: {
      50: '#e6fffa',
      100: '#b2f5ea',
      200: '#81e6d9',
      300: '#4fd1c5',
      400: '#38b2ac',
      500: '#319795', // Cor primária
      600: '#2c7a7b',
      700: '#285e61',
      800: '#234e52',
      900: '#1d4044',
    },
    gray: {
      900: '#121212', // Fundo principal
      800: '#1A202C', // Fundo de cards e modais
      700: '#2D3748', // Bordas e divisores
      600: '#4A5568',
      500: '#718096',
      400: '#A0AEC0',
      300: '#CBD5E0',
      200: '#E2E8F0',
      100: '#F7FAFC',
       50: '#FFFFFF',
    },
  },
  fonts: {
    // Fonte moderna e limpa
    heading: `'Poppins', sans-serif`,
    body: `'Poppins', sans-serif`,
  },
  components: {
    // Estilos customizados para componentes específicos
    Button: {
      baseStyle: {
        fontWeight: 'bold',
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
        },
        ghost: {
            _hover: {
                bg: 'gray.700',
            }
        }
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'brand.400',
      },
    },
    Table: {
      baseStyle: {
        th: {
          borderColor: 'gray.700',
        },
        td: {
          borderColor: 'gray.700',
        },
      },
    },
    Modal: {
        baseStyle: {
            dialog: {
                bg: 'gray.800',
                boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.4)',
                border: '1px solid',
                borderColor: 'gray.700',
            }
        }
    }
  },
});

export default theme;