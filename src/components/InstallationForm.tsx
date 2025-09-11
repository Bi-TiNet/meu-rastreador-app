// Arquivo: src/components/InstallationForm.tsx
import { useState, useRef } from 'react';
// CORREÇÃO: Importando tipos com 'import type'
import type { FC, FormEvent } from 'react';
import { supabase } from '../supabaseClient'; 

interface InstallationFormProps {
  onSuccess?: () => void;
}

interface Observacao {
  texto: string;
  destaque: boolean;
}

interface FormData {
  nome_completo: string;
  contato: string;
  placa: string;
  modelo: string;
  ano: string;
  cor: string;
  endereco: string;
  usuario: string;
  senha: string;
  base: string;
  bloqueio: string;
  tipo_servico: string;
  observacoes: Observacao[];
}

const initialState: FormData = {
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
  observacoes: [{ texto: '', destaque: false }],
};

export const InstallationForm: FC<InstallationFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<FormData>(initialState);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [formWasValidated, setFormWasValidated] = useState(false);

  const adicionarObservacao = () => {
    setFormData(prev => ({
      ...prev,
      observacoes: [...prev.observacoes, { texto: '', destaque: false }]
    }));
  };

  const removerObservacao = (index: number) => {
    setFormData(prev => ({
      ...prev,
      observacoes: prev.observacoes.filter((_, i) => i !== index)
    }));
  };

  const handleObservacaoChange = (index: number, field: keyof Observacao, value: string | boolean) => {
    const novasObservacoes = [...formData.observacoes];
    novasObservacoes[index] = { ...novasObservacoes[index], [field]: value };
    setFormData(prev => ({ ...prev, observacoes: novasObservacoes }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: id === 'placa' ? value.toUpperCase() : value,
    }));
  };
  
  const handleBack = () => {
    setFormWasValidated(false);
    setMessage(null);
    setCurrentStep(prev => prev - 1);
  };

  const validateCurrentStepFields = (): boolean => {
    const form = formRef.current;
    if (!form) return false;
    
    const currentStepContainer = form.querySelector(`.form-step.active`);
    if (!currentStepContainer) return false;

    const fields = currentStepContainer.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[name][required]');
    let isStepValid = true;
    
    fields.forEach(field => {
      if (!field.checkValidity()) {
        isStepValid = false;
      }
    });
    return isStepValid;
  };

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    setFormWasValidated(true);

    if (validateCurrentStepFields()) {
      setFormWasValidated(false);
      setMessage(null);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormWasValidated(true);

    if (!formRef.current?.checkValidity()) {
        setMessage({ type: 'danger', text: 'Por favor, corrija os erros no formulário.' });
        return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Acesso negado.");

        const response = await fetch('/.netlify/functions/create-installation', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Falha ao criar solicitação.');

      setMessage({ type: 'success', text: 'Solicitação cadastrada com sucesso!' });
      setFormData(initialState); 
      setCurrentStep(1);
      setFormWasValidated(false);
      if (onSuccess) onSuccess();

    } catch (error: any) {
      setMessage({ type: 'danger', text: error.message || 'Ocorreu um erro ao enviar a solicitação.' });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, name: 'Cliente', icon: 'bi-person' },
    { number: 2, name: 'Veículo', icon: 'bi-car-front' },
    { number: 3, name: 'Serviço', icon: 'bi-gear' }
  ];
  
  const alertStyles = {
    success: 'bg-green-800/50 text-green-300 border border-green-700',
    danger: 'bg-red-800/50 text-red-300 border border-red-700',
  };
  
  const inputClasses = "w-full p-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500";
  
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 bg-slate-800/50 border border-slate-700 shadow-xl rounded-lg">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-white">Nova Solicitação de Instalação</h2>
        <p className="text-slate-400 mt-2">Preencha os dados em 3 passos para concluir o cadastro.</p>
      </div>

      <div className="flex justify-between items-center relative mb-12 w-full max-w-xl mx-auto">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-700 -z-10 transform -translate-y-1/2 rounded-full"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-blue-500 -z-10 transition-all duration-500 transform -translate-y-1/2 rounded-full" 
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          {steps.map(step => (
              <div key={step.number} className="flex flex-col items-center text-center relative z-10 w-1/3">
                  <div className={`
                    h-12 w-12 rounded-full border-3 flex justify-center items-center text-xl font-semibold bg-slate-800
                    transition-all duration-300 ease-in-out shadow-sm
                    ${currentStep >= step.number ? 'border-blue-500' : 'border-slate-600'}
                    ${currentStep > step.number ? 'bg-blue-600 text-white' : 'text-slate-400'}
                  `}>
                    <i className={`bi ${step.icon}`}></i>
                  </div>
                  <div className={`
                    mt-2 text-sm font-medium transition-colors duration-300
                    ${currentStep >= step.number ? 'text-blue-400' : 'text-slate-400'}
                  `}>{step.name}</div>
              </div>
          ))}
      </div>

      {message && (
        <div className={`p-4 my-4 text-sm rounded-lg ${alertStyles[message.type]}`} role="alert">
          {message.text}
        </div>
      )}
      
      {/* CORREÇÃO: Adicionado o onSubmit={handleSubmit} */}
      <form ref={formRef} noValidate className={`space-y-8 ${formWasValidated ? 'form-validated' : ''}`} onSubmit={handleSubmit}>
        {/* Etapa 1: Cliente */}
        <div className={`transition-opacity duration-500 ${currentStep === 1 ? 'block opacity-100' : 'hidden opacity-0'} form-step active`}>
            <h4 className="text-xl font-bold text-white mb-6">Dados do Cliente</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="nome_completo" className="block mb-2 text-sm text-slate-400">Nome Completo</label>
                    <input type="text" id="nome_completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="contato" className="block mb-2 text-sm text-slate-400">Contato (Telefone/WhatsApp)</label>
                    <input type="text" id="contato" name="contato" value={formData.contato} onChange={handleChange} required className={inputClasses} />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="endereco" className="block mb-2 text-sm text-slate-400">Endereço Completo da Instalação</label>
                    <textarea id="endereco" name="endereco" value={formData.endereco} onChange={handleChange} required className={`${inputClasses} min-h-[100px]`}></textarea>
                </div>
            </div>
        </div>

        {/* Etapa 2: Veículo */}
        <div className={`transition-opacity duration-500 ${currentStep === 2 ? 'block opacity-100' : 'hidden opacity-0'} form-step ${currentStep === 2 ? 'active' : ''}`}>
            <h4 className="text-xl font-bold text-white mb-6">Dados do Veículo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="placa" className="block mb-2 text-sm text-slate-400">Placa</label>
                    <input type="text" id="placa" name="placa" value={formData.placa} onChange={handleChange} required minLength={7} maxLength={7} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="modelo" className="block mb-2 text-sm text-slate-400">Modelo do Veículo</label>
                    <input type="text" id="modelo" name="modelo" value={formData.modelo} onChange={handleChange} required className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="ano" className="block mb-2 text-sm text-slate-400">Ano</label>
                    <input type="number" id="ano" name="ano" value={formData.ano} onChange={handleChange} required className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="cor" className="block mb-2 text-sm text-slate-400">Cor</label>
                    <input type="text" id="cor" name="cor" value={formData.cor} onChange={handleChange} required className={inputClasses} />
                </div>
            </div>
        </div>
        
        {/* Etapa 3: Serviço */}
        <div className={`transition-opacity duration-500 ${currentStep === 3 ? 'block opacity-100' : 'hidden opacity-0'} form-step ${currentStep === 3 ? 'active' : ''}`}>
            <h4 className="text-xl font-bold text-white mb-6">Detalhes do Serviço e Acesso</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label htmlFor="tipo_servico" className="block mb-2 text-sm text-slate-400">Tipo de Serviço</label>
                    <select id="tipo_servico" name="tipo_servico" value={formData.tipo_servico} onChange={handleChange} className={inputClasses}>
                        <option value="Instalação">Instalação</option>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Remoção">Remoção</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="base" className="block mb-2 text-sm text-slate-400">Base do Rastreador</label>
                    <select id="base" name="base" value={formData.base} onChange={handleChange} className={inputClasses}>
                        <option value="Atena">Atena</option>
                        <option value="Autocontrol">Autocontrol</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="bloqueio" className="block mb-2 text-sm text-slate-400">Bloqueio</label>
                    <select id="bloqueio" name="bloqueio" value={formData.bloqueio} onChange={handleChange} className={inputClasses}>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="usuario" className="block mb-2 text-sm text-slate-400">Usuário de Acesso</label>
                    <input type="text" id="usuario" name="usuario" value={formData.usuario} onChange={handleChange} className={inputClasses} />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="senha" className="block mb-2 text-sm text-slate-400">Senha de Acesso</label>
                    <input type="text" id="senha" name="senha" value={formData.senha} onChange={handleChange} className={inputClasses} />
                </div>
            </div>

            <hr className="my-8 border-slate-700" />
            
            <h5 className="text-lg font-bold text-white mb-4">Observações</h5>
            <div className="space-y-4">
              {formData.observacoes.map((obs, index) => (
                <div key={index} className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                  <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-grow">
                          <label htmlFor={`observacao_${index}`} className="block mb-2 text-sm text-slate-400">{`Observação ${index + 1}`}</label>
                          <textarea 
                            id={`observacao_${index}`} 
                            name={`observacao_${index}`}
                            value={obs.texto} 
                            onChange={(e) => handleObservacaoChange(index, 'texto', e.target.value)} 
                            className={`${inputClasses} min-h-[80px]`}
                          />
                      </div>
                      <div className="flex flex-row-reverse sm:flex-col justify-between items-center sm:items-start sm:justify-start gap-4 pt-8">
                          <label htmlFor={`destaque_${index}`} className="flex items-center space-x-2 cursor-pointer text-slate-300">
                              <input 
                                type="checkbox" 
                                id={`destaque_${index}`}
                                checked={obs.destaque} 
                                onChange={(e) => handleObservacaoChange(index, 'destaque', e.target.checked)} 
                                className="h-4 w-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-slate-700" 
                              />
                              <span>Destacar</span>
                          </label>
                          {formData.observacoes.length > 1 && (
                            <button type="button" onClick={() => removerObservacao(index)} className="flex items-center gap-2 text-sm text-red-500 hover:text-red-400 font-medium transition-colors">
                                <i className="bi bi-trash-fill"></i> Remover
                            </button>
                          )}
                      </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={adicionarObservacao} className="mt-6 flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                <i className="bi bi-plus-circle-fill"></i> Adicionar outra observação
            </button>
        </div>
        
        <div className="flex justify-between items-center pt-8 border-t border-slate-700 mt-8">
          <div>
            {currentStep > 1 && (
                <button type="button" onClick={handleBack} className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-slate-600 hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors">
                    <i className="bi bi-arrow-left mr-2"></i> Voltar
                </button>
            )}
          </div>
          
          <div>
            {currentStep < steps.length ? (
                <button type="button" onClick={handleNext} className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    Avançar <i className="bi bi-arrow-right ml-2"></i>
                </button>
            ) : (
                <button type="submit" disabled={loading} className="inline-flex items-center px-8 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Finalizando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg mr-2"></i> Finalizar Solicitação
                      </>
                    )}
                </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}