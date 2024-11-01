import { X } from 'lucide-react';
import Modal, { ModalProps } from '../../../components/Modal';
import { Dispatch, SetStateAction, useState } from 'react';
import { useAztec } from '../../../contexts/AztecContext';
import { formatNumber } from '../../../utils';
import { AztecAddress } from '@aztec/circuits.js';
import { toast } from 'react-toastify';
import Loader from '../../../components/Loader';
import { EscrowData } from '..';

type DepositModalProps = {
  escrowAddress: string;
  escrowBalance: number;
  setEscrowData: Dispatch<SetStateAction<EscrowData | null>>;
} & Omit<ModalProps, 'children'>;

export default function DepositModal({
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
          depositAmt,
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
      toast.success(`Succefully deposited ${formatNumber(depositAmt, 0)} USDC`);
    } catch (err) {
      console.log('Err: ', err);
      toast.error('Error depositing USDC');
    } finally {
      setDepositing(false);
    }
  };

  return (
    <Modal height={85} onClose={onClose} open={open} width={80}>
      <div className='flex flex-col h-full justify-between'>
        <div>
          <X className='ml-auto' cursor='pointer' onClick={() => onClose()} />
          <div>
            <div className='text-4xl'>
              Escrow Balance: ${formatNumber(escrowBalance, 0)}
            </div>
            <div className='mt-2 text-xl'>
              Active Monthly Entitlements: $xx,xxx.xx
            </div>
            <div className='text-xl'>Active Spot Entitlements: $xx,xxx.xx</div>
          </div>
        </div>
        <div className='flex flex-col gap-8 items-center'>
          <div className='text-4xl'>
            Your USDC Balance: ${formatNumber(tokenBalance.public, 0)}
          </div>
          <div className='flex gap-4 items-center text-xl'>
            <div>Depositing: </div>
            <input
              className='bg-zimburseGray'
              onChange={(e) => setDepositAmt(Number(e.target.value))}
              value={depositAmt}
            />
          </div>
          <button
            className='bg-zimburseBlue flex gap-4 items-center'
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
