import { useCallback, useEffect, useState } from 'react';
import AddPolicyModal from './components/AddPolicyModal';
import deposit from '../../assets/deposit.svg';
import TransactionHistoryModal from './components/TransactionHistoryModal';
import DepositModal from './components/DepositModal';
import AddRecipientModal from './components/AddRecipientModal';
import RecipientDataModal from './components/RecipientDataModal';
import AppLayout from '../../layouts/AppLayout';
import { toast } from 'react-toastify';
import { useAztec } from '../../contexts/AztecContext';
import { useNavigate, useParams } from 'react-router-dom';
import { AztecAddress } from '@aztec/aztec.js';
import {
  formatUSDC,
  fromU128,
  toUSDCDecimals,
  truncateAddress,
} from '../../utils';
import Loader from '../../components/Loader';
import useEscrowContract from '../../hooks/useEscrowContract';
import { ArrowLeft } from 'lucide-react';
import PaymentChart from '../../components/PaymentChart';
import { ZImburseEscrowContract } from '../../artifacts';
import {
  ENTITLEMENT_TITLES,
  EVENT_BLOCK_LIMIT,
  VERIFIERS,
} from '../../utils/constants';
type Participant = {
  address: string;
  name: string;
  policies: {
    active: any[];
    inactive: any[];
  };
  totalClaimed: bigint;
};

export type EscrowData = {
  activeRecurring: bigint;
  activeSpot: bigint;
  escrowed: bigint;
  title: string;
};

