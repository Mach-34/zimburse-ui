import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';

type AddPolicyModalProps = Omit<ModalProps, 'children'>;

const DUMMY_TXS = [
  {
    date: 'Date: September 1, 2024',
    hash: 'Tx Hash: 0x0000000000000000000000000000',
    heading: 'Deposited $XXX,XXX',
    type: 'deposit',
  },
  {
    date: 'Date: September 1, 2024',
    hash: 'Tx Hash: 0x0000000000000000000000000000',
    heading: 'Reimbursed $XXX',
    recipientAddress: '0xabcdef01234567890000000000deadbeef',
    recipientName: 'Tony Stank',
    reimbursementDescription: 'EthDenver Grantee Dinner (Spot)',
    type: 'reimbursement',
  },
];

const TXS = [
  ...DUMMY_TXS,
  ...DUMMY_TXS,
  ...DUMMY_TXS,
  ...DUMMY_TXS,
  ...DUMMY_TXS,
  ...DUMMY_TXS,
];

export default function TransactionHistoryModal({
  onClose,
  open,
}: AddPolicyModalProps): JSX.Element {
  return (
    <Modal height={90} onClose={onClose} open={open} width={75}>
      <div className='flex flex-col h-full'>
        <X className='ml-auto' cursor='pointer' onClick={() => onClose()} />
        <div className='text-2xl'>Transaction History</div>
        <div className='flex-1 mt-8 overflow-y-auto'>
          {TXS.map((tx, index) => (
            <div
              className='bg-[#A8A6A6] flex h-[118px] justify-between mb-8 p-2'
              key={index}
            >
              <div className='flex flex-col h-full justify-between'>
                <div>
                  <div className='text-xl'>{tx.heading}</div>
                  <div className='text-sm'>{tx.date}</div>
                </div>
                <div className='text-sm'>{tx.hash}</div>
              </div>
              {tx.type === 'reimbursement' && (
                <div className='flex flex-col h-full justify-between text-right'>
                  <div>
                    <div className='text-sm'>{tx.recipientName}</div>
                    <div className='text-sm'>{tx.recipientAddress}</div>
                  </div>
                  <div className='text-sm'>{tx.reimbursementDescription}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
