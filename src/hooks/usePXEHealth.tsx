import { useEffect, useRef } from 'react';
import { PXE } from '@aztec/aztec.js';
import { toast } from 'react-toastify';
import { DEFAULT_PXE_URL } from '../utils/constants';

export default function usePxeHealth(
  pxe: PXE | null,
  onPXEConnectionLost: () => void
) {
  const intervalIdRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Clear any existing interval when pxe changes or on cleanup
    const clearExistingInterval = () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };

    if (pxe) {
      // Set up a new interval
      intervalIdRef.current = setInterval(async () => {
        if (isProcessingRef.current) return;

        isProcessingRef.current = true;
        try {
          await pxe.getPXEInfo();
        } catch {
          onPXEConnectionLost();
          toast.error(`Lost connection to PXE at ${DEFAULT_PXE_URL}`);
        } finally {
          isProcessingRef.current = false;
        }
      }, 5000);
    } else {
      clearExistingInterval();
    }

    return () => {
      clearExistingInterval();
    };
  }, [onPXEConnectionLost, pxe]);
}
