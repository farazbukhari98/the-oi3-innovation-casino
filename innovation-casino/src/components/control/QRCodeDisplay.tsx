'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

interface QRCodeDisplayProps {
  sessionId: string;
}

export function QRCodeDisplay({ sessionId }: QRCodeDisplayProps) {
  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join?session=${sessionId}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `innovation-casino-${sessionId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="casino-card space-y-4">
      <div className="space-y-2 text-center">
        <h3 className="text-xl font-heading text-white">Participant QR Code</h3>
        <p className="text-sm text-gray-400">
          Display this on the main screen or share the link directly.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-casino-gold/30 opacity-60" />

          {/* Poker chip container */}
          <div className="relative w-[320px] h-[320px]">
            {/* Outer red ring with shadow for 3D effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#e53e3e] to-[#b91c1c] shadow-[0_32px_60px_-30px_rgba(0,0,0,0.75),inset_0_-8px_16px_rgba(0,0,0,0.3),inset_0_2px_8px_rgba(255,255,255,0.2)]" />

            {/* White segments */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0"
                style={{
                  transform: `rotate(${i * 45}deg)`,
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[32px] h-[40px] bg-gradient-to-b from-white to-gray-100 rounded-b-lg shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]" />
              </div>
            ))}

            {/* Dashed ring pattern */}
            <div className="absolute inset-[32px] rounded-full border-[3px] border-dashed border-white/40" />

            {/* Inner shadow ring */}
            <div className="absolute inset-[36px] rounded-full shadow-[inset_0_0_16px_rgba(0,0,0,0.4)]" />

            {/* Center cream area for QR code */}
            <div className="absolute inset-[40px] rounded-full bg-[#f5f0de] shadow-[inset_0_4px_12px_rgba(0,0,0,0.25),0_2px_8px_rgba(0,0,0,0.15)]">
              {/* Inner decorative border */}
              <div className="absolute inset-[8px] rounded-full border-[2px] border-black/10" />

              {/* QR Code */}
              <div className="absolute inset-[16px] flex items-center justify-center">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={joinUrl}
                  size={208}
                  level="H"
                  fgColor="#0a0a0a"
                  bgColor="transparent"
                  includeMargin={false}
                  style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                />
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center break-all">
          {joinUrl}
        </p>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 transition"
          >
            {copied ? '✓ Link Copied' : '📋 Copy Link'}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 btn-casino text-sm py-3 flex items-center justify-center gap-2"
          >
            ⬇️ Download QR
          </button>
        </div>
      </div>
    </div>
  );
}
