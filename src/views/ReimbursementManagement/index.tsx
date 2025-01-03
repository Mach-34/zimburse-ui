import { useEffect, useState } from 'react';
import AddPolicyModal from './components/AddPolicyModal';
import deposit from '../../assets/deposit.svg';
import Policy from './components/Policy';
import TransactionHistoryModal from './components/TransactionHistoryModal';
import DepositModal from './components/DepositModal';
import AddRecipientModal from './components/AddRecipientModal';
import RecipientDataModal from './components/RecipientDataModal';
import AppLayout from '../../layouts/AppLayout';
import { toast } from 'react-toastify';
import { useAztec } from '../../contexts/AztecContext';
import { useNavigate, useParams } from 'react-router-dom';
import { AztecAddress } from '@aztec/circuits.js';
import { formatUSDC, truncateAddress } from '../../utils';
import Loader from '../../components/Loader';
import useEscrowContract from '../../hooks/useEscrowContract';
import useRegistryContract from '../../hooks/useRegistryContract';
import { ArrowLeft } from 'lucide-react';
import PaymentChart from "../../components/PaymentChart";

const POLICIES = [
  {
    activeY: 'Active: Y ($X,XXX)',
    paidOut: 'Paid Out: $ZZZ,ZZZ',
    title: 'Linode Hosting',
    type: 'Recurring',
  },
  {
    activeY: 'Active: Y ($X,XXX)',
    from: 'From: anywhere',
    limit: 'Limit: $XX.XX',
    paidOut: 'Paid Out: $ZZZ,ZZZ',
    title: 'United Flight Receipt',
    to: 'To: 123 Main St, Denver, CO 80223',
    twoWay: 'Two-way: Yes',
    type: 'Spot',
  },
];

export type EscrowData = {
  activeMonthly: bigint;
  activeSpot: bigint;
  escrowed: bigint;
  title: string;
};

type Recipient = {
  address: string;
  name: string;
};

const { VITE_APP_ESCROW_REGISTRY_CONTRACT: ESCROW_REGISTRY_CONTRACT } =
  import.meta.env;

export default function ReimbursementManagementView(): JSX.Element {
  const { id: escrowAddress } = useParams();
  const { account, registryAdmin, tokenContract, viewOnlyAccount } = useAztec();
  const escrowContract = useEscrowContract(escrowAddress!);
  const navigate = useNavigate();
  const registryContract = useRegistryContract(ESCROW_REGISTRY_CONTRACT);

  const [addingRecipient, setAddingRecipient] = useState<boolean>(false);
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  const [recipients, setRecipients] = useState<Array<Recipient>>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
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

      setRecipients((prev) => [...prev, { address, name: name }]);
      toast.success('Added recipient to escrow!');
    } catch (err) {
      toast.error('Error occurred adding recipient.');
      console.log('Error: ', err);
    } finally {
      setAddingRecipient(false);
      setShowAddRecipientModal(false);
    }
  };

  const fetchEscrowData = async (): Promise<EscrowData | undefined> => {
    if (!account || !escrowContract || !tokenContract || !viewOnlyAccount)
      return;
    const titleBytes = await escrowContract
      .withWallet(viewOnlyAccount)
      .methods.get_title()
      .simulate();

    const balance = await tokenContract
      .withWallet(viewOnlyAccount)
      .methods.balance_of_public(escrowContract.address)
      .simulate();

    const title = Buffer.from(new Uint8Array(titleBytes.map(Number))).toString(
      'utf8'
    );

    // fetch spot entitlements
    // const spotEntitlements = await escrowContract.methods
    //   .view_entitlements(
    //     0,
    //     account.getAddress(),
    //     { _is_some: false, _value: AztecAddress.ZERO },
    //     { _is_some: false, _value: 0 },
    //     { _is_some: true, _value: true }
    //   )
    //   .simulate();

    // console.log('Spot entitlements: ', spotEntitlements);

    // fetch recurring entitlement
    // const recurringEntitlements = await escrowContract.methods
    //   .view_entitlements(
    //     0,
    //     account.getAddress(),
    //     { _is_some: false, _value: AztecAddress.ZERO },
    //     { _is_some: false, _value: 0 },
    //     { _is_some: true, _value: false }
    //   )
    //   .simulate();
    return {
      activeMonthly: 0n,
      activeSpot: 0n,
      escrowed: balance,
      title,
    };
  };

  const fetchEscrowInfo = async () => {
    if (
      !account ||
      !escrowContract ||
      !registryAdmin ||
      !registryContract ||
      !tokenContract ||
      !viewOnlyAccount
    )
      return;

    const escrowData = await fetchEscrowData();
    setEscrowData(escrowData!);

    const participants = await fetchParticipants();

    setRecipients(participants);
  };

  const fetchParticipants = async () => {
    if (!escrowContract || !registryAdmin || !registryContract) return;
    const participants = await registryContract
      .withWallet(registryAdmin)
      .methods.get_participants(escrowContract.address, 0)
      .simulate();

    // const entitlements =

    const formattedParticipants = participants[0].storage
      .filter(
        (participant: any) =>
          participant.address.toString() !== AztecAddress.ZERO.toString()
      )
      .map((participant: any) => {
        let name = participant.name[0].toString();
        if (participant.name[1] !== 0n) {
          name.concat(participant.name[1]);
        }
        name = Buffer.from(BigInt(name).toString(16), 'hex').toString('utf8');
        return {
          address: participant.address.toString(),
          name,
        };
      });
    return formattedParticipants;
  };

  useEffect(() => {
    (async () => {
      await fetchEscrowInfo();
    })();
  }, [
    account,
    escrowContract,
    registryContract,
    tokenContract,
    viewOnlyAccount,
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
                  {formatUSDC(escrowData.activeMonthly)}
                </div>
                <div className='text-lg'>
                  Active Spot Entitlements: $
                  {formatUSDC(escrowData.activeSpot)}
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
                  {!!recipients.length ? (
                    recipients.map((recipient) => (
                      <div
                        className='bg-white cursor-pointer flex justify-between mt-2 px-2 py-1'
                        key={recipient.address}
                        onClick={() => setSelectedRecipient(recipient)}
                      >
                        <div>
                          <div className='text-xl'>{recipient.name}</div>
                          <div>{truncateAddress(recipient.address, 7, 7)}</div>
                        </div>
                        <div className='flex flex-col gap-2 justify-between'>
                          <div className='h-6' />
                          <div>Total Claimed: $XX</div>
                          <div>Active Policies: X</div>
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
          activeMonthly={escrowData?.activeMonthly ?? 0n}
          activeSpot={escrowData?.activeSpot ?? 0n}
          escrowAddress={escrowAddress ?? ''}
          escrowBalance={escrowData?.escrowed ?? 0n}
          onClose={() => setShowDepositModal(false)}
          open={showDepositModal}
          setEscrowData={setEscrowData}
        />
        <RecipientDataModal
          escrowContract={escrowContract}
          onClose={() => setSelectedRecipient(null)}
          open={!!selectedRecipient}
          recipient={selectedRecipient ?? {}}
        />
        <TransactionHistoryModal
          onClose={() => setShowTxModal(false)}
          open={showTxModal}
        />
      </div>
    </AppLayout>
  );
}
