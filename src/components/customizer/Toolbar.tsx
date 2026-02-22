'use client';
// Stub retrocompatibile — wrappa Configurator con la vecchia interfaccia { side }
import { useState } from 'react';
import { Configurator } from './Configurator';

interface ToolbarProps {
  side: 'front' | 'back';
}

export function Toolbar({ side: initialSide }: ToolbarProps) {
  const [side, setSide] = useState<'front' | 'back'>(initialSide);
  return (
    <Configurator
      side={side}
      onSideChange={setSide}
      onReset={() => {
        if (confirm('Cancellare il design?')) {
          window.dispatchEvent(new CustomEvent('resetCanvas'));
        }
      }}
    />
  );
}
