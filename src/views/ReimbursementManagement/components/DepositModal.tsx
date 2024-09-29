import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { useState } from 'react';

type DepositModalProps = Omit<ModalProps, 'children'>;

export default function DepositModal({
  onClose,
  open,
}: DepositModalProps): JSX.Element {
  const [depositAmt, setDepositAmt] = useState<number>(0);

  return (
    <Modal height={85} onClose={onClose} open={open} width={80}>
      <div className='flex flex-col h-full justify-between'>
        <div>
          <X className='ml-auto' cursor='pointer' onClick={() => onClose()} />
          <div>
            <div className='text-4xl'>Escrow Balance: $XXX,XXX</div>
            <div className='mt-2 text-xl'>
              Active Monthly Entitlements: $xx,xxx.xx
            </div>
            <div className='text-xl'>Active Spot Entitlements: $xx,xxx.xx</div>
          </div>
        </div>
        <div className='flex flex-col gap-8 items-center'>
          <div className='text-4xl'>Your USDC Balance: $X,XXX,XXX.XX</div>
          <div className='flex gap-4 items-center text-xl'>
            <div>Depositing: </div>
            <input
              className='bg-zimburseGray'
              onChange={(e) => setDepositAmt(Number(e.target.value))}
              value={depositAmt}
            />
          </div>
          <button className='bg-zimburseBlue w-64' onClick={() => onClose()}>
            Deposit
          </button>
        </div>
      </div>
    </Modal>
  );
}
