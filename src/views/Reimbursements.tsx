import { useState } from 'react';
import google from '../assets/google.svg';
import { Upload } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';

const hasEscrows = true;

type Reimbursement = {
  acceptedDates: string;
  amt: string;
  emailType: string;
  from: string;
  id: number;
  org: string;
  title: string;
  to: string;
  twoWay: string;
};

const REIMBURSEMENTS: Array<Reimbursement> = [
  {
    id: 1,
    acceptedDates: 'Accepted Dates: 9/1/2024-9/1/2024',
    amt: '$xxx.xx',
    emailType: 'Uber Rceipt',
    from: 'anywhere',
    org: 'Ethereum Foundation',
    title: 'AWS Hosting',
    to: '123 Main St, Denver, CO 80223',
    twoWay: 'yes',
  },
  {
    id: 2,
    acceptedDates: 'Accepted Dates: 9/1/2024-9/1/2024',
    amt: '$xxx.xx',
    emailType: 'AWS Receipt',
    from: 'anywhere',
    org: '  Aztec Protocol',
    title: 'EthDenver Grantee Dinner',
    to: '123 Main St, Denver, CO 80223',
    twoWay: 'no',
  },
];

export default function ReimbursementsView(): JSX.Element {
  const [emailFile] = useState<boolean>(true);
  const [selectedReimbursement, setSelectedReimbursement] =
    useState<Reimbursement | null>(null);

  return (
    <AppLayout>
      <div className='text-center text-3xl'>Your Z-Imburse Escrows</div>
      {hasEscrows ? (
        <>
          <div className='flex flex-1 gap-16 min-h-0 mt-16 w-full'>
            <div className='flex flex-col w-[25%]'>
              <div className='text-xl'>Claimable Reimbursements</div>
              <div className='bg-zimburseGray flex-1 mt-4 overflow-y-auto px-4 py-6'>
                {REIMBURSEMENTS.map((reimbursement) => (
                  <div
                    className='bg-white cursor-pointer mb-4 p-4'
                    key={reimbursement.id}
                    onClick={() => setSelectedReimbursement(reimbursement)}
                    style={{
                      border:
                        selectedReimbursement?.id === reimbursement.id
                          ? '4px solid #00A3FF'
                          : '4px solid transparent',
                    }}
                  >
                    <div>{reimbursement.title}</div>
                    <div className='flex justify-between mt-2 text-sm'>
                      <div>{reimbursement.org}</div>
                      <div>{reimbursement.amt}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div
              className='bg-zimburseGray flex flex-col p-4 w-[75%]'
              style={{
                alignItems: selectedReimbursement ? 'flex-start' : 'center',
                justifyContent: selectedReimbursement
                  ? 'space-between'
                  : 'center',
              }}
            >
              {selectedReimbursement ? (
                <>
                  <div>
                    <div className='mb-6 text-xl'>
                      {selectedReimbursement.title}
                    </div>
                    {emailFile ? (
                      <>
                        <div className='text-lg'>
                          Email nullifier: xxxxxxxxxxxxxxxxxxxxxxx
                        </div>
                        <div className='text-lg'>Claimed amount: $XX.XX</div>
                        <div className='text-lg'>Receipt Date: 9/1/2024</div>
                        <div className='text-lg'>
                          From: 234 Second St, Denver, CO 80223
                        </div>
                        <div className='text-lg'>
                          To: 123 Main St, Denver, CO 80223
                        </div>
                      </>
                    ) : (
                      <>
                        <div className='text-lg'>
                          Max Claimmable: {selectedReimbursement.amt}
                        </div>
                        <div className='text-lg'>
                          Accepted Dates: {selectedReimbursement.acceptedDates}
                        </div>
                        <div className='text-lg'>
                          Two-way: {selectedReimbursement.twoWay}
                        </div>
                        <div className='text-lg'>
                          From: {selectedReimbursement.from}
                        </div>
                        <div className='text-lg'>
                          Email type: {selectedReimbursement.emailType}
                        </div>
                      </>
                    )}
                  </div>
                  <div className='flex flex-col items-center justify-center w-full'>
                    {emailFile ? (
                      <button className='bg-[#89B8FF] w-3/5'>
                        Submit Claim
                      </button>
                    ) : (
                      <>
                        <button className='bg-[#89B8FF] flex items-center justify-between w-3/5'>
                          <img alt='Google' src={google} />
                          <div>Import from Gmail</div>
                          <div />
                        </button>
                        <button className='bg-[#89B8FF] flex justify-between mt-8 w-3/5'>
                          <Upload />
                          <div>Upload .eml</div>
                          <div />
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className='text-lg'>
                  Click on a reimbursement to start the claim process
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className='text-4xl'>
            You don’t have any claimable reimbursements now
          </div>
          <div className='max-w-[600px] text-2xl text-center'>
            If you believe this is a mistake, tell your counterparty to set a
            reimbursement entitlement for your address.
          </div>
          <div className='max-w-[600px] text-center'>
            If you’ve claimed all entitlements you’re currently eligible for,
            you’ll see new reimbursement entitlements as they become active.
          </div>
        </>
      )}
    </AppLayout>
  );
}
