import { Calendar as CalendarIcon, X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { useEffect, useMemo, useRef, useState } from 'react';
import Loader from '../../../components/Loader';
import Select from '../../../components/Select';
import { NUMBER_INPUT_REGEX } from "../../../utils/constants";
import { VERIFIERS } from "./RecipientDataModal";
import Calendar from "react-calendar";
import useOutsideAlerter from "../../../hooks/useOutsideAlerter";
import moment from 'moment';

type AddEntitlementModalProps = {
  loading: boolean;
  onFinish: (amount: string, verifier: string, spot: boolean, dateRange?: Date[], destination?: string) => void;
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
  const [verifier, setVerifier] = useState<
  string | undefined
>(undefined);

  const disabled = useMemo(() => {
    return Number(amount) <= 0 || !verifier;
  }, [amount, verifier]);

  const handleDepositInput = (val: string) => {
    if(NUMBER_INPUT_REGEX.test(val)) {
      setAmount(val)
    }
  }

  useEffect(() => {
    setAmount('');
  }, [open]);

  useEffect(() => {
    setDestination('');
    setDateRange([new Date(), new Date()])
  }, [spot]);

  useOutsideAlerter(calendarRef, () => setShowCalendar(false));

  return (
    <Modal height={85} onClose={onClose} open={open} width={60}>
      <X className='ml-auto' cursor='pointer' onClick={() => onClose()} />
      <div className='flex flex-col h-[75%] items-center justify-between mt-4'>
        <div className='text-2xl'>Add Entitlement</div>
        <div className='text-center text-xl'>
          <div className='my-2'>Verifier Type</div>
          <Select
            onChange={setVerifier}
            placeholder='Select entitlement'
            selected={verifier}
            options={Object.keys(VERIFIERS)}
          />
          <div className="mt-4">Amount</div>
          <input
            className='bg-zimburseGray my-2'
            onChange={(e) => handleDepositInput(e.target.value)}
            placeholder="Enter amount"
            value={amount}
          />
            <div className='mt-2'>
              <label className='mr-2'>Spot</label>
              <input
                checked={spot}
                onChange={() => setSpot(!spot)}
                type='checkbox'
              />
            </div>
          {spot && <>
               <div className='flex gap-2 justify-center mt-10 text-xl'>
              <div className="flex items-center gap-2">Claimmable dates<CalendarIcon
                  className='bg-[#939393] p-0.5'
                  color='white'
                  onClick={() => setShowCalendar(!showCalendar)}
                  size={20}
                />: </div>
              <div
                className='flex justify-between overflow-visible p-1 relative w-20'
              >
                <div className="flex justify-between w-full">
                <div className="mr-10">From: {moment((dateRange as Date[])[0]).format('l')}</div>
                <div>To: {moment((dateRange as Date[])[1]).format('l')}</div>
                </div>
                <div className='absolute left-0 top-[calc(100%+10px)] w-[400px]' ref={calendarRef}>
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
            <div className="mt-4">Destination</div>
          <input
            className='bg-zimburseGray my-2'
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Enter destination"
            value={destination}
          />
            </>
        }
        </div>
        <button
          className='bg-zimburseBlue flex items-center gap-2'
          disabled={disabled}
          onClick={() => onFinish(amount, verifier ?? '', spot, dateRange as Date[], destination)}
        >
          <div>{loading ? 'Adding entitlement...' : 'Add entitlement'}</div>
          {loading && <Loader />}
        </button>
      </div>
    </Modal>
  );
}
