import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { useEffect, useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { formatUSDC, fromU128, fromUSDCDecimals, truncateAddress } from '../../../utils';
import { useAztec } from '../../../contexts/AztecContext';
import { ZImburseEscrowContract } from '../../../artifacts';
import { AztecAddress } from '@aztec/circuits.js';
import { toast } from 'react-toastify';
import Loader from '../../../components/Loader';
import { ENTITLEMENT_TITLES } from '../../../utils/constants';
import { toUSDCDecimals } from "../../../utils";

import AddEntitlementModal from './AddEntitlementModal';

type RecipientDataModalProps = {
  escrowContract: ZImburseEscrowContract | null;
  recipient: any;
} & Omit<ModalProps, 'children'>;

type Entitlement = {
  maxAmount: bigint;
  paidOut?: bigint;
  title: string;
  spot: boolean;
};

const TABS = ['Historical', 'Active'];

export const VERIFIERS: {[key: string]: number} = {'Linode': 2, 'United': 3 };

export default function RecipientDataModal({
  escrowContract,
  recipient,
  onClose,
  open,
}: RecipientDataModalProps): JSX.Element {
  const { account } = useAztec();
  const [addingEntitlement, setAddingEntilement] = useState<boolean>(false);
  const [nullifyId, setNullifyId] = useState<number>(-1);
  const [entitlements, setEntitlements] = useState<Array<Entitlement>>([]);
  const [fetchingEntitlements, setFetchingEntitlements] =
    useState<boolean>(true);
  const [selectedTab] = useState<number>(1);
  const [showEntitlementModal, setShowEntitlementModal] =
    useState<boolean>(false);

  const addEntitlement = async (
    amount: string,
    verifier: string,
    spot: boolean,
    dateRange?: Date[],
    destination?: string
  ) => {
    if (!account || !escrowContract) return;
    setAddingEntilement(true);

    try {
      if(spot || verifier === 'United') {
        // give participant entitlement
        await escrowContract.methods
        .give_spot_entitlement(
          AztecAddress.fromString(recipient.address),
          toUSDCDecimals(amount),
          VERIFIERS[verifier],
          BigInt(dateRange![0].getTime()) / 1000n,
          BigInt(dateRange![1].getTime()) / 1000n,
          `${destination ?? 'NON'}\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0`
        )
        .send()
        .wait();
      } else {
        // give participant entitlement
        await escrowContract.methods
        .give_recurring_entitlement(
          AztecAddress.fromString(recipient.address),
          toUSDCDecimals(amount),
          VERIFIERS[verifier]
        )
        .send().wait();
      }
      setEntitlements((prev) => [
        ...prev,
        { maxAmount: toUSDCDecimals(amount), paidOut: undefined, spot, title: ENTITLEMENT_TITLES[VERIFIERS[verifier]] },
      ]);
      toast.success(`${spot ? 'Spot' : 'Recurring'} entitlement added for recipient: ${recipient.address}`);
    } catch (err) {
      toast.error('Error occurred adding entitlement');
      console.log('Error: ', err);
    } finally {
      setAddingEntilement(false);
      setShowEntitlementModal(false);
    }
  };

  const nullifyEntitlement = async () => {
    if (!escrowContract) return;

    await escrowContract.methods
      .revoke_entitlement(AztecAddress.fromString(recipient.address), 2, false)
      .send()
      .wait();

    setEntitlements((prev) => prev.filter((_, index) => index !== nullifyId));
    setNullifyId(-1);
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
        maxAmount: fromU128(entitlement.max_value),
        paidOut: entitlement.spot ? undefined : 0n,
        spot: entitlement.spot,
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
                        onClick={() => setNullifyId(index)}
                      >
                        <X size={16} />
                      </div>
                      <div>Max amount: ${formatUSDC(entitlement.maxAmount)}</div>
                      {entitlement.paidOut !== undefined && <div>Paid out: ${formatUSDC(entitlement.paidOut)}</div>}
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
      <AddEntitlementModal
        loading={addingEntitlement}
        onClose={() => setShowEntitlementModal(false)}
        onFinish={(amount, verifier, spot, dateRange, destination) => addEntitlement(amount, verifier, spot, dateRange, destination)}
        open={showEntitlementModal}
      />
      <ConfirmationModal
        message={
          nullifyId >= 0
            ? `Are you sure you want to nullify ${entitlements[nullifyId].title}?`
            : ''
        }
        onClose={() => setNullifyId(-1)}
        onFinish={nullifyEntitlement}
        open={nullifyId >= 0}
      />
    </Modal>
  );
}
