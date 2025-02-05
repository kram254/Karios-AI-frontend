import React, { useState } from 'react';
import { X, Settings as SettingsIcon, Shield, DollarSign, Wrench, TrendingUp, Brain, Lock, Bell, Languages } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { notify } from '../services/notifications';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// *Modified* Updated tab configuration with new icons and sections
const tabs = [
  { id: 'general', title: 'General', icon: <SettingsIcon className="w-5 h-5" /> },
  { id: 'ai', title: 'AI Settings', icon: <Brain className="w-5 h-5" /> },
  { id: 'security', title: 'Security', icon: <Shield className="w-5 h-5" /> },
];

// *Modified* Updated role cards with consistent styling
const roleCards = [
  { id: 'support', title: 'Customer Support', icon: <SettingsIcon className="w-6 h-6 text-[#00F3FF]" /> },
  { id: 'technical', title: 'Technical Support', icon: <Wrench className="w-6 h-6 text-[#00F3FF]" /> },
  { id: 'sales', title: 'Sales Services', icon: <DollarSign className="w-6 h-6 text-[#00F3FF]" /> },
  { id: 'consulting', title: 'Consulting Services', icon: <TrendingUp className="w-6 h-6 text-[#00F3FF]" /> },
];

export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [selectedRole, setSelectedRole] = useState('support');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  // *Modified* Removed draggable functionality as it's not needed
  const handleSaveSettings = async () => {
    try {
      const settings = {
        role: selectedRole,
        temperature,
        maxTokens,
        language,
        notifications,
        autoSave,
      };

      // Simulate API call
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
              <h2 className="text-xl font-bold">Settings</h2>
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
                  <span>{tab.title}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'general' && (
                <div className="space-y-8">
                  {/* Language Selection */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Language</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {['English', 'Spanish'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setLanguage(lang === 'English' ? 'en' : 'es')}
                          className={`p-4 rounded-lg border ${
                            (language === 'en' && lang === 'English') ||
                            (language === 'es' && lang === 'Spanish')
                              ? 'border-[#00F3FF] bg-[#1A1A1A]'
                              : 'border-[#00F3FF]/20 hover:border-[#00F3FF]/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Languages className="w-5 h-5 text-[#00F3FF]" />
                            <span>{lang}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-[#00F3FF]/20">
                        <div className="flex items-center space-x-3">
                          <Bell className="w-5 h-5 text-[#00F3FF]" />
                          <div>
                            <p className="font-medium">Push Notifications</p>
                            <p className="text-sm text-gray-400">Get notified about new messages</p>
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
                    <h3 className="text-lg font-medium mb-4">AI Role</h3>
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
                            <span>{role.title}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Response Style</h3>
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
                      <span>Focused</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Response Length</h3>
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
                    <h3 className="text-lg font-medium mb-4">Privacy</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-[#00F3FF]/20">
                        <div className="flex items-center space-x-3">
                          <Lock className="w-5 h-5 text-[#00F3FF]" />
                          <div>
                            <p className="font-medium">Auto-save Conversations</p>
                            <p className="text-sm text-gray-400">Save chat history automatically</p>
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
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 rounded-lg bg-[#00F3FF] text-black hover:bg-[#00F3FF]/90 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};









// import React, { useState } from 'react';
// import { X, Settings as SettingsIcon, Shield, DollarSign, Wrench, TrendingUp, Brain, Lock, Bell, Languages } from 'lucide-react';
// import { useDraggable } from '@dnd-kit/core';
// import { motion, AnimatePresence } from 'framer-motion';
// import { notify } from '../services/notifications';

// interface SettingsProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// interface TabConfig {
//   id: string;
//   title: string;
//   icon: React.ReactNode;
// }

// const tabs: TabConfig[] = [
//   { id: 'personality', title: 'Agent Personality', icon: <SettingsIcon className="w-5 h-5" /> },
//   { id: 'knowledge', title: 'Knowledge & Context', icon: <Brain className="w-5 h-5" /> },
//   { id: 'security', title: 'Security & Interface', icon: <Shield className="w-5 h-5" /> },
// ];

// const roleCards = [
//   { id: 'support', title: 'Customer Support', icon: <SettingsIcon className="w-6 h-6" /> },
//   { id: 'technical', title: 'Technical Support', icon: <Wrench className="w-6 h-6" /> },
//   { id: 'sales', title: 'Sales Services', icon: <DollarSign className="w-6 h-6" /> },
//   { id: 'consulting', title: 'Consulting Services', icon: <TrendingUp className="w-6 h-6" /> },
// ];

// export const Settings: React.FC<SettingsProps> = ({ isOpen, onClose }) => {
//   const [activeTab, setActiveTab] = useState('personality');
//   const [temperature, setTemperature] = useState(0.1);
//   const [maxTokens, setMaxTokens] = useState(100);
//   const [topP, setTopP] = useState(0.1);
//   const [selectedRole, setSelectedRole] = useState('');
//   const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
//   const [language, setLanguage] = useState('en');
//   const [notifications, setNotifications] = useState(true);
//   const [autoSave, setAutoSave] = useState(true);

//   const { attributes, listeners, setNodeRef, transform } = useDraggable({
//     id: 'settings-window',
//   });

//   const style = transform ? {
//     transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
//   } : undefined;

//   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const files = event.target.files;
//     if (files) {
//       const formData = new FormData();
//       Array.from(files).forEach(file => {
//         formData.append('files', file);
//       });

//       try {
//         const response = await fetch('http://localhost:8000/api/upload', {
//           method: 'POST',
//           body: formData,
//         });

//         if (response.ok) {
//           notify.success('Files uploaded successfully');
//           setUploadedFiles(prev => [...prev, ...Array.from(files)]);
//         } else {
//           notify.error('Failed to upload files');
//         }
//       } catch (error) {
//         notify.error('Error uploading files');
//       }
//     }
//   };

//   const handleSaveSettings = async () => {
//     try {
//       const settings = {
//         role: selectedRole,
//         temperature,
//         maxTokens,
//         topP,
//         language,
//         notifications,
//         autoSave,
//       };

//       const response = await fetch('http://localhost:8000/api/settings', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(settings),
//       });

//       if (response.ok) {
//         notify.success('Settings saved successfully');
//         onClose();
//       } else {
//         notify.error('Failed to save settings');
//       }
//     } catch (error) {
//       notify.error('Error saving settings');
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
//       >
//         <motion.div
//           ref={setNodeRef}
//           style={style}
//           initial={{ scale: 0.9, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           exit={{ scale: 0.9, opacity: 0 }}
//           className="w-[600px] h-[800px] bg-[#0A0A0A] rounded-lg border border-[#00F3FF]/20 neon-border overflow-hidden"
//           {...attributes}
//           {...listeners}
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between p-4 border-b border-[#00F3FF]/20">
//             <div className="flex items-center space-x-2">
//               <SettingsIcon className="w-6 h-6 text-[#00F3FF]" />
//               <h2 className="text-xl font-bold text-white">Settings</h2>
//             </div>
//             <button
//               onClick={onClose}
//               className="p-1 rounded-full hover:bg-[#1A1A1A] transition-colors"
//             >
//               <X className="w-5 h-5 text-[#00F3FF]" />
//             </button>
//           </div>

//           {/* Tabs */}
//           <div className="flex border-b border-[#00F3FF]/20">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`flex items-center space-x-2 px-4 py-3 transition-colors ${
//                   activeTab === tab.id
//                     ? 'text-[#00F3FF] border-b-2 border-[#00F3FF]'
//                     : 'text-gray-400 hover:text-white'
//                 }`}
//               >
//                 {tab.icon}
//                 <span>{tab.title}</span>
//               </button>
//             ))}
//           </div>

//           {/* Content */}
//           <div className="p-6 overflow-y-auto" style={{ height: 'calc(100% - 120px)' }}>
//             {activeTab === 'personality' && (
//               <div className="space-y-8">
//                 {/* Role Selection */}
//                 <div>
//                   <h3 className="text-lg font-medium text-white mb-4">Role Selection</h3>
//                   <div className="grid grid-cols-2 gap-4">
//                     {roleCards.map((role) => (
//                       <motion.button
//                         key={role.id}
//                         onClick={() => setSelectedRole(role.id)}
//                         whileHover={{ scale: 1.02 }}
//                         whileTap={{ scale: 0.98 }}
//                         className={`p-4 rounded-lg border transition-all duration-300 ${
//                           selectedRole === role.id
//                             ? 'border-[#00F3FF] neon-border'
//                             : 'border-[#00F3FF]/20 hover:border-[#00F3FF]/50'
//                         }`}
//                       >
//                         <div className="flex items-center space-x-3">
//                           {role.icon}
//                           <span className="text-white">{role.title}</span>
//                         </div>
//                       </motion.button>
//                     ))}
//                   </div>
//                 </div>

//                 {/* Temperature Slider */}
//                 <div>
//                   <h3 className="text-lg font-medium text-white mb-4">Temperature</h3>
//                   <input
//                     type="range"
//                     min="0"
//                     max="1"
//                     step="0.1"
//                     value={temperature}
//                     onChange={(e) => setTemperature(parseFloat(e.target.value))}
//                     className="w-full"
//                   />
//                   <div className="flex justify-between text-sm text-gray-400">
//                     <span>Conservative (0.0)</span>
//                     <span>Creative (1.0)</span>
//                   </div>
//                 </div>

//                 {/* Max Tokens */}
//                 <div>
//                   <h3 className="text-lg font-medium text-white mb-4">Max Tokens</h3>
//                   <div className="flex space-x-4">
//                     <motion.button
//                       whileHover={{ scale: 1.02 }}
//                       whileTap={{ scale: 0.98 }}
//                       onClick={() => setMaxTokens(100)}
//                       className={`flex-1 p-3 rounded-lg border transition-all duration-300 ${
//                         maxTokens === 100
//                           ? 'border-[#00F3FF] neon-border'
//                           : 'border-[#00F3FF]/20'
//                       }`}
//                     >
//                       <span className="text-white">Concise (100)</span>
//                     </motion.button>
//                     <motion.button
//                       whileHover={{ scale: 1.02 }}
//                       whileTap={{ scale: 0.98 }}
//                       onClick={() => setMaxTokens(200)}
//                       className={`flex-1 p-3 rounded-lg border transition-all duration-300 ${
//                         maxTokens === 200
//                           ? 'border-[#00F3FF] neon-border'
//                           : 'border-[#00F3FF]/20'
//                       }`}
//                     >
//                       <span className="text-white">Detailed (200)</span>
//                     </motion.button>
//                   </div>
//                 </div>

//                 {/* Language Selection */}
//                 <div>
//                   <h3 className="text-lg font-medium text-white mb-4">Language</h3>
//                   <div className="grid grid-cols-2 gap-4">
//                     <motion.button
//                       whileHover={{ scale: 1.02 }}
//                       whileTap={{ scale: 0.98 }}
//                       onClick={() => setLanguage('en')}
//                       className={`p-3 rounded-lg border transition-all duration-300 ${
//                         language === 'en'
//                           ? 'border-[#00F3FF] neon-border'
//                           : 'border-[#00F3FF]/20'
//                       }`}
//                     >
//                       <div className="flex items-center space-x-2">
//                         <Languages className="w-5 h-5 text-[#00F3FF]" />
//                         <span className="text-white">English</span>
//                       </div>
//                     </motion.button>
//                     <motion.button
//                       whileHover={{ scale: 1.02 }}
//                       whileTap={{ scale: 0.98 }}
//                       onClick={() => setLanguage('es')}
//                       className={`p-3 rounded-lg border transition-all duration-300 ${
//                         language === 'es'
//                           ? 'border-[#00F3FF] neon-border'
//                           : 'border-[#00F3FF]/20'
//                       }`}
//                     >
//                       <div className="flex items-center space-x-2">
//                         <Languages className="w-5 h-5 text-[#00F3FF]" />
//                         <span className="text-white">Spanish</span>
//                       </div>
//                     </motion.button>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {activeTab === 'knowledge' && (
//               <div className="space-y-8">
//                 {/* File Upload */}
//                 <div>
//                   <h3 className="text-lg font-medium text-white mb-4">Upload Knowledge Base</h3>
//                   <div className="border-2 border-dashed border-[#00F3FF]/20 rounded-lg p-8 text-center">
//                     <input
//                       type="file"
//                       multiple
//                       onChange={handleFileUpload}
//                       className="hidden"
//                       id="file-upload"
//                     />
//                     <label
//                       htmlFor="file-upload"
//                       className="cursor-pointer text-[#00F3FF] hover:text-[#00F3FF]/80"
//                     >
//                       Click to upload files
//                     </label>
//                     <p className="text-sm text-gray-400 mt-2">
//                       Supports PDF, TXT, DOC, DOCX
//                     </p>
//                   </div>
//                   {uploadedFiles.length > 0 && (
//                     <div className="mt-4">
//                       <h4 className="text-sm font-medium text-white mb-2">Uploaded Files</h4>
//                       <div className="space-y-2">
//                         {uploadedFiles.map((file, index) => (
//                           <div
//                             key={index}
//                             className="flex items-center justify-between p-2 bg-[#1A1A1A] rounded"
//                           >
//                             <span className="text-sm text-white">{file.name}</span>
//                             <span className="text-xs text-gray-400">
//                               {(file.size / 1024).toFixed(1)} KB
//                             </span>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Context Window */}
//                 <div>
//                   <h3 className="text-lg font-medium text-white mb-4">Context Window</h3>
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <span className="text-white">Auto-save chat history</span>
//                       <motion.button
//                         whileHover={{ scale: 1.1 }}
//                         whileTap={{ scale: 0.9 }}
//                         onClick={() => setAutoSave(!autoSave)}
//                         className={`w-12 h-6 rounded-full transition-colors ${
//                           autoSave ? 'bg-[#00F3FF]' : 'bg-gray-600'
//                         }`}
//                       >
//                         <div
//                           className={`w-4 h-4 rounded-full bg-white transition-transform ${
//                             autoSave ? 'translate-x-7' : 'translate-x-1'
//                           }`}
//                         />
//                       </motion.button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {activeTab === 'security' && (
//               <div className="space-y-8">
//                 {/* Security Settings */}
//                 <div>
//                   <h3 className="text-lg font-medium text-white mb-4">Security Settings</h3>
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center space-x-2">
//                         <Lock className="w-5 h-5 text-[#00F3FF]" />
//                         <span className="text-white">Content Moderation</span>
//                       </div>
//                       <motion.button
//                         whileHover={{ scale: 1.1 }}
//                         whileTap={{ scale: 0.9 }}
//                         className="w-12 h-6 bg-[#00F3FF] rounded-full"
//                       >
//                         <div className="w-4 h-4 translate-x-7 rounded-full bg-white" />
//                       </motion.button>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Notification Settings */}
//                 <div>
//                   <h3 className="text-lg font-medium text-white mb-4">Notification Settings</h3>
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center space-x-2">
//                         <Bell className="w-5 h-5 text-[#00F3FF]" />
//                         <span className="text-white">Push Notifications</span>
//                       </div>
//                       <motion.button
//                         whileHover={{ scale: 1.1 }}
//                         whileTap={{ scale: 0.9 }}
//                         onClick={() => setNotifications(!notifications)}
//                         className={`w-12 h-6 rounded-full transition-colors ${
//                           notifications ? 'bg-[#00F3FF]' : 'bg-gray-600'
//                         }`}
//                       >
//                         <div
//                           className={`w-4 h-4 rounded-full bg-white transition-transform ${
//                             notifications ? 'translate-x-7' : 'translate-x-1'
//                           }`}
//                         />
//                       </motion.button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Footer */}
//           <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#00F3FF]/20 bg-[#0A0A0A]">
//             <div className="flex justify-end space-x-4">
//               <motion.button
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//                 onClick={onClose}
//                 className="px-4 py-2 rounded-lg border border-[#00F3FF]/20 text-white hover:bg-[#1A1A1A]"
//               >
//                 Cancel
//               </motion.button>
//               <motion.button
//                 whileHover={{ scale: 1.02 }}
//                 whileTap={{ scale: 0.98 }}
//                 onClick={handleSaveSettings}
//                 className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00F3FF] to-[#0066FF] text-black hover:opacity-90"
//               >
//                 Save Changes
//               </motion.button>
//             </div>
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// };
