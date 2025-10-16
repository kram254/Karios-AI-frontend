import React from 'react';
import { ArtifactPreview } from './ArtifactPreview';
import { Artifact } from '../../services/artifactManager.service';

interface MessageWithArtifactProps {
  messageContent: React.ReactNode;
  artifacts: Artifact[];
  onArtifactClick: (artifactId: string) => void;
}

export const MessageWithArtifact: React.FC<MessageWithArtifactProps> = ({
  messageContent,
  artifacts,
  onArtifactClick
}) => {
  return (
    <div className="message-with-artifact">
      <div className="message-content-wrapper">
        {messageContent}
      </div>

      {artifacts.length > 0 && (
        <div className="artifacts-container mt-4 space-y-3">
          {artifacts.map((artifact) => (
            <ArtifactPreview
              key={artifact.id}
              artifact={artifact}
              onClick={() => onArtifactClick(artifact.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
