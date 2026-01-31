"use client";

import dynamic from 'next/dynamic';
import { VoiceModeProps } from './VoiceMode';

const VoiceMode = dynamic(() => import('./VoiceMode'), {
  loading: () => (
    <div className="bg-white border-2 border-black/20 rounded-2xl p-6">
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
      </div>
    </div>
  ),
  ssr: false,
});

export default function VoiceModeLazy(props: VoiceModeProps) {
  return <VoiceMode {...props} />;
}
