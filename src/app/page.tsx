'use client';

import React, { useState } from 'react';
import { Canvas } from '@/components/Canvas';
import { Toolbar } from '@/components/Toolbar';
import { Tool } from '@/lib/types';

export default function Home() {
  // Global keyboard shortcuts
  // TODO: Move this to a proper hook or component, but for now leave it here 
  // or better yet, move it to Canvas since focus usually on it.

  // Actually, let's keep it here but dispatch to store

  return (
    <div className="w-screen h-screen overflow-hidden bg-neo-bg text-neo-text">
      <Toolbar />
      <Canvas />
    </div>
  );
}
