import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { formatUSDC, truncateAddress } from '../../../utils';
import { toast } from 'react-toastify';

import AddEntitlementModal from './AddEntitlementModal';

type RecipientDataModalProps = {
  onAddEntitlement: (
    amount: string,
    verifier: string,
    spot: boolean,
    dateRange?: Date[],
    destination?: string
  ) => Promise<void>;
  onNullify: (nullifyIndex: number) => Promise<void>;
  recipient: any;
} & Omit<ModalProps, 'children'>;

const TABS = ['Historical', 'Active'];

export default function RecipientDataModal({
  recipient,
  onAddEntitlement,
  onClose,
  onNullify,
  open,
}: RecipientDataModalProps): JSX.Element {
  const [addingEntitlement, setAddingEntilement] = useState<boolean>(false);
  const [nullifyIndex, setNullifyIndex] = useState<number>(-1);
  const [nullifying, setNullifying] = useState<boolean>(false);
  const [selectedTab] = useState<number>(1);
  const [showEntitlementModal, setShowEntitlementModal] =
    useState<boolean>(false);

  const addEntitlement = async (
    amount: string,
    verifierId: string,
    spot: boolean,
    dateRange?: Date[],
    destination?: string
  ) => {
    setAddingEntilement(true);
    try {
      await onAddEntitlement(amount, verifierId, spot, dateRange, destination);
      toast.success(
        `${spot ? 'Spot' : 'Recurring'} entitlement added for recipient: ${
          recipient.address
        }`
      );
    } catch (err) {
      toast.error('Error occurred adding entitlement');
      console.log('Error: ', err);
    } finally {
      setAddingEntilement(false);
      setShowEntitlementModal(false);
    }
  };

  const nullifyEntitlement = async () => {
    setNullifying(true);
    await onNullify(nullifyIndex);
    setNullifyIndex(-1);
    setNullifying(false);
  };

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
              <div className='mt-16 text-2xl'>
                Total reimbursed: ${formatUSDC(recipient?.totalClaimed ?? 0n)}
              </div>
            </div>
            <div className='flex flex-col items-center'>
              <button
                className='bg-zimburseBlue mb-4'
                onClick={() => setShowEntitlementModal(true)}
              >
                Add entitlement
              </button>
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
              {recipient.policies?.active.length > 0 ? (
                recipient.policies.active.map(
                  (entitlement: any, index: number) => (
                    <div
                      className='bg-white flex items-start justify-between mb-6 p-2'
                      key={index}
                    >
                      <div>
                        <div className='text-xl'>{entitlement.title}</div>
                        <div className='text-xs'>
                          {entitlement.spot ? 'Spot' : 'Recurring'}
                        </div>
                      </div>
                      <div className='flex flex-col items-end'>
                        <div
                          className='bg-[#FF0000] cursor-pointer flex items-center p-0'
                          onClick={() => setNullifyIndex(index)}
                        >
                          <X size={16} />
                        </div>
                        <div>
                          Max amount: ${formatUSDC(entitlement.maxAmount ?? 0n)}
                        </div>
                        {/* {entitlement.paidOut !== undefined && <div>Paid out: ${formatUSDC(entitlement.paidOut ?? 0n)}</div>} */}
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className='flex gap-4 h-[350px] items-center justify-center text-xl'>
                  No Entitlements
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AddEntitlementModal
        loading={addingEntitlement}
        onClose={() => setShowEntitlementModal(false)}
        onFinish={(amount, verifier, spot, dateRange, destination) =>
          addEntitlement(amount, verifier, spot, dateRange, destination)
        }
        open={showEntitlementModal}
      />
      <ConfirmationModal
        loading={nullifying ? 'Nullifying...' : undefined}
        message={
          nullifyIndex >= 0
            ? `Are you sure you want to nullify ${
                recipient.policies.active[nullifyIndex]?.title ?? ''
              }?`
            : ''
        }
        onClose={() => setNullifyIndex(-1)}
        onFinish={nullifyEntitlement}
        open={nullifyIndex >= 0}
      />
    </Modal>
  );
}
