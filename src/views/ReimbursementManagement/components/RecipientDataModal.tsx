import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { useEffect, useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import Select from '../../../components/Select';
import { truncateAddress } from '../../../utils';
import { useAztec } from '../../../contexts/AztecContext';
import { ZImburseEscrowContract } from '../../../artifacts';
import { AztecAddress } from '@aztec/circuits.js';
import { toast } from 'react-toastify';
import Loader from '../../../components/Loader';
import { ENTITLEMENT_TITLES } from '../../../utils/constants';

type RecipientDataModalProps = {
  escrowContract: ZImburseEscrowContract | null;
  recipient: any;
} & Omit<ModalProps, 'children'>;

type Entitlement = {
  paidOut?: number;
  title: string;
  spot: boolean;
};

const TABS = ['Historical', 'Active'];

export default function RecipientDataModal({
  escrowContract,
  recipient,
  onClose,
  open,
}: RecipientDataModalProps): JSX.Element {
  const { account, registryAdmin } = useAztec();
  const [addingEntitlement, setAddingEntilement] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number>(-1);
  const [entitlements, setEntitlements] = useState<Array<Entitlement>>([]);
  const [fetchingEntitlements, setFetchingEntitlements] =
    useState<boolean>(true);
  const [selectedEntitlement, setSelectedEntitlement] = useState<
    string | undefined
  >(undefined);
  const [selectedTab] = useState<number>(1);

  const addEntitlement = async () => {
    if (!account || !escrowContract) return;
    setAddingEntilement(true);
    try {
      // harcode amount to 1,000,000 for now
      const amount = 1000000;

      // give participant entitlement
      await escrowContract.methods
        .give_recurring_entitlement(
          AztecAddress.fromString(recipient.address),
          amount,
          2
        )
        .send()
        .wait();
      toast.success(`Entitlement added for recipient: ${recipient.address}`);
    } catch (err) {
      toast.error('Error occurred adding entitlement');
      console.log('Error: ', err);
    } finally {
      setAddingEntilement(false);
    }
  };

  const deleteEntitlement = () => {
    setEntitlements((prev) => prev.filter((_, index) => index !== deleteId));
    setDeleteId(-1);
  };

  const fetchEntitlements = async () => {
    if (!account || !escrowContract) return;
    const entitlements = await escrowContract.methods
      .view_entitlements(
        0,
        AztecAddress.fromString(recipient.address),
        { _is_some: false, _value: AztecAddress.fromString(recipient.address) },
        { _is_some: false, _value: 0 },
        { _is_some: false, _value: false }
      )
      .simulate();

    const { len, storage } = entitlements[0];

    const formattedEntitlements = storage
      .slice(0, Number(len))
      .map((entitlement: any) => ({
        title: ENTITLEMENT_TITLES[entitlement.verifier_id as number],
      }));
    setEntitlements(formattedEntitlements);
    setFetchingEntitlements(false);
  };

  useEffect(() => {
    (async () => {
      if (!recipient || !open) return;
      await fetchEntitlements();
    })();
  }, [open, recipient]);

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
              <button
                className='bg-zimburseBlue mb-4'
                onClick={() => addEntitlement()}
              >
                Add entitlement
              </button>
              <Select
                onChange={setSelectedEntitlement}
                placeholder='Select entitlement'
                selected={selectedEntitlement}
                options={['Linode', 'United']}
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
              {!!entitlements.length ? (
                entitlements.map((entitlement, index) => (
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
                        onClick={() => setDeleteId(index)}
                      >
                        <X size={16} />
                      </div>
                      {entitlement.paidOut && <div>Paid out: TODO</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className='flex gap-4 h-[350px] items-center justify-center text-xl'>
                  {fetchingEntitlements
                    ? 'Fethcing entitlements...'
                    : 'No Entitlements'}
                  {fetchingEntitlements && <Loader size={24} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        message={
          deleteId >= 0
            ? `Are you sure you want to nullify ${entitlements[deleteId].title}?`
            : ''
        }
        onClose={() => setDeleteId(-1)}
        onFinish={deleteEntitlement}
        open={deleteId >= 0}
      />
    </Modal>
  );
}
