import React, { memo } from 'react';
import { MessageSquare, Settings, Shield, ChevronLeft, ChevronRight, Plus, MessageCircle } from 'lucide-react'; // *Modified* Added MessageCircle
import { motion } from 'framer-motion';

interface Conversation {
  id: string;
  title: string;
  date: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
}

// *Modified* Updated ConversationItem styling to match the design
const ConversationItem = memo(({ chat }: { chat: Conversation }) => (
  <motion.button
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    className={`w-full p-3 rounded-lg hover:bg-[#1A1A1A] transition-colors flex items-center space-x-3 group`}
  >
    <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-[#00F3FF]" />
    <div className="flex flex-col flex-1 text-left">
      <span className="text-white truncate">{chat.title}</span>
      <span className="text-xs text-gray-500">{chat.date}</span>
    </div>
  </motion.button>
));

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse, onOpenSettings }) => {
  const recentConversations: Conversation[] = [
    { id: '1', title: 'Product Inquiry', date: '2024-03-20' },
    { id: '2', title: 'Technical Support', date: '2024-03-19' },
    { id: '3', title: 'Sales Discussion', date: '2024-03-18' },
  ];

  return (
    // *Modified* Updated border color and transition
    <div className={`${isCollapsed ? 'w-16' : 'w-72'} h-full flex flex-col bg-[#0A0A0A] border-r border-[#00F3FF]/20 transition-all duration-300 ease-in-out relative`}>
      {/* *Modified* Updated header section */}
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-4">
          <MessageSquare className="w-6 h-6 text-[#00F3FF] flex-shrink-0" />
          {!isCollapsed && <h1 className="text-xl font-bold">Agentando AI</h1>}
        </div>

        {/* *Modified* Updated New Chat button styling */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full p-3 rounded-lg bg-gradient-to-r from-[#00F3FF] to-[#0066FF] hover:opacity-90 transition-all duration-300 flex items-center justify-center space-x-2 ${
            isCollapsed ? 'p-2' : ''
          }`}
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && <span>New Chat</span>}
        </motion.button>
      </div>

      {/* *Modified* Updated conversations section */}
      <div className="flex-1 overflow-y-auto px-2">
        {!isCollapsed && <h2 className="text-sm font-medium text-gray-400 px-2 mb-2">Recent Conversations</h2>}
        <div className="space-y-1">
          {recentConversations.map((chat) => (
            <ConversationItem key={chat.id} chat={chat} />
          ))}
        </div>
      </div>

      {/* *Modified* Updated bottom section styling */}
      <div className="shrink-0 border-t border-[#00F3FF]/20">
        <div className={`p-4 space-y-2 ${isCollapsed ? 'items-center' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenSettings}
            className={`w-full p-3 rounded-lg hover:bg-[#1A1A1A] transition-colors flex items-center space-x-3 ${
              isCollapsed ? 'justify-center p-2' : ''
            }`}
          >
            <Settings className="w-5 h-5 text-[#00F3FF]" />
            {!isCollapsed && <span>Settings</span>}
          </motion.button>

          <motion.a
            href="/admin"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-3 rounded-lg hover:bg-[#1A1A1A] transition-colors flex items-center space-x-3 ${
              isCollapsed ? 'justify-center p-2' : ''
            }`}
          >
            <Shield className="w-5 h-5 text-[#00F3FF]" />
            {!isCollapsed && <span>Admin Dashboard</span>}
          </motion.a>

          {/* *Modified* Updated user profile section */}
          <div className={`flex items-center space-x-3 p-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00F3FF] to-[#0066FF] flex-shrink-0"></div>
            {!isCollapsed && (
              <div className="flex-1">
                <p className="font-medium">User Name</p>
                <span className="text-sm text-[#00F3FF]">Customer</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* *Modified* Added collapse toggle button */}
      <button
        onClick={onToggleCollapse}
        className="absolute right-0 top-4 -right-3 z-50 bg-[#1A1A1A] p-1.5 rounded-full border border-[#00F3FF]/20 hover:bg-[#2A2A2A] transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-[#00F3FF]" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-[#00F3FF]" />
        )}
      </button>
    </div>
  );
};















// import React, { memo } from 'react';
// import { MessageSquare, Settings, Shield, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
// import { motion } from 'framer-motion';

// interface Conversation {
//   id: string;
//   title: string;
//   date: string;
// }

// interface SidebarProps {
//   isCollapsed: boolean;
//   onToggleCollapse: () => void;
//   onOpenSettings: () => void;
// }

// const ConversationItem = memo(({ chat }: { chat: Conversation }) => (
//   <motion.button
//     whileHover={{ scale: 1.01 }}
//     whileTap={{ scale: 0.99 }}
//     className="w-full px-3 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors flex items-center space-x-3 group"
//   >
//     <MessageSquare className="w-5 h-5 text-[#00F3FF]" />
//     <div className="flex flex-col flex-1 text-left">
//       <span className="text-sm text-white truncate">{chat.title}</span>
//       <span className="text-xs text-[#00F3FF]/60">{chat.date}</span>
//     </div>
//   </motion.button>
// ));

// export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse, onOpenSettings }) => {
//   const recentConversations: Conversation[] = [
//     { id: '1', title: 'Product Inquiry', date: '2024-03-20' },
//     { id: '2', title: 'Technical Support', date: '2024-03-19' },
//     { id: '3', title: 'Sales Discussion', date: '2024-03-18' },
//   ];

//   return (
//     <div className={`${isCollapsed ? 'w-16' : 'w-72'} h-full flex flex-col bg-[#0A0A0A] border-r border-[#00F3FF]/10`}>
//       {/* Fixed Header */}
//       <div className="shrink-0 p-4 flex items-center justify-between">
//         {!isCollapsed && <div className="text-[#00F3FF] text-xl font-semibold">Agentando AI</div>}
//         <motion.button
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//           onClick={onToggleCollapse}
//           className={`text-[#00F3FF] hover:bg-[#1A1A1A] p-1 rounded-lg ${isCollapsed ? 'mx-auto' : ''}`}
//         >
//           {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
//         </motion.button>
//       </div>

//       {/* Fixed New Chat Button */}
//       <div className="shrink-0 px-4 mb-4">
//         <motion.button
//           whileHover={{ scale: 1.02 }}
//           whileTap={{ scale: 0.98 }}
//           className={`w-full py-3 bg-[#00F3FF] text-black rounded-lg flex items-center justify-center space-x-2 font-medium`}
//         >
//           <Plus className="w-5 h-5" />
//           {!isCollapsed && <span>New Chat</span>}
//         </motion.button>
//       </div>

//       {/* Scrollable Conversations */}
//       <div className="flex-1 min-h-0 overflow-y-auto px-4">
//         {!isCollapsed && (
//           <>
//             <h2 className="text-sm text-gray-400 mb-2">Recent Conversations</h2>
//             <div className="space-y-1">
//               {recentConversations.map((chat) => (
//                 <ConversationItem key={chat.id} chat={chat} />
//               ))}
//             </div>
//           </>
//         )}
//       </div>

//       {/* Fixed Bottom Navigation */}
//       <div className="shrink-0 mt-auto border-t border-[#00F3FF]/20">
//         <div className={`p-4 space-y-2 ${isCollapsed ? 'items-center' : ''}`}>
//           <motion.button
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//             onClick={onOpenSettings}
//             className="w-full px-3 py-2 hover:bg-[#1A1A1A] transition-colors flex items-center space-x-3"
//           >
//             <Settings className="w-5 h-5 text-[#00F3FF]" />
//             {!isCollapsed && <span className="text-white">Settings</span>}
//           </motion.button>

//           <motion.button
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//             className="w-full px-3 py-2 hover:bg-[#1A1A1A] transition-colors flex items-center space-x-3"
//           >
//             <Shield className="w-5 h-5 text-[#00F3FF]" />
//             {!isCollapsed && <span className="text-white">Admin Dashboard</span>}
//           </motion.button>

//           <div className="flex items-center space-x-3">
//             <div className="w-8 h-8 rounded-full bg-[#00F3FF]"></div>
//             {!isCollapsed && (
//               <div className="flex flex-col">
//                 <span className="text-sm text-white">User Name</span>
//                 <span className="text-xs text-[#00F3FF]">Customer</span>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
