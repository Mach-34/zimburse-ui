import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { useEffect, useMemo, useState } from 'react';
import Loader from '../../../components/Loader';

type AddGroupModalProps = {
  addingGroup: number;
  onFinish: (name: string) => void;
} & Omit<ModalProps, 'children'>;

export default function AddGroupModal({
  addingGroup,
  onClose,
  onFinish,
  open,
}: AddGroupModalProps): JSX.Element {
  const [name, setName] = useState<string>('');

  const buttonText = useMemo(() => {
    if (addingGroup === 1) {
      return `Deploying ${name} Escrow Contract`;
    } else if (addingGroup === 2) {
      return `Adding ${name} to Registry Contract`;
    } else {
      return `Deploy ${name || '"Name"'} Escrow Contract`;
    }
  }, [addingGroup, name]);

  const handleName = (val: string) => {
    if (val.length < 60) {
      setName(val);
    }
  };

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
          <div>
            <div className='flex gap-10'>
              <div>Name: </div>
              <input
                onChange={(e) => handleName(e.target.value)}
                value={name}
              />
            </div>
            <div className='mt-2 text-xs text-center'>
              (Max character limit of 60)
            </div>
          </div>
          <button
            className='bg-[#7896FF] flex gap-2 items-center'
            onClick={() => onFinish(name)}
          >
            <div>{buttonText}</div>
            {addingGroup > 0 && (
              <div>
                <Loader />
              </div>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
