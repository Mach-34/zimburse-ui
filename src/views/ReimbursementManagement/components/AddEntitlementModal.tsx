import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { useEffect, useMemo, useState } from 'react';
import Loader from '../../../components/Loader';
import Select from '../../../components/Select';

type AddEntitlementModalProps = {
  loading: boolean;
  onFinish: (amount: number, verifier: string, spot?: boolean) => void;
} & Omit<ModalProps, 'children'>;

export default function AddEntitlementModal({
  loading,
  onClose,
  onFinish,
  open,
}: AddEntitlementModalProps) {
  const [amount, setAmount] = useState<number>(0);
  const [selectedEntitlement, setSelectedEntitlement] = useState<
    string | undefined
  >(undefined);
  const [spot, setSpot] = useState<boolean>(false);

  const disabled = useMemo(() => {
    return amount <= 0 || !selectedEntitlement;
  }, [amount, selectedEntitlement]);

  useEffect(() => {
    setAmount(0);
  }, [open]);

  return (
    <Modal height={65} onClose={onClose} open={open} width={40}>
      <X className='ml-auto' cursor='pointer' onClick={() => onClose()} />
      <div className='flex flex-col h-[75%] items-center justify-between mt-4'>
        <div className='text-2xl'>Add Entitlement</div>
        <div className='text-center text-xl'>
          <div>Amount</div>
          <input
            className='bg-zimburseGray my-2'
            onChange={(e) => setAmount(Number(e.target.value))}
            value={amount}
            type='number'
          />
          <div className='my-2'>Verifier Type</div>
          <Select
            onChange={setSelectedEntitlement}
            placeholder='Select entitlement'
            selected={selectedEntitlement}
            options={['Linode', 'United']}
          />
          <div className='mt-2'>
            <label className='mr-2'>Spot</label>
            <input
              checked={spot}
              onChange={() => setSpot(!spot)}
              type='checkbox'
            />
          </div>
        </div>
        <button
          className='bg-zimburseBlue flex items-center gap-2'
          disabled={disabled}
          onClick={() => onFinish(amount, selectedEntitlement ?? '', spot)}
        >
          <div>{loading ? 'Adding entitlement...' : 'Add entitlement'}</div>
          {loading && <Loader />}
        </button>
      </div>
    </Modal>
  );
}
