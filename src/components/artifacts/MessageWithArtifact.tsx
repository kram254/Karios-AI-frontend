import React from 'react';
import { ArtifactPreview } from './ArtifactPreview';
import { Artifact } from '../../services/artifactManager.service';

interface MessageWithArtifactProps {
  messageContent: React.ReactNode;
  artifacts: Artifact[];
  onArtifactClick: (artifactId: string) => void;
  activeArtifactId?: string | null;
}

export const MessageWithArtifact: React.FC<MessageWithArtifactProps> = ({
  messageContent,
  artifacts,
  onArtifactClick,
  activeArtifactId = null
}) => {
  return (
    <div className="message-with-artifact">
      {artifacts.length > 0 && (
        <div className="artifacts-container mb-3 space-y-2">
          {artifacts.map((artifact) => (
            <ArtifactPreview
              key={artifact.id}
              artifact={artifact}
              variant="card"
              isActive={activeArtifactId === artifact.id}
              onClick={() => onArtifactClick(artifact.id)}
            />
          ))}
        </div>
      )}
      <div className="message-content-wrapper">
        {messageContent}
      </div>
    </div>
  );
};
