import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { useEffect, useState } from 'react';

type AddRecipientModalProps = {
  onFinish: (address: string, name: string) => void;
} & Omit<ModalProps, 'children'>;

export default function AddRecipientModal({
  onClose,
  onFinish,
  open,
}: AddRecipientModalProps) {
  const [address, setAddress] = useState<string>('');
  const [name, setName] = useState<string>('');

  useEffect(() => {
    setAddress('');
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
        </div>
        <button
          className='bg-zimburseBlue'
          onClick={() => onFinish(address, name)}
        >
          Add Recipient
        </button>
      </div>
    </Modal>
  );
}
