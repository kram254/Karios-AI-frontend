import React from 'react';
import AnimatedBotAvatar from './AnimatedBotAvatar';

interface BotAvatarIconProps {
  size?: number;
  animate?: boolean;
  state?: 'active' | 'idle';
}

const BotAvatarIcon: React.FC<BotAvatarIconProps> = ({ 
  size = 40, 
  animate = true,
  state = 'idle' 
}) => {
  const resolvedSize: 'inline' | 'tiny' | 'small' | 'normal' | 'large' =
    size <= 24 ? 'inline' : size <= 36 ? 'tiny' : size <= 56 ? 'small' : size <= 92 ? 'normal' : 'large';

  const resolvedState = state === 'active' ? 'thinking' : 'idle';

  if (!animate) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <img
          src="/bot/bot.png"
          alt="Bot"
          className="w-full h-full object-cover rounded-full"
          style={{ opacity: 0.9 }}
        />
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <AnimatedBotAvatar
        state={resolvedState}
        message=""
        size={resolvedSize}
        variant={resolvedSize === 'inline' ? 'inline' : 'icon'}
        showMessage={false}
      />
    </div>
  );
};

export default BotAvatarIcon;
