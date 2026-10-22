import { useState } from 'react';
export function useShare() {
  const [message, setMessage] = useState<'shared' | 'shareError' | null>(null);
  async function share(url: string, title: string) {
    try {
      if (navigator.share) {
        await navigator.share({ url, title });
        setMessage(null);
      } else {
        await navigator.clipboard.writeText(url);
        setMessage('shared');
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError'))
        setMessage('shareError');
    }
  }
  return { message, share };
}
