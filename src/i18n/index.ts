import { useLanguage } from '../context/LanguageContext';

type Language = {
  code: string;
  name: string;
  flag: string;
};

// Define translation keys for the application
export type TranslationKey = 
  // Navigation and common elements
  | 'new_chat'
  | 'settings'
  | 'agents'
  | 'logout'
  | 'previous_conversations'
  | 'search'
  | 'send_message'
  | 'type_message'
  // Settings
  | 'language'
  | 'notifications'
  | 'push_notifications'
  | 'get_notified'
  | 'general'
  | 'ai_settings'
  | 'security'
  | 'ai_role'
  | 'response_style'
  | 'focused'
  | 'creative'
  | 'response_length'
  | 'privacy'
  | 'auto_save'
  | 'save_chat_history'
  | 'cancel'
  | 'save_changes'
  | 'get_notified_about_new_messages'
  | 'auto_save_conversations'
  | 'save_chat_history_automatically'
  // Agent creation
  | 'create_agent'
  | 'agent_name'
  | 'agent_description'
  | 'role_behavior'
  | 'knowledge_base'
  | 'create';

// Define the interface for translations
export interface Translations {
  [key: string]: {
    [key in TranslationKey]?: string;
  };
}

// Define translations
export const translations: Translations = {
  en: {
    new_chat: 'New Chat',
    settings: 'Settings',
    agents: 'Agents',
    logout: 'Logout',
    previous_conversations: 'Previous Conversations',
    search: 'Search',
    send_message: 'Send Message',
    type_message: 'Type your message here...',
    language: 'Language',
    notifications: 'Notifications',
    push_notifications: 'Push Notifications',
    get_notified: 'Get notified about new messages',
    get_notified_about_new_messages: 'Get notified about new messages',
    auto_save_conversations: 'Auto-save Conversations',
    save_chat_history_automatically: 'Save chat history automatically',
    general: 'General',
    ai_settings: 'AI Settings',
    security: 'Security',
    ai_role: 'AI Role',
    response_style: 'Response Style',
    focused: 'Focused',
    creative: 'Creative',
    response_length: 'Response Length',
    privacy: 'Privacy',
    auto_save: 'Auto-save Conversations',
    save_chat_history: 'Save chat history automatically',
    cancel: 'Cancel',
    save_changes: 'Save Changes',
    create_agent: 'Create Agent',
    agent_name: 'Agent Name',
    agent_description: 'Agent Description',
    role_behavior: 'Role & Behavior',
    knowledge_base: 'Knowledge Base',
    create: 'Create'
  },
  es: {
    new_chat: 'Nuevo Chat',
    settings: 'Configuración',
    agents: 'Agentes',
    logout: 'Cerrar Sesión',
    previous_conversations: 'Conversaciones Anteriores',
    search: 'Buscar',
    send_message: 'Enviar Mensaje',
    type_message: 'Escribe tu mensaje aquí...',
    language: 'Idioma',
    notifications: 'Notificaciones',
    push_notifications: 'Notificaciones Push',
    get_notified: 'Recibe notificaciones sobre nuevos mensajes',
    get_notified_about_new_messages: 'Recibe notificaciones sobre nuevos mensajes',
    auto_save_conversations: 'Guardar Conversaciones Automaticamente',
    save_chat_history_automatically: 'Guardar historial de chat automáticamente',
    general: 'General',
    ai_settings: 'Configuración de IA',
    security: 'Seguridad',
    ai_role: 'Rol de IA',
    response_style: 'Estilo de Respuesta',
    focused: 'Enfocado',
    creative: 'Creativo',
    response_length: 'Longitud de Respuesta',
    privacy: 'Privacidad',
    auto_save: 'Guardar Conversaciones Automaticamente',
    save_chat_history: 'Guardar historial de chat automáticamente',
    cancel: 'Cancelar',
    save_changes: 'Guardar Cambios',
    create_agent: 'Crear Agente',
    agent_name: 'Nombre del Agente',
    agent_description: 'Descripción del Agente',
    role_behavior: 'Rol y Comportamiento',
    knowledge_base: 'Base de Conocimiento',
    create: 'Crear'
  },
  it: {
    new_chat: 'Nuova Chat',
    settings: 'Impostazioni',
    agents: 'Agenti',
    logout: 'Disconnetti',
    previous_conversations: 'Conversazioni Precedenti',
    search: 'Cerca',
    send_message: 'Invia Messaggio',
    type_message: 'Scrivi il tuo messaggio qui...',
    language: 'Lingua',
    notifications: 'Notifiche',
    push_notifications: 'Notifiche Push',
    get_notified: 'Ricevi notifiche sui nuovi messaggi',
    get_notified_about_new_messages: 'Ricevi notifiche sui nuovi messaggi',
    auto_save_conversations: 'Salvataggio Automatico Conversazioni',
    save_chat_history_automatically: 'Salva automaticamente la cronologia chat',
    general: 'Generale',
    ai_settings: 'Impostazioni IA',
    security: 'Sicurezza',
    ai_role: 'Ruolo IA',
    response_style: 'Stile di Risposta',
    focused: 'Concentrato',
    creative: 'Creativo',
    response_length: 'Lunghezza Risposta',
    privacy: 'Privacy',
    auto_save: 'Salvataggio Automatico Conversazioni',
    save_chat_history: 'Salva automaticamente la cronologia chat',
    cancel: 'Annulla',
    save_changes: 'Salva Modifiche',
    create_agent: 'Crea Agente',
    agent_name: 'Nome Agente',
    agent_description: 'Descrizione Agente',
    role_behavior: 'Ruolo e Comportamento',
    knowledge_base: 'Base di Conoscenza',
    create: 'Crea'
  },
  pt: {
    new_chat: 'Nova Conversa',
    settings: 'Configurações',
    agents: 'Agentes',
    logout: 'Sair',
    previous_conversations: 'Conversas Anteriores',
    search: 'Pesquisar',
    send_message: 'Enviar Mensagem',
    type_message: 'Digite sua mensagem aqui...',
    language: 'Idioma',
    notifications: 'Notificações',
    push_notifications: 'Notificações Push',
    get_notified: 'Receba notificações sobre novas mensagens',
    get_notified_about_new_messages: 'Receba notificações sobre novas mensagens',
    auto_save_conversations: 'Salvar Conversas Automaticamente',
    save_chat_history_automatically: 'Salvar histórico de conversas automaticamente',
    general: 'Geral',
    ai_settings: 'Configurações de IA',
    security: 'Segurança',
    ai_role: 'Função da IA',
    response_style: 'Estilo de Resposta',
    focused: 'Focado',
    creative: 'Criativo',
    response_length: 'Tamanho da Resposta',
    privacy: 'Privacidade',
    auto_save: 'Salvar Conversas Automaticamente',
    save_chat_history: 'Salvar histórico de conversas automaticamente',
    cancel: 'Cancelar',
    save_changes: 'Salvar Alterações',
    create_agent: 'Criar Agente',
    agent_name: 'Nome do Agente',
    agent_description: 'Descrição do Agente',
    role_behavior: 'Função e Comportamento',
    knowledge_base: 'Base de Conhecimento',
    create: 'Criar'
  },
  el: {
    new_chat: 'Νέα Συνομιλία',
    settings: 'Ρυθμίσεις',
    agents: 'Πράκτορες',
    logout: 'Αποσύνδεση',
    previous_conversations: 'Προηγούμενες Συνομιλίες',
    search: 'Αναζήτηση',
    send_message: 'Αποστολή Μηνύματος',
    type_message: 'Γράψτε το μήνυμά σας εδώ...',
    language: 'Γλώσσα',
    notifications: 'Ειδοποιήσεις',
    push_notifications: 'Ειδοποιήσεις Push',
    get_notified: 'Λάβετε ειδοποιήσεις για νέα μηνύματα',
    get_notified_about_new_messages: 'Λάβετε ειδοποιήσεις για νέα μηνύματα',
    auto_save_conversations: 'Αυτόματη Αποθήκευση Συνομιλιών',
    save_chat_history_automatically: 'Αυτόματη αποθήκευση ιστορικού συνομιλιών',
    general: 'Γενικά',
    ai_settings: 'Ρυθμίσεις AI',
    security: 'Ασφάλεια',
    ai_role: 'Ρόλος AI',
    response_style: 'Στυλ Απάντησης',
    focused: 'Εστιασμένο',
    creative: 'Δημιουργικό',
    response_length: 'Μήκος Απάντησης',
    privacy: 'Απόρρητο',
    auto_save: 'Αυτόματη Αποθήκευση Συνομιλιών',
    save_chat_history: 'Αυτόματη αποθήκευση ιστορικού συνομιλιών',
    cancel: 'Ακύρωση',
    save_changes: 'Αποθήκευση Αλλαγών',
    create_agent: 'Δημιουργία Πράκτορα',
    agent_name: 'Όνομα Πράκτορα',
    agent_description: 'Περιγραφή Πράκτορα',
    role_behavior: 'Ρόλος & Συμπεριφορά',
    knowledge_base: 'Βάση Γνώσεων',
    create: 'Δημιουργία'
  },
  zh: {
    new_chat: '新聊天',
    settings: '设置',
    agents: '代理',
    logout: '登出',
    previous_conversations: '之前的对话',
    search: '搜索',
    send_message: '发送消息',
    type_message: '在此输入您的消息...',
    language: '语言',
    notifications: '通知',
    push_notifications: '推送通知',
    get_notified: '接收新消息通知',
    get_notified_about_new_messages: '接收新消息通知',
    auto_save_conversations: '自动保存对话',
    save_chat_history_automatically: '自动保存聊天历史',
    general: '常规',
    ai_settings: 'AI设置',
    security: '安全',
    ai_role: 'AI角色',
    response_style: '回复风格',
    focused: '专注',
    creative: '创意',
    response_length: '回复长度',
    privacy: '隐私',
    auto_save: '自动保存对话',
    save_chat_history: '自动保存聊天历史',
    cancel: '取消',
    save_changes: '保存更改',
    create_agent: '创建代理',
    agent_name: '代理名称',
    agent_description: '代理描述',
    role_behavior: '角色和行为',
    knowledge_base: '知识库',
    create: '创建'
  },
  ko: {
    new_chat: '새 채팅',
    settings: '설정',
    agents: '에이전트',
    logout: '로그아웃',
    previous_conversations: '이전 대화',
    search: '검색',
    send_message: '메시지 보내기',
    type_message: '여기에 메시지를 입력하세요...',
    language: '언어',
    notifications: '알림',
    push_notifications: '푸시 알림',
    get_notified: '새 메시지에 대한 알림 받기',
    get_notified_about_new_messages: '새 메시지에 대한 알림 받기',
    auto_save_conversations: '대화 자동 저장',
    save_chat_history_automatically: '채팅 기록 자동 저장',
    general: '일반',
    ai_settings: 'AI 설정',
    security: '보안',
    ai_role: 'AI 역할',
    response_style: '응답 스타일',
    focused: '집중',
    creative: '창의적',
    response_length: '응답 길이',
    privacy: '개인 정보',
    auto_save: '대화 자동 저장',
    save_chat_history: '채팅 기록 자동 저장',
    cancel: '취소',
    save_changes: '변경 사항 저장',
    create_agent: '에이전트 생성',
    agent_name: '에이전트 이름',
    agent_description: '에이전트 설명',
    role_behavior: '역할 및 행동',
    knowledge_base: '지식 기반',
    create: '생성'
  },
  fr: {
    new_chat: 'Nouvelle Discussion',
    settings: 'Paramètres',
    agents: 'Agents',
    logout: 'Déconnexion',
    previous_conversations: 'Conversations Précédentes',
    search: 'Rechercher',
    send_message: 'Envoyer le Message',
    type_message: 'Écrivez votre message ici...',
    language: 'Langue',
    notifications: 'Notifications',
    push_notifications: 'Notifications Push',
    get_notified: 'Recevez des notifications pour les nouveaux messages',
    get_notified_about_new_messages: 'Recevez des notifications pour les nouveaux messages',
    auto_save_conversations: 'Sauvegarde Automatique des Conversations',
    save_chat_history_automatically: 'Sauvegarder automatiquement l\'historique des discussions',
    general: 'Général',
    ai_settings: 'Paramètres IA',
    security: 'Sécurité',
    ai_role: 'Rôle de l\'IA',
    response_style: 'Style de Réponse',
    focused: 'Concentré',
    creative: 'Créatif',
    response_length: 'Longueur de Réponse',
    privacy: 'Confidentialité',
    auto_save: 'Sauvegarde Automatique des Conversations',
    save_chat_history: 'Sauvegarder automatiquement l\'historique des discussions',
    cancel: 'Annuler',
    save_changes: 'Enregistrer les Modifications',
    create_agent: 'Créer un Agent',
    agent_name: 'Nom de l\'Agent',
    agent_description: 'Description de l\'Agent',
    role_behavior: 'Rôle et Comportement',
    knowledge_base: 'Base de Connaissances',
    create: 'Créer'
  },
  ru: {
    new_chat: 'Новый Чат',
    settings: 'Настройки',
    agents: 'Агенты',
    logout: 'Выйти',
    previous_conversations: 'Предыдущие Разговоры',
    search: 'Поиск',
    send_message: 'Отправить Сообщение',
    type_message: 'Введите ваше сообщение здесь...',
    language: 'Язык',
    notifications: 'Уведомления',
    push_notifications: 'Push-уведомления',
    get_notified: 'Получайте уведомления о новых сообщениях',
    get_notified_about_new_messages: 'Получайте уведомления о новых сообщениях',
    auto_save_conversations: 'Автоматическое Сохранение Разговоров',
    save_chat_history_automatically: 'Автоматически сохранять историю чата',
    general: 'Общие',
    ai_settings: 'Настройки ИИ',
    security: 'Безопасность',
    ai_role: 'Роль ИИ',
    response_style: 'Стиль Ответа',
    focused: 'Сфокусированный',
    creative: 'Творческий',
    response_length: 'Длина Ответа',
    privacy: 'Конфиденциальность',
    auto_save: 'Автоматическое Сохранение Разговоров',
    save_chat_history: 'Автоматически сохранять историю чата',
    cancel: 'Отмена',
    save_changes: 'Сохранить Изменения',
    create_agent: 'Создать Агента',
    agent_name: 'Имя Агента',
    agent_description: 'Описание Агента',
    role_behavior: 'Роль и Поведение',
    knowledge_base: 'База Знаний',
    create: 'Создать'
  }
};

// Helper function to get translation based on language code and key
export function getTranslation(language: Language, key: TranslationKey): string {
  const langTranslations = translations[language.code] || translations.en;
  return langTranslations[key] || translations.en[key] || key;
}

export function useTranslation() {
  const { language } = useLanguage();
  
  const t = (key: TranslationKey): string => {
    return getTranslation(language, key);
  };
  
  return { t };
}
