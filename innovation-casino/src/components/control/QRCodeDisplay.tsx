'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useId, useMemo, useState } from 'react';
import { getSessionQRUrl } from '@/lib/utils';

interface QRCodeDisplayProps {
  sessionId: string;
  participantBaseUrl?: string;
}

export function QRCodeDisplay({ sessionId, participantBaseUrl }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const qrElementId = useId();
  const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;
  const joinUrl = useMemo(() => {
    const url = getSessionQRUrl(sessionId, {
      baseUrl: participantBaseUrl,
      fallbackOrigin: runtimeOrigin,
    });
    console.log('QR Code URL generated:', url);
    console.log('Session ID:', sessionId);
    console.log('Participant Base URL:', participantBaseUrl);
    console.log('Runtime Origin:', runtimeOrigin);
    console.log('ENV Base URL:', process.env.NEXT_PUBLIC_PARTICIPANT_BASE_URL);
    return url;
  }, [sessionId, participantBaseUrl, runtimeOrigin]);
  const hasConfiguredBase =
    Boolean(participantBaseUrl && participantBaseUrl.trim().length > 0) ||
    Boolean(process.env.NEXT_PUBLIC_PARTICIPANT_BASE_URL?.trim());
  const shareReady = hasConfiguredBase || Boolean(runtimeOrigin);

  const handleCopy = () => {
    if (!shareReady) return;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!shareReady) return;

    const svg = document.getElementById(qrElementId);
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
        {/* Simple QR Code Display for Testing */}
        <div className="bg-white p-4 rounded-lg">
          {shareReady ? (
            <QRCodeSVG
              id={qrElementId}
              value={joinUrl}
              size={256}
              level="L"
              includeMargin={true}
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-gray-500">
              Generating QR code...
            </div>
          )}
        </div>

        {/* Display the actual URL for debugging */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-400">QR Code URL:</p>
          <p className="text-sm text-white font-mono break-all bg-black/20 p-2 rounded">
            {joinUrl}
          </p>
        </div>

        <p className="text-xs text-gray-400 text-center break-all" aria-live="polite">
          {shareReady ? joinUrl : 'Generating link...'}
        </p>

        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <button
            onClick={handleCopy}
            disabled={!shareReady}
            className={`
              flex-1 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-white
              ${shareReady ? 'bg-white/10 hover:bg-white/15' : 'bg-white/5 cursor-not-allowed opacity-60'}
              transition
            `}
          >
            {copied ? '✓ Link Copied' : '📋 Copy Link'}
          </button>
          <button
            onClick={handleDownload}
            disabled={!shareReady}
            className={`
              flex-1 btn-casino text-sm py-3 flex items-center justify-center gap-2
              ${shareReady ? '' : 'opacity-60 cursor-not-allowed'}
            `}
          >
            ⬇️ Download QR
          </button>
        </div>
        {!hasConfiguredBase && (
          <p className="text-[11px] leading-relaxed text-casino-gold/80 text-center">
            Tip: set the <strong>Participant Join URL</strong> when creating the session (or configure <code>NEXT_PUBLIC_PARTICIPANT_BASE_URL</code>) so every QR code points to your public site instead of this device.
          </p>
        )}
      </div>
    </div>
  );
}
