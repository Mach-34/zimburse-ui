import { useAztec } from '../../../contexts/AztecContext';
import { DEFAULT_PXE_URL } from '../../../utils/constants';

export default function PXEBadge() {
  const { pxe } = useAztec();
  return (
    <div
      className={`border ${
        pxe ? 'border-green-500' : 'border-red-500'
      } px-2 py-1 rounded-full ${
        pxe ? 'text-green-500' : 'text-red-500'
      } text-xs`}
    >
      {pxe ? 'Connected to PXE' : `No PXE found at ${DEFAULT_PXE_URL}`}
    </div>
  );
}
