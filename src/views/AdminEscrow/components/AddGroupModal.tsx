import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { useEffect, useMemo, useState } from 'react';

type AddGroupModalProps = {
  loading: boolean;
  onFinish: (name: string) => void;
} & Omit<ModalProps, 'children'>;

export default function AddGroupModal({
  loading,
  onClose,
  onFinish,
  open,
}: AddGroupModalProps): JSX.Element {
  const [name, setName] = useState<string>('');

  // const buttonText = useMemo(() => {}, [loading, name]);

  useEffect(() => {
    setName('');
  }, [open]);

  return (
    <Modal
      bgColor='#D9D9D9'
      height={50}
      onClose={onClose}
      open={open}
      width={40}
    >
      <div className='h-full p-2 pb-10'>
        <X className='ml-auto' cursor='pointer' onClick={() => onClose()} />
        <div className='flex flex-col h-full items-center justify-between pt-4'>
          <div>Create new Z-Imburse Escrow Group</div>
          <div className='flex gap-10'>
            <div>Name: </div>
            <input onChange={(e) => setName(e.target.value)} value={name} />
          </div>
          <button className='bg-[#7896FF]' onClick={() => onFinish(name)}>
            Deploy {name || '"Name"'} Escrow Contract
          </button>
        </div>
      </div>
    </Modal>
  );
}
