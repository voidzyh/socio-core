import React from 'react';
import { ResourcePanel } from './ResourcePanel';
import { useUIStore } from '../../store/uiStore';

export const ResourcePanelContainer: React.FC = () => {
  const showResourcePanel = useUIStore((state) => state.showResourcePanel);

  if (!showResourcePanel) return null;

  return <ResourcePanel />;
};
