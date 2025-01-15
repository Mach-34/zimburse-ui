import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { useAztec } from '../../../contexts/AztecContext';
import { AztecAddress } from '@aztec/circuits.js';
import { toast } from 'react-toastify';
import Loader from '../../../components/Loader';
import { EscrowData } from '..';
import { formatUSDC, toUSDCDecimals } from "../../../utils";
import { NUMBER_INPUT_REGEX } from "../../../utils/constants";

type DepositModalProps = {
  activeRecurring: bigint;
  activeSpot: bigint;
  escrowAddress: string;
  escrowBalance: bigint;
  setEscrowData: Dispatch<SetStateAction<EscrowData | null>>;
} & Omit<ModalProps, 'children'>;

export default function DepositModal({
  activeRecurring,
  activeSpot,
  escrowAddress,
  escrowBalance,
  onClose,
  open,
  setEscrowData,
}: DepositModalProps): JSX.Element {
  const {
    account,
    registryAdmin,
    setTokenBalance,
    tokenBalance,
    tokenContract,
  } = useAztec();
  const [depositAmt, setDepositAmt] = useState<string>("");
  const [depositing, setDepositing] = useState<boolean>(false);

  const depositUsdc = async () => {
    if (!account || !registryAdmin || !tokenContract) return;
    const amount = toUSDCDecimals(depositAmt);
    try {
      setDepositing(true);
      await tokenContract.methods
        .transfer_in_public(
          account.getAddress(),
          AztecAddress.fromString(escrowAddress),
          amount,
          0
        )
        .send()
        .wait();
      setEscrowData((prev: any) => ({
        ...prev,
        escrowed: prev.escrowed + amount,
      }));
      setTokenBalance((prev) => ({
        ...prev,
        public: prev.public - amount,
      }));
      toast.success(
        `Succefully deposited ${formatUSDC(amount)} USDC in Escrow`
      );
    } catch (err) {
      console.log('Err: ', err);
      toast.error('Error depositing USDC');
    } finally {
      setDepositAmt('');
      setDepositing(false);
    }
  };

  const exceedsBalance = useMemo(() => {
    if(depositAmt === "") return;
    const intAmount = toUSDCDecimals(depositAmt);
    return intAmount > tokenBalance.public;
  }, [depositAmt, tokenBalance]);

  const handleDepositInput = (val: string) => {
    if(NUMBER_INPUT_REGEX.test(val)) {
      setDepositAmt(val)
    }
  }

  return (
    <Modal height={70} onClose={onClose} open={open} width={80}>
      <div className='flex flex-col h-full justify-between'>
        <div>
          <X className='ml-auto' cursor='pointer' onClick={() => onClose()} />
          <div>
            <div className='text-4xl'>
              Escrow Balance: ${formatUSDC(escrowBalance)}
            </div>
            <div className='mt-2 text-xl'>
              Active Monthly Entitlements: ${formatUSDC(activeRecurring)}
            </div>
            <div className='text-xl'>
              Active Spot Entitlements: ${formatUSDC(activeSpot)}
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-8 items-center'>
          <div className='text-4xl'>
            Your USDC Balance: ${formatUSDC(tokenBalance.public)}
          </div>
          <div>
            <div className='flex gap-4 items-center text-xl'>
              <div>Depositing: </div>
              <input
                className='bg-zimburseGray'
                onChange={(e) => handleDepositInput(e.target.value)}
                placeholder="Enter deposit amount"
                value={depositAmt}
              />
            </div>
            {exceedsBalance && (
              <div className='mt-2 text-center text-red-500 text-xs'>
                Deposit amount exceeds balance
              </div>
            )}
          </div>
          <button
            className='bg-zimburseBlue flex gap-4 items-center ml-auto'
            disabled={!depositAmt || exceedsBalance}
            onClick={() => depositUsdc()}
          >
            {depositing ? 'Depositing' : 'Deposit'}
            {depositing && <Loader size={18} />}
          </button>
        </div>
      </div>
    </Modal>
  );
}
