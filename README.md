# PayList - Sistema de Gerenciamento de Eventos com Pagamento PIX

Um aplicativo web moderno para organizar eventos (futebol, festas, reuniões, etc.) com validação de pagamento via PIX usando OCR com IA.

## O que é PayList?

PayList permite que organizadores criem eventos, gerenciem listas de participantes e validem comprovantes de pagamento automaticamente. Participantes entram na lista, fazem PIX e enviam o comprovante - a IA valida automaticamente!

### Para Participantes
- Entrar na lista do evento sem autenticação
- Editar seu nome (antes de confirmar pagamento)
- Upload de comprovante PIX (PNG, JPG, PDF)
- Validação automática com OCR/IA
- Status em tempo real (Pendente/Pago)
- Contato com admin via WhatsApp

### Para Administradores
- Dashboard com todos os eventos
- Gerenciamento de participantes
- Alterar status de pagamento manualmente
- Visualizar comprovantes
- Remover participantes
- Criar/editar eventos
- Dados em tempo real (Supabase)

### Validação de Comprovante
-  **OCR com Google Gemini Vision** - Extrai dados do comprovante
- Valida nome do recebedor (PIX receiver name)
- Valida nome do pagador (participante)
- Valida valor (com tolerância de R$ 0,01)
- Valida data (deve ser a partir da criação do evento)
- Retry automático (3 tentativas em caso de sobrecarga)

##  Como Funciona

### Fluxo do Admin

1. **Criar Evento**
   - Login em `/auth/login`
   - Acesso ao Dashboard
   - Preencher: Título, Local, Data, Hora, Valor, Limite de Pessoas
   - Configurar PIX: Chave PIX e Nome do Recebedor
   - Evento criado - Redireciona para admin

2. **Gerenciar Participantes**
   - Ver lista em tempo real
   - Alterar status (Pendente/Pago)
   - Visualizar comprovantes
   - Remover participantes

### Fluxo do Participante

1. **Entrar na Lista**
   - Copiar ID do evento (ou acessar link público)
   - Digitar nome completo
   - Entrar na lista (sem autenticação)

2. **Editar Nome** (enquanto pendente)
   - Clicar no botão ✎ (editar)
   - Corrigir nome
   - Salvar (sem JWT necessário)

3. **Enviar Comprovante**
   - Fazer PIX para o recebedor configurado
   - Upload do comprovante (PNG, JPG, PDF)
   - Sistema valida automaticamente
   - Se OK - Marca como Pago
   - Se falha - Fica pendente (admin aprova manualmente)

## Estrutura do Projeto

```
paylist/
├── app/
│   ├── api/                    # API Routes (Next.js)
│   │   ├── auth/              # Login, Register, Reset Password
│   │   ├── events/            # CRUD de eventos
│   │   ├── players/           # CRUD de participantes
│   │   ├── payments/          # Alterar status de pagamento
│   │   ├── ocr/               # Validação de comprovante
│   │   └── upload/            # Upload para Supabase Storage
│   ├── auth/                   # Páginas de autenticação
│   ├── evento/                 # Páginas de eventos
│   │   ├── [id]/              # Página pública do evento
│   │   ├── [id]/admin/        # Painel do admin
│   │   ├── [id]/editar/       # Editar evento
│   │   └── novo/              # Criar evento
│   ├── dashboard/             # Dashboard do admin
│   └── globals.css            # Estilos globais
├── components/
│   ├── PlayerList.jsx         # Lista de participantes (dual-mode)
│   ├── AddPlayerForm.jsx      # Formulário para entrar na lista
│   └── UploadReceipt.jsx      # Upload de comprovante
├── lib/
│   ├── ocr.js                 # Extração e validação com Gemini
│   └── supabase.js            # Cliente Supabase
└── public/                     # Assets estáticos
```

## Tecnologias

- **Frontend**: React 19, Next.js 16
- **Backend**: Next.js API Routes
- **Banco de Dados**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **IA/OCR**: Google Gemini Vision API
- **Autenticação**: JWT (jsonwebtoken)
- **Email**: Resend
- **Styling**: CSS Inline + CSS Media Queries
- **Ícones**: React Icons

## Segurança

- JWT para admin (endpoints protegidos)
- Sem autenticação para participantes (apenas leitura de evento público)
- Validação server-side de dados
- Row Level Security (Supabase RLS)
- Sanitização de inputs
- HTTPS em produção

## Troubleshooting

### "Token não fornecido"
- Admin está logado?
- Token está em `localStorage`?
- Endpoint requer JWT?

### "Gemini sobrecarregado"
- API está em alta demanda
- Sistema tenta 3 vezes automaticamente
- Aguarde alguns minutos

### "Comprovante anterior à criação"
- Comprovante deve ser de data >= data de criação do evento
- Margem de 1 dia para tolerar timezone

### "Chave PIX não extraída"
- Alguns bancos não mostram no comprovante
- Sistema valida por nome + valor + data

---

**Desenvolvido por Luan Daufenbach**
