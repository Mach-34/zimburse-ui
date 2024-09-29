import Modal, { ModalProps } from '../../../components/Modal';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import toggle from '../../../assets/toggle.svg';
import { useEffect, useMemo, useState } from 'react';
import Select from '../../../components/Select';
import Calendar from 'react-calendar';

type AddPolicyModalProps = Omit<ModalProps, 'children'>;

const POLICIES = ['Recurring', 'Spot'];
const VERIFIER_OPTIONS = ['Linode Receipt', 'Uber receipt'];

export default function AddPolicyModal({
  onClose,
  open,
}: AddPolicyModalProps): JSX.Element {
  const [claimableDate, setClaimableDate] = useState<any>(new Date());
  const [destination, setDestination] = useState<string>('');
  const [displayPolicy, setDisplayPolicy] = useState<string>(POLICIES[0]);
  const [emailVerifier, setEmailVerifier] = useState<string | undefined>(
    undefined
  );
  const [origin, setOrigin] = useState('');
  const [policyName, setPolicyName] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [usdc, setUsdc] = useState(0);

  const isRecurring = useMemo(() => {
    return displayPolicy === 'Recurring';
  }, [displayPolicy]);

  useEffect(() => {
    setShowCalendar(false);
  }, [open]);

  return (
    <Modal height={95} onClose={onClose} open={open} width={95}>
      <div className='flex justify-between'>
        <div className='text-2xl'>New Reimbursement Policy</div>
        <X cursor='pointer' onClick={() => onClose()} size={24} />
      </div>
      <div className='flex flex-col justify-between h-[95%]'>
        <div>
          <div className='flex justify-center mt-6'>
            {POLICIES.map((policy) => (
              <div
                className='cursor-pointer py-1 text-center w-60'
                onClick={() => setDisplayPolicy(policy)}
                style={{
                  backgroundColor:
                    policy === displayPolicy ? '#91FF8E' : '#D9D9D9',
                }}
              >
                {policy}
              </div>
            ))}
          </div>
          <div
            className='flex gap-8 items-center justify-center mt-10 text-xl'
            style={{ flexDirection: isRecurring ? 'column' : 'row' }}
          >
            <div className='flex gap-2 items-center'>
              <div>Policy name: </div>
              <input
                className='bg-zimburseGray'
                onChange={(e) => setPolicyName(e.target.value)}
                value={policyName}
              />
            </div>
            <div className='flex gap-2 items-center'>
              <div>Email verifier: </div>
              <Select
                onChange={setEmailVerifier}
                options={VERIFIER_OPTIONS}
                placeholder='Select verifier'
                selected={emailVerifier}
                style={{ width: '250px' }}
              />
            </div>
          </div>
          {!isRecurring && (
            <div className='flex gap-2 justify-center mt-10 text-xl'>
              <div>Claimmable dates: </div>
              <div
                className='bg-zimburseGray cursor-pointer flex justify-end overflow-visible p-1 relative w-64'
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <CalendarIcon
                  className='bg-[#939393] p-0.5'
                  color='white'
                  size={20}
                />
                <div className='absolute left-0 top-[calc(100%+10px)] w-[400px]'>
                  {showCalendar && (
                    <Calendar
                      className=''
                      onChange={setClaimableDate}
                      value={claimableDate}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className='flex items-end text-lg'>
          <div className='w-[40%]'>
            {isRecurring ? (
              <div />
            ) : (
              <>
                <div className='flex gap-4'>
                  <img alt='Toggle' src={toggle} />
                  <div>Two-Way</div>
                </div>
                <div className='flex gap-10 justify-between mt-4'>
                  <div>Origin: </div>
                  <input
                    className='bg-zimburseGray w-80'
                    onChange={(e) => setOrigin(e.target.value)}
                    value={origin}
                  />
                </div>
                <div className='flex gap-10 justify-between mt-4'>
                  <div>Destination: </div>
                  <input
                    className='bg-zimburseGray w-80'
                    onChange={(e) => setDestination(e.target.value)}
                    value={destination}
                  />
                </div>
              </>
            )}
          </div>
          <div className='flex justify-end w-[60%]'>
            <div className='flex flex-col items-center'>
              <div className='text-xl'>Maximum</div>
              <input
                className='bg-zimburseGray mt-2 text-center'
                onChange={(e) => setUsdc(Number(e.target.value))}
                value={usdc}
              />
              <button className='bg-zimburseBlue mt-4'>Add Policy</button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
