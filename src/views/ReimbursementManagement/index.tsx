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
import { ZImburseEscrowContract } from '../../artifacts';
import { useAztec } from '../../contexts/AztecContext';
import { useParams } from 'react-router-dom';
import { AztecAddress } from '@aztec/circuits.js';
import { truncateAddress } from '../../utils';
import Loader from '../../components/Loader';

const POLICIES = [
  {
    activeY: 'Active: Y ($X,XXX)',
    paidOut: 'Paid Out: $ZZZ,ZZZ',
    title: 'AWS Hosting',
    type: 'Recurring',
  },
  {
    activeY: 'Active: Y ($X,XXX)',
    from: 'From: anywhere',
    limit: 'Limit: $XX.XX',
    paidOut: 'Paid Out: $ZZZ,ZZZ',
    title: 'EthDenver Grantee Dinner',
    to: 'To: 123 Main St, Denver, CO 80223',
    twoWay: 'Two-way: Yes',
    type: 'Spot (November 11 - November 11)',
  },
];

type Recipient = {
  address: string;
  name: string;
};

export default function ReimbursementManagementView(): JSX.Element {
  const { id: escrowAddress } = useParams();
  const { account, viewOnlyAccount } = useAztec();

  const [addingRecipient, setAddingRecipient] = useState<boolean>(false);
  const [escrowData, setEscrowData] = useState<any>({});
  const [fetchingEscrow, setFetchingEscrow] = useState<boolean>(true);
  const [recipients, setRecipients] = useState<Array<Recipient>>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);
  const [showAddRecipientModal, setShowAddRecipientModal] =
    useState<boolean>(false);
  const [showTxModal, setShowTxModal] = useState<boolean>(false);

  const addRecipient = async (
    address: string,
    amount: number,
    _name: string
  ) => {
    if (!account || !escrowAddress) return;
    try {
      setAddingRecipient(true);
      const escrowContract = await ZImburseEscrowContract.at(
        AztecAddress.fromString(escrowAddress),
        account
      );
      await escrowContract.methods
        .give_recurring_entitlement(AztecAddress.fromString(address), amount, 2)
        .send()
        .wait();
      setRecipients((prev) => [...prev, { address, name: 'TODO' }]);
      toast.success('Added recipient to escrow!');
    } catch {
      toast.error('Error occurred adding recipient.');
    } finally {
      setAddingRecipient(false);
      setShowAddRecipientModal(false);
    }
  };

  const fetchEscrowInfo = async () => {
    if (!account || !escrowAddress || !viewOnlyAccount) return;
    const escrowContract = await ZImburseEscrowContract.at(
      AztecAddress.fromString(escrowAddress),
      account
    );

    const titleBytes = await escrowContract
      .withWallet(viewOnlyAccount)
      .methods.get_title()
      .simulate();
    const title = Buffer.from(new Uint8Array(titleBytes.map(Number))).toString(
      'utf8'
    );
    setEscrowData({ title });

    // fetch escrow recipients
    // NOTE: Only fetches linode for now while only verifier is Linode contract level
    const recipients = await escrowContract.methods
      .view_entitlements(
        0,
        AztecAddress.fromString(
          '0x0e31aeec96c8fab6541c47a04d3b9be16d38e6eb620c6dceeeb7903325217dd8'
        ),
        { _is_some: false, _value: AztecAddress.ZERO },
        { _is_some: false, _value: 0 },
        { _is_some: false, _value: false }
      )
      .simulate();
    console.log('Recipients: ', recipients);
    setFetchingEscrow(false);
  };

  useEffect(() => {
    (async () => {
      await fetchEscrowInfo();
    })();
  }, [account, escrowAddress]);

  return (
    <AppLayout>
      <div className='flex gap-16 h-[80vh]'>
        {fetchingEscrow ? (
          <>
            <div className='flex flex-col gap-4 items-center justify-center w-full'>
              <div className='text-2xl'>Fetching Escrow Info</div>
              <Loader size={28} />
            </div>
          </>
        ) : (
          <>
            <div className='flex flex-col justify-between w-1/2'>
              <div>
                <div className='text-4xl'>{escrowData.title}</div>
                <div className='flex gap-10 items-center mt-4'>
                  <div className='text-lg'>Escrow Balance: $XXX,XXX</div>
                  <button
                    className='bg-zimburseWalle flex gap-2 items-center px-2 py-1'
                    onClick={() => setShowDepositModal(true)}
                  >
                    <img alt='Deposit' src={deposit} />
                    <div>Deposit</div>
                  </button>
                </div>
                <div className='text-lg'>
                  Active Monthly Entitlements: $xx,xxx.xx
                </div>
                <div className='text-lg'>
                  Active Spot Entitlements: $xx,xxx.xx
                </div>
              </div>
              <div className='basis-7/12 bg-zimburseGray flex flex-col items-end min-h-0 p-4'>
                <button
                  className='bg-zimburseBlue ml-auto px-2 py-1'
                  onClick={() => setShowPolicyModal(true)}
                >
                  Add Policy
                </button>
                <div className='mt-4 overflow-y-auto w-full'>
                  {[...POLICIES, ...POLICIES, ...POLICIES].map(
                    (policy, index) => (
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
                    )
                  )}
                </div>
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
          onClose={() => setShowDepositModal(false)}
          open={showDepositModal}
        />
        <RecipientDataModal
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
