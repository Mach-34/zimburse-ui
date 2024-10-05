import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { useEffect, useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import Select from '../../../components/Select';
import { truncateAddress } from '../../../utils';

type RecipientDataModalProps = { recipient: any } & Omit<
  ModalProps,
  'children'
>;

const DUMMY_REIMBURSEMENT = [
  { paidOut: 'Paid Out: $ZZZ,ZZZ', title: 'Linode Hosting', type: 'Recurring' },
  { title: 'EthDenver Grantee Dinner', type: 'Spot' },
];

const ENTITLEMENTS = [
  'Entitlement 1',
  'Entitlement 2',
  'Entitlement 3',
  'Entitlement 4',
  'Entitlement 5',
  'Entitlement 6',
];

const REIMBURSEMENTS = new Array(5).fill(DUMMY_REIMBURSEMENT).flat();

const TABS = ['Historical', 'Active'];

export default function RecipientDataModal({
  recipient,
  onClose,
  open,
}: RecipientDataModalProps): JSX.Element {
  const [deleteId, setDeleteId] = useState<number>(-1);
  const [reimbursements, setReimbursements] =
    useState<Array<any>>(REIMBURSEMENTS);
  const [selectedEntitlement, setSelectedEntitlement] = useState<
    string | undefined
  >(undefined);
  const [selectedTab] = useState<number>(1);

  const deleteReimbursement = () => {
    setReimbursements((prev) => prev.filter((_, index) => index !== deleteId));
    setDeleteId(-1);
  };

  useEffect(() => {
    setReimbursements(REIMBURSEMENTS);
  }, [open]);

  return (
    <Modal height={90} onClose={onClose} open={open} width={90}>
      <div className='flex flex-col h-full pb-10'>
        <X className='ml-auto' cursor='pointer' onClick={() => onClose()} />
        <div className='flex gap-10 h-[90%] items-start mt-8'>
          <div className='flex flex-col h-full justify-between w-1/2'>
            <div>
              <div className='text-4xl'>{recipient.name}</div>
              <div className='text-xl'>
                {truncateAddress(recipient.address ?? '', 7, 7)}
              </div>
              <div className='mt-16 text-2xl'>Total reimbursed: $xx,xxx.xx</div>
            </div>
            <div className='flex flex-col items-center'>
              <button className='bg-zimburseBlue mb-4'>Add entitlement</button>
              <Select
                onChange={setSelectedEntitlement}
                placeholder='Select entitlement'
                selected={selectedEntitlement}
                options={ENTITLEMENTS}
              />
            </div>
          </div>
          <div className='bg-zimburseGray flex flex-col h-full min-h-0 p-4 w-1/2'>
            <div className='flex'>
              {TABS.map((tab, index) => (
                <div
                  className='cursor-pointer py-2 text-center w-1/2'
                  key={index}
                  style={{
                    backgroundColor:
                      index === selectedTab ? '#91FF8E' : '#969494',
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
            <div className='mt-4 overflow-y-auto'>
              {reimbursements.map((reimbursement, index) => (
                <div
                  className='bg-white flex items-start justify-between mb-6 p-2'
                  key={index}
                >
                  <div>
                    <div className='text-xl'>{reimbursement.title}</div>
                    <div className='text-xs'>{reimbursement.type}</div>
                  </div>
                  <div className='flex flex-col items-end'>
                    <div
                      className='bg-[#FF0000] cursor-pointer flex items-center p-0'
                      onClick={() => setDeleteId(index)}
                    >
                      <X size={16} />
                    </div>
                    <div>{reimbursement.paidOut}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        message={
          deleteId >= 0
            ? `Are you sure you want to delete ${reimbursements[deleteId].title}?`
            : ''
        }
        onClose={() => setDeleteId(-1)}
        onFinish={deleteReimbursement}
        open={deleteId >= 0}
      />
    </Modal>
  );
}
