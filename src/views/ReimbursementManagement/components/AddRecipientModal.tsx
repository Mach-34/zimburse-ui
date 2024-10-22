import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { useEffect, useState } from 'react';
import Loader from '../../../components/Loader';

type AddRecipientModalProps = {
  loading: boolean;
  onFinish: (address: string, amount: number, name: string) => void;
} & Omit<ModalProps, 'children'>;

export default function AddRecipientModal({
  loading,
  onClose,
  onFinish,
  open,
}: AddRecipientModalProps) {
  const [address, setAddress] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [name, setName] = useState<string>('');

  useEffect(() => {
    setAddress('');
    setAmount(0);
    setName('');
  }, [open]);

  return (
    <Modal height={65} onClose={onClose} open={open} width={40}>
      <X className='ml-auto' cursor='pointer' onClick={() => onClose()} />
      <div className='flex flex-col h-[75%] items-center justify-between mt-4'>
        <div className='text-2xl'>Add Recipient</div>
        <div className='text-center text-xl'>
          <div>Recipient Name</div>
          <input
            className='bg-zimburseGray my-2'
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
          <div>Recipient Address</div>
          <input
            className='bg-zimburseGray my-2'
            onChange={(e) => setAddress(e.target.value)}
            value={address}
          />
          <div>Amount</div>
          <input
            className='bg-zimburseGray my-2'
            onChange={(e) => setAmount(Number(e.target.value))}
            value={amount}
            type='number'
          />
        </div>
        <button
          className='bg-zimburseBlue flex items-center gap-2'
          onClick={() => onFinish(address, amount, name)}
        >
          <div>{loading ? 'Adding recipient...' : 'Add Recipient'}</div>
          {loading && <Loader />}
        </button>
      </div>
    </Modal>
  );
}
