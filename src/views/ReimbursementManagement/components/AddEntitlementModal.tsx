import { Calendar as CalendarIcon, X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { useEffect, useMemo, useRef, useState } from 'react';
import Loader from '../../../components/Loader';
import Select from '../../../components/Select';
import { NUMBER_INPUT_REGEX, VERIFIERS } from '../../../utils/constants';
import Calendar from 'react-calendar';
import useOutsideAlerter from '../../../hooks/useOutsideAlerter';
import moment from 'moment';

type AddEntitlementModalProps = {
  loading: boolean;
  onFinish: (
    amount: string,
    verifier: string,
    spot: boolean,
    dateRange?: Date[],
    destination?: string
  ) => void;
} & Omit<ModalProps, 'children'>;

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function AddEntitlementModal({
  loading,
  onClose,
  onFinish,
  open,
}: AddEntitlementModalProps) {
  const calendarRef = useRef(null);
  const [amount, setAmount] = useState<string>('');
  const [dateRange, setDateRange] = useState<Value>([new Date(), new Date()]);
  const [destination, setDestination] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [spot, setSpot] = useState<boolean>(false);
  const [verifier, setVerifier] = useState<string | undefined>(undefined);

  const disabled = useMemo(() => {
    return Number(amount) <= 0 || !verifier;
  }, [amount, verifier]);

  const handleDepositInput = (val: string) => {
    if (NUMBER_INPUT_REGEX.test(val)) {
      setAmount(val);
    }
  };

  const isLinode = useMemo(() => {
    return verifier === 'Linode';
  }, [verifier]);

  useEffect(() => {
    setAmount('');
  }, [open]);

  useEffect(() => {
    setDestination('');
    setDateRange([new Date(), new Date()]);
  }, [spot]);

  useOutsideAlerter(calendarRef, () => setShowCalendar(false));

  return (
    <Modal height={85} onClose={onClose} open={open} width={60}>
      <X className='ml-auto' cursor='pointer' onClick={() => onClose()} />
      <div className='flex flex-col h-[85%] gap-2 items-center justify-between mt-4'>
        <div className='text-2xl'>Add Entitlement</div>
        <div className='text-center text-xl'>
          <div className='flex gap-10 items-center justify-center'>
            <div>
              <div className='mb-2'>Verifier Type</div>
              <Select
                onChange={setVerifier}
                placeholder='Select entitlement'
                selected={verifier}
                options={Object.keys(VERIFIERS)}
              />
            </div>
            {isLinode && (
              <div>
                <label className='mr-2'>Spot</label>
                <input
                  checked={spot}
                  onChange={() => setSpot(!spot)}
                  type='checkbox'
                />
              </div>
            )}
          </div>
          <div className='mt-4'>Amount</div>
          <input
            className='bg-zimburseGray my-2'
            onChange={(e) => handleDepositInput(e.target.value)}
            placeholder='Enter amount'
            value={amount}
          />
          {(spot || !isLinode) && (
            <>
              <div className='flex gap-2 justify-center'>
                <button
                  className='flex items-center gap-2 p-1 text-base text-sm'
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <div>Claimmable</div>
                  <CalendarIcon className='shrink-0' size={16} />
                </button>
                <div className='flex justify-between items-center overflow-visible p-1 relative w-full'>
                  <div className='flex justify-between w-full'>
                    <div className='bg-zimburseGray mr-8 p-1 text-sm'>
                      From: {moment((dateRange as Date[])[0]).format('l')}
                    </div>
                    <div className='bg-zimburseGray p-1 text-sm'>
                      To: {moment((dateRange as Date[])[1]).format('l')}
                    </div>
                  </div>
                  <div
                    className='absolute left-0 top-[calc(0% + 10px)]'
                    ref={calendarRef}
                  >
                    {showCalendar && (
                      <Calendar
                        onChange={setDateRange}
                        selectRange={true}
                        value={dateRange}
                      />
                    )}
                  </div>
                </div>
              </div>
              {!isLinode && (
                <div>
                  <div className='mt-4'>Destination</div>
                  <input
                    className='bg-zimburseGray mt-2'
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder='Enter destination'
                    value={destination}
                  />
                </div>
              )}
            </>
          )}
        </div>
        <button
          className='bg-zimburseBlue flex items-center gap-2'
          disabled={disabled}
          onClick={() =>
            onFinish(
              amount,
              verifier ?? '',
              spot || !isLinode,
              dateRange as Date[],
              destination
            )
          }
        >
          <div>{loading ? 'Adding entitlement...' : 'Add entitlement'}</div>
          {loading && <Loader />}
        </button>
      </div>
    </Modal>
  );
}
