import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Shield, Wrench, TrendingUp, Brain, Lock, Bell, Languages, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notify } from '../services/notifications';
import { languages, useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../i18n';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// *Modified* Updated tab configuration with new icons and sections
const tabs = [
  { id: 'general', title: 'general', icon: <SettingsIcon className="w-5 h-5" /> },
  { id: 'ai', title: 'ai_settings', icon: <Brain className="w-5 h-5" /> },
  { id: 'security', title: 'security', icon: <Shield className="w-5 h-5" /> },
];

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [selectedRole, setSelectedRole] = useState('support');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  // *Modified* Role cards with translations
  const roleCards = [
    { id: 'support', name: t('focused'), icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'creative', name: t('creative'), icon: <Wrench className="w-5 h-5" /> },
  ];

  // *Modified* Removed draggable functionality as it's not needed
  const handleSaveSettings = async () => {
    try {
      // Create settings object with current values to be sent to the API
      const settingsData = {
        role: selectedRole,
        temperature,
        maxTokens,
        language: language.code,
        notifications,
        autoSave,
      };

      // In a real implementation, we would send settingsData to the backend
      // For now, we'll simulate the API call
      console.log('Saving settings:', settingsData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      notify.success('Settings saved successfully');
      onClose();
    } catch (error) {
      notify.error('Error saving settings');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-[800px] bg-[#0A0A0A] rounded-xl border border-[#00F3FF]/20 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#00F3FF]/20">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-6 h-6 text-[#00F3FF]" />
              <h2 className="text-xl font-bold">{t('settings')}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex h-[600px]">
            {/* Sidebar */}
            <div className="w-64 border-r border-[#00F3FF]/20 p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#1A1A1A] text-[#00F3FF]'
                      : 'text-gray-400 hover:bg-[#1A1A1A]/50 hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{t(tab.title)}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'general' && (
                <div className="space-y-8">
                  {/* Language Selection */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('language')}</h3>
                    <div className="relative">
                      <button
                        onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                        className="w-full flex items-center justify-between p-4 rounded-lg border border-[#00F3FF]/20 hover:border-[#00F3FF]/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Languages className="w-5 h-5 text-[#00F3FF]" />
                          <span className="mr-2">{language.flag}</span>
                          <span>{language.name}</span>
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {isLanguageDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#00F3FF]/20 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                          {languages.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                setLanguage(lang);
                                setIsLanguageDropdownOpen(false);
                              }}
                              className={`w-full text-left p-3 flex items-center hover:bg-[#2A2A2A] transition-colors ${language.code === lang.code ? 'bg-[#2A2A2A]' : ''}`}
                            >
                              <span className="mr-2">{lang.flag}</span>
                              <span>{lang.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('notifications')}</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-[#00F3FF]/20">
                        <div className="flex items-center space-x-3">
                          <Bell className="w-5 h-5 text-[#00F3FF]" />
                          <div>
                            <p className="font-medium">{t('push_notifications')}</p>
                            <p className="text-sm text-gray-400">{t('get_notified_about_new_messages')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setNotifications(!notifications)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            notifications ? 'bg-[#00F3FF]' : 'bg-gray-600'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              notifications ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-8">
                  {/* Role Selection */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('ai_role')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {roleCards.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => setSelectedRole(role.id)}
                          className={`p-4 rounded-lg border transition-colors ${
                            selectedRole === role.id
                              ? 'border-[#00F3FF] bg-[#1A1A1A]'
                              : 'border-[#00F3FF]/20 hover:border-[#00F3FF]/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {role.icon}
                            <span>{role.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('response_style')}</h3>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-[#00F3FF]"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-2">
                      <span>{t('focused')}</span>
                      <span>{t('creative')}</span>
                    </div>
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('response_length')}</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {[1024, 2048, 4096].map((tokens) => (
                        <button
                          key={tokens}
                          onClick={() => setMaxTokens(tokens)}
                          className={`p-3 rounded-lg border ${
                            maxTokens === tokens
                              ? 'border-[#00F3FF] bg-[#1A1A1A]'
                              : 'border-[#00F3FF]/20 hover:border-[#00F3FF]/50'
                          }`}
                        >
                          <span>{tokens}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('privacy')}</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-[#00F3FF]/20">
                        <div className="flex items-center space-x-3">
                          <Lock className="w-5 h-5 text-[#00F3FF]" />
                          <div>
                            <p className="font-medium">{t('auto_save_conversations')}</p>
                            <p className="text-sm text-gray-400">{t('save_chat_history_automatically')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setAutoSave(!autoSave)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            autoSave ? 'bg-[#00F3FF]' : 'bg-gray-600'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              autoSave ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#00F3FF]/20">
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg border border-[#00F3FF]/20 hover:bg-[#1A1A1A] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 rounded-lg bg-[#00F3FF] text-black hover:bg-[#00F3FF]/90 transition-colors"
              >
                {t('save_changes')}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