export default function ReimbursementManagementView(): JSX.Element {
  const { id: escrowAddress } = useParams();
  const { account, registryAdmin, registryContract, tokenContract } =
    useAztec();
  const escrowContract = useEscrowContract(escrowAddress!);
  const navigate = useNavigate();

  const [addingRecipient, setAddingRecipient] = useState<boolean>(false);
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  const [recipients, setRecipients] = useState<Array<Participant>>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<number>(-1);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);
  const [showAddRecipientModal, setShowAddRecipientModal] =
    useState<boolean>(false);
  const [showTxModal, setShowTxModal] = useState<boolean>(false);

  const addRecipient = async (address: string, name: string) => {
    if (!account || !escrowAddress || !registryAdmin || !registryContract)
      return;
    try {
      setAddingRecipient(true);

      await registryContract
        .withWallet(registryAdmin)
        .methods.check_and_register_participant(
          AztecAddress.fromString(address),
          name,
          AztecAddress.fromString(escrowAddress)
        )
        .send()
        .wait();

      setRecipients((prev) => [
        ...prev,
        {
          address,
          name: name,
          policies: { active: [], inactive: [] },
          totalClaimed: 0n,
        },
      ]);
      toast.success('Added recipient to escrow!');
    } catch (err) {
      toast.error('Error occurred adding recipient.');
      console.log('Error: ', err);
    } finally {
      setAddingRecipient(false);
      setShowAddRecipientModal(false);
    }
  };

  const calculateActiveEntitlementsTotal = (entitlements: any[]) => {
    return entitlements.reduce((acc: bigint, { max_value }: any) => {
      return (acc += fromU128(max_value));
    }, 0n);
  };

  const fetchEventData = useCallback(async () => {
    const { RecurringReimbursementClaimed, SpotReimbursementClaimed } =
      ZImburseEscrowContract.events;
    const recurringPromise = account!.getEncryptedEvents(
      RecurringReimbursementClaimed,
      1,
      EVENT_BLOCK_LIMIT
    );
    const spotPromise = account!.getEncryptedEvents(
      SpotReimbursementClaimed,
      1,
      EVENT_BLOCK_LIMIT
    );

    const [recurringClaims, spotClaims] = await Promise.all([
      recurringPromise,
      spotPromise,
    ]);
    return { recurringClaims, spotClaims };
  }, [account]);

  const fetchEntitlements = useCallback(
    async (escrowContract: ZImburseEscrowContract) => {
      // fetch spot entitlements
      const spotPromise = await escrowContract.methods
        .view_entitlements(
          0,
          // @ts-ignore
          account.getAddress(),
          { _is_some: false, _value: AztecAddress.ZERO },
          { _is_some: false, _value: 0 },
          { _is_some: true, _value: true }
        )
        .simulate();

      // fetch recurring entitlement
      const recurringPromise = await escrowContract.methods
        .view_entitlements(
          0,
          // @ts-ignore
          account.getAddress(),
          { _is_some: false, _value: AztecAddress.ZERO },
          { _is_some: false, _value: 0 },
          { _is_some: true, _value: false }
        )
        .simulate();

      const [spot, recurring] = await Promise.all([
        spotPromise,
        recurringPromise,
      ]);

      return { spot, recurring };
    },
    [account]
  );

  const fetchEscrowData = useCallback(async () => {
    const titlePromise = escrowContract!.methods.get_title().simulate();

    const balancePromise = tokenContract!
      .withWallet(account!)
      // @ts-ignore
      .methods.balance_of_public(escrowContract.address)
      .simulate();

    const participantsPromise = registryContract!
      // @ts-ignore
      .withWallet(registryAdmin)
      .methods.get_participants(escrowContract!.address, 0)
      .simulate();

    const [titleBytes, balance, entitlements, events, participants] =
      await Promise.all([
        titlePromise,
        balancePromise,
        fetchEntitlements(escrowContract!),
        fetchEventData(),
        participantsPromise,
      ]);

    const title = Buffer.from(new Uint8Array(titleBytes.map(Number))).toString(
      'utf8'
    );

    const formattedParticipants = formatParticipants(
      participants[0].storage,
      entitlements,
      events
    );

    return {
      activeRecurring: calculateActiveEntitlementsTotal(
        entitlements.recurring[0].storage
      ),
      activeSpot: calculateActiveEntitlementsTotal(
        entitlements.spot[0].storage
      ),
      escrowed: balance,
      participants: formattedParticipants,
      title,
    };
  }, [
    account,
    escrowContract,
    fetchEntitlements,
    fetchEventData,
    registryAdmin,
    registryContract,
    tokenContract,
  ]);

  const formatParticipants = (
    participants: any[],
    entitlements: any,
    events: any
  ): Array<Participant> => {
    // init participant object
    const participantObj: any = {};
    participants.forEach((participant: any) => {
      if (participant.address !== 0n) {
        let name = participant.name[0].toString();
        if (participant.name[1] !== 0n) {
          name.concat(participant.name[1]);
        }
        name = Buffer.from(BigInt(name).toString(16), 'hex').toString('utf8');
        const address = AztecAddress.fromBigInt(participant.address).toString();
        participantObj[address] = {
          address,
          name,
          policies: {
            active: [],
            inactive: [],
          },
          totalClaimed: 0n,
        };
      }
    });

    // parse entitlements by participant
    const flattenedEntitlements = [
      ...entitlements.recurring[0].storage,
      ...entitlements.spot[0].storage,
    ];
    flattenedEntitlements.forEach((entitlement: any) => {
      if (entitlement.recipient !== 0n) {
        const recipient = AztecAddress.fromBigInt(
          entitlement.recipient
        ).toString();

        // format entitlement
        const entitlementData = {
          maxAmount: fromU128(entitlement.max_value),
          paidOut: entitlement.spot ? undefined : 0n, // TODO: Need to figure out if there is a way to link to specific entitlement note
          spot: entitlement.spot,
          title: ENTITLEMENT_TITLES[entitlement.verifier_id as number],
          verifierId: entitlement.verifier_id,
        };

        // TODO: Check for nullification and organize by historical / active
        participantObj[recipient].policies.active.push(entitlementData);
      }
    });

    // calculate total amount claimed by participant
    const flattenedEvents = [...events.recurringClaims, ...events.spotClaims];
    flattenedEvents.forEach((event: any) => {
      const claimant = AztecAddress.fromBigInt(event.claimant).toString();
      participantObj[claimant].totalClaimed += event.amount;
    });

    return Object.values(participantObj);
  };

  const addEntitlement = async (
    amount: string,
    verifier: string,
    spot: boolean,
    dateRange?: Date[],
    destination?: string
  ) => {
    if (!escrowContract || selectedRecipient < 0) return;
    const recipient = recipients[selectedRecipient];
    const amtDecimals = toUSDCDecimals(amount);
    if (spot || verifier === 'United') {
      // give participant entitlement
      await escrowContract.methods
        .give_spot_entitlement(
          AztecAddress.fromString(recipient.address),
          amtDecimals,
          VERIFIERS[verifier],
          BigInt(dateRange![0].getTime()) / 1000n,
          BigInt(dateRange![1].getTime()) / 1000n,
          `${
            destination ?? 'NON'
          }\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0`
        )
        .send()
        .wait();
    } else {
      // give participant entitlement
      await escrowContract.methods
        .give_recurring_entitlement(
          AztecAddress.fromString(recipient.address),
          amtDecimals,
          VERIFIERS[verifier]
        )
        .send()
        .wait();
    }

    // update active entitlements for recipient
    const copy = [...recipients];
    copy[selectedRecipient].policies.active.push({
      maxAmount: toUSDCDecimals(amount),
      paidOut: spot ? undefined : 0n,
      spot,
      title: ENTITLEMENT_TITLES[VERIFIERS[verifier]],
      verifierId: verifier,
    });
    setRecipients(copy);

    // update active entitlement total for escrow
    if (spot) {
      setEscrowData((prev) => ({
        ...prev!,
        activeSpot: prev!.activeSpot + amtDecimals,
      }));
    } else {
      setEscrowData((prev) => ({
        ...prev!,
        activeRecurring: prev!.activeRecurring + amtDecimals,
      }));
    }
  };

  const nullifyEntitlement = async (nullifyIndex: number) => {
    if (!account || !escrowContract || selectedRecipient < 0) return;
    try {
      // remove entitlement from participant list
      const copy = [...recipients];
      const nullified = copy[selectedRecipient].policies.active[nullifyIndex];

      // nullify on contract side
      await escrowContract.methods
        .revoke_entitlement(
          AztecAddress.fromString(copy[selectedRecipient].address),
          nullified.verifierId,
          nullified.spot
        )
        .send()
        .wait();

      copy[selectedRecipient].policies.active.splice(nullifyIndex, 1);

      setRecipients(copy);
      // update active entitlement total for escrow
      if (nullified.spot) {
        setEscrowData((prev) => ({
          ...prev!,
          activeSpot: prev!.activeSpot - nullified.maxAmount,
        }));
      } else {
        setEscrowData((prev) => ({
          ...prev!,
          activeRecurring: prev!.activeRecurring - nullified.maxAmount,
        }));
      }
      toast.success('Successfully nullified entitlement');
    } catch (err) {
      console.log('Error: ', err);
      toast.error('Error occurred nullifiying entitlement');
    }
  };

  useEffect(() => {
    (async () => {
      if (account && escrowContract && registryContract && tokenContract) {
        const { participants, ...rest } = await fetchEscrowData();
        setEscrowData(rest);
        setRecipients(participants);
      }
    })();
  }, [
    account,
    escrowContract,
    fetchEscrowData,
    registryContract,
    tokenContract,
  ]);

  return (
    <AppLayout>
      <div className='flex gap-16 h-[80vh]'>
        {!escrowData ? (
          <>
            <div className='flex gap-4 items-center justify-center w-full'>
              <div className='text-2xl'>Fetching Escrow Info</div>
              <Loader size={24} />
            </div>
          </>
        ) : (
          <>
            <div className='flex flex-col justify-between w-1/2'>
              <div>
                <div className='flex gap-4 items-center'>
                  <ArrowLeft
                    cursor='pointer'
                    onClick={() => navigate('/reimbursement/admin')}
                    size={24}
                  />
                  <div className='text-4xl'>{escrowData.title}</div>
                </div>
                <div className='flex gap-10 items-center mt-4'>
                  <div className='text-lg'>
                    Escrow Balance: ${formatUSDC(escrowData.escrowed)}
                  </div>
                  <button
                    className='bg-zimburseWalle flex gap-2 items-center px-2 py-1'
                    onClick={() => setShowDepositModal(true)}
                  >
                    <img alt='Deposit' src={deposit} />
                    <div>Deposit</div>
                  </button>
                </div>
                <div className='text-lg'>
                  Active Monthly Entitlements: $
                  {formatUSDC(escrowData.activeRecurring)}
                </div>
                <div className='text-lg'>
                  Active Spot Entitlements: ${formatUSDC(escrowData.activeSpot)}
                </div>
              </div>
              <div className='basis-7/12 bg-zimburseGray'>
                {/* <button
                  className='bg-zimburseBlue ml-auto px-2 py-1'
                  onClick={() => setShowPolicyModal(true)}
                >
                  Add Policy
                </button> */}
                {/* <div className='mt-4 overflow-y-auto w-full'>
                  {POLICIES.map((policy, index) => (
                    <Policy
                      activeY={policy.activeY}
                      from={policy.from}
                      key={index}
                      limit={policy.limit}
                      paidOut={policy.paidOut}
                      style={{ marginTop: '8px' }}
                      title={policy.title}
                      to={policy.to}
                      twoWay={policy.twoWay}
                      type={policy.type}
                    />
                  ))}
                </div> */}
                <PaymentChart />
              </div>
            </div>
            <div className='flex flex-col justify-between w-1/2'>
              <div className='flex gap-4 justify-end'>
                <button
                  className='bg-zimburseBlue'
                  onClick={() => setShowTxModal(true)}
                >
                  View Tx's
                </button>
              </div>
              <div className='basis-10/12 bg-zimburseGray flex flex-col items-end min-h-0 p-4'>
                <button
                  className='bg-zimburseBlue'
                  onClick={() => setShowAddRecipientModal(true)}
                >
                  Add Recipient
                </button>
                <div className='flex-1 mt-4 overflow-y-auto w-full'>
                  {recipients.length > 0 ? (
                    recipients.map((recipient, index) => (
                      <div
                        className='bg-white cursor-pointer flex justify-between mt-2 px-2 py-1'
                        key={recipient.address}
                        onClick={() => setSelectedRecipient(index)}
                      >
                        <div>
                          <div className='text-xl'>{recipient.name}</div>
                          <div>{truncateAddress(recipient.address, 7, 7)}</div>
                        </div>
                        <div className='flex flex-col gap-2 justify-between'>
                          <div className='h-6' />
                          <div>
                            Total Claimed: ${formatUSDC(recipient.totalClaimed)}
                          </div>
                          <div>
                            Active Policies: {recipient.policies.active.length}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className='flex h-full items-center justify-center'>
                      No current recipients
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        <AddPolicyModal
          onClose={() => setShowPolicyModal(false)}
          open={showPolicyModal}
        />
        <AddRecipientModal
          loading={addingRecipient}
          onClose={() => setShowAddRecipientModal(false)}
          onFinish={addRecipient}
          open={showAddRecipientModal}
        />
        <DepositModal
          activeRecurring={escrowData?.activeRecurring ?? 0n}
          activeSpot={escrowData?.activeSpot ?? 0n}
          escrowAddress={escrowAddress ?? ''}
          escrowBalance={escrowData?.escrowed ?? 0n}
          onClose={() => setShowDepositModal(false)}
          open={showDepositModal}
          setEscrowData={setEscrowData}
        />
        <RecipientDataModal
          onAddEntitlement={addEntitlement}
          onClose={() => setSelectedRecipient(-1)}
          onNullify={nullifyEntitlement}
          open={selectedRecipient >= 0}
          recipient={
            selectedRecipient >= 0 ? recipients[selectedRecipient] : {}
          }
        />
        <TransactionHistoryModal
          onClose={() => setShowTxModal(false)}
          open={showTxModal}
        />
      </div>
    </AppLayout>
  );
}
