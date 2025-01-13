import Loader from "../../../components/Loader";
import Modal, { ModalProps } from '../../../components/Modal';
import { X } from 'lucide-react';

type ConfirmationModalProps = { loading?: string; message: string; onFinish: () => void } & Omit<
  ModalProps,
  'children'
>;

export default function ConfirmationModal({
  loading,
  message,
  onClose,
  onFinish,
  open,
}: ConfirmationModalProps): JSX.Element {
  return (
    <Modal height={40} onClose={onClose} open={open} width={30}>
      <X className='ml-auto' cursor='pointer' onClick={() => onClose()} />
      <div className='flex flex-col justify-between mt-4'>
        <div className='text-center text-xl'>{message}</div>
        <div className='flex gap-4 mt-16'>
          <button className='bg-[#91FF8E] flex gap-2 items-center justify-center w-1/2' onClick={() => onFinish()}>
            {loading ?? 'Yes'}
            {loading && <Loader size={18}/>}
          </button>
          <button className='bg-[#FF0000] w-1/2' onClick={() => onClose()}>
            No
          </button>
        </div>
      </div>
    </Modal>
  );
}
