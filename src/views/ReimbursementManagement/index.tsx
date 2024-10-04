import { useState } from 'react';
import AddPolicyModal from './components/AddPolicyModal';
import deposit from '../../assets/deposit.svg';
import Policy from './components/Policy';
import TransactionHistoryModal from './components/TransactionHistoryModal';
import DepositModal from './components/DepositModal';
import AddRecipientModal from './components/AddRecipientModal';
import RecipientDataModal from './components/RecipientDataModal';
import AppLayout from '../../layouts/AppLayout';

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

const DUMMY_RECIPIENT = {
  activePolicies: 'Active Policies: X',
  address: '0x....................',
  name: 'Name',
  totalClaimed: 'Total Claimed:  $XX',
};

const RECIPIENTS = new Array(5).fill(DUMMY_RECIPIENT);

export default function ReimbursementManagementView(): JSX.Element {
  const [recipients, setRecipients] = useState<Array<any>>(RECIPIENTS);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);
  const [showAddRecipientModal, setShowAddRecipientModal] =
    useState<boolean>(false);
  const [showTxModal, setShowTxModal] = useState<boolean>(false);

  const addRecipient = (address: string, name: string) => {
    const recipient = {
      activePolicies: 'Active Policies: X',
      address,
      name,
      totalClaimed: 'Total Claimed:  $XX',
    };
    setRecipients((prev) => [...prev, recipient]);
    setShowAddRecipientModal(false);
  };

  return (
    <AppLayout>
      <div className='flex gap-16'>
        <div className='flex flex-col justify-between w-1/2'>
          <div>
            <div className='text-4xl'>Fake Group</div>
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
            <div className='text-lg'>Active Spot Entitlements: $xx,xxx.xx</div>
          </div>
          <div className='basis-7/12 bg-zimburseGray flex flex-col items-end min-h-0 p-4'>
            <button
              className='bg-zimburseBlue ml-auto px-2 py-1'
              onClick={() => setShowPolicyModal(true)}
            >
              Add Policy
            </button>
            <div className='mt-4 overflow-y-auto w-full'>
              {[...POLICIES, ...POLICIES, ...POLICIES].map((policy, index) => (
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
              {recipients.map((recipient) => (
                <div
                  className='bg-white cursor-pointer flex justify-between mt-2 px-2 py-1'
                  onClick={() => setSelectedRecipient(recipient)}
                >
                  <div>
                    <div className='text-xl'>{recipient.name}</div>
                    <div>{recipient.address}</div>
                  </div>
                  <div className='flex flex-col gap-2 justify-between'>
                    <div className='h-6' />
                    <div>{recipient.totalClaimed}</div>
                    <div>{recipient.activePolicies}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <AddPolicyModal
          onClose={() => setShowPolicyModal(false)}
          open={showPolicyModal}
        />
        <AddRecipientModal
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
