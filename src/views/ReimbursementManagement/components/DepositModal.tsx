import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { useAztec } from '../../../contexts/AztecContext';
import { formatNumber } from '../../../utils';
import { AztecAddress } from '@aztec/circuits.js';
import { toast } from 'react-toastify';
import Loader from '../../../components/Loader';
import { EscrowData } from '..';
import { toUSDCDecimals } from '@mach-34/zimburse/dist/src/utils';

type DepositModalProps = {
  activeMonthly: number;
  activeSpot: number;
  escrowAddress: string;
  escrowBalance: number;
  setEscrowData: Dispatch<SetStateAction<EscrowData | null>>;
} & Omit<ModalProps, 'children'>;

export default function DepositModal({
  activeMonthly,
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
  const [depositAmt, setDepositAmt] = useState<number>(0);
  const [depositing, setDepositing] = useState<boolean>(false);

  const depositUsdc = async () => {
    if (!account || !registryAdmin || !tokenContract) return;
    try {
      setDepositing(true);
      await tokenContract.methods
        .transfer_public(
          account.getAddress(),
          AztecAddress.fromString(escrowAddress),
          toUSDCDecimals(BigInt(depositAmt)),
          0
        )
        .send()
        .wait();
      setEscrowData((prev: any) => ({
        ...prev,
        usdcBalance: prev.usdcBalance + depositAmt,
      }));
      setTokenBalance((prev) => ({
        ...prev,
        public: prev.public - depositAmt,
      }));
      toast.success(
        `Succefully deposited ${formatNumber(depositAmt, 2)} USDC in Escrow`
      );
    } catch (err) {
      console.log('Err: ', err);
      toast.error('Error depositing USDC');
    } finally {
      setDepositAmt(0);
      setDepositing(false);
    }
  };

  const disabled = useMemo(() => {
    return depositAmt > tokenBalance.public;
  }, [depositAmt, tokenBalance]);

  return (
    <Modal height={70} onClose={onClose} open={open} width={80}>
      <div className='flex flex-col h-full justify-between'>
        <div>
          <X className='ml-auto' cursor='pointer' onClick={() => onClose()} />
          <div>
            <div className='text-4xl'>
              Escrow Balance: ${formatNumber(escrowBalance, 2)}
            </div>
            <div className='mt-2 text-xl'>
              Active Monthly Entitlements: ${formatNumber(activeMonthly, 2)}
            </div>
            <div className='text-xl'>
              Active Spot Entitlements: ${formatNumber(activeSpot, 2)}
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-8 items-center'>
          <div className='text-4xl'>
            Your USDC Balance: ${formatNumber(tokenBalance.public, 2)}
          </div>
          <div>
            <div className='flex gap-4 items-center text-xl'>
              <div>Depositing: </div>
              <input
                className='bg-zimburseGray'
                onChange={(e) => setDepositAmt(Number(e.target.value))}
                value={depositAmt}
              />
            </div>
            {disabled && (
              <div className='mt-2 text-center text-red-500 text-xs'>
                Deposit amount exceeds balance
              </div>
            )}
          </div>
          <button
            className='bg-zimburseBlue flex gap-4 items-center'
            disabled={disabled}
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
