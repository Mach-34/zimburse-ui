import { useEffect, useState } from 'react';
import google from '../assets/google.svg';
import { Upload } from 'lucide-react';
import AppLayout from '../layouts/AppLayout';
import FileInput from '../components/FileInput';
import { ZImburseEscrowContract } from '../artifacts';
import { AztecAddress } from '@aztec/circuits.js';
import { useAztec } from '../contexts/AztecContext';
import useRegistryContract from '../hooks/useRegistryContract';
import Loader from '../components/Loader';
import { ENTITLEMENT_TITLES } from '../utils/constants';
import {
  makeLinodeInputs,
  formatRedeemLinode,
} from '@mach-34/zimburse/dist/src/email_inputs/linode';
import {
  makeUnitedInputs,
  toContractFriendly
} from '@mach-34/zimburse/dist/src/email_inputs/united';
import { addPendingShieldNoteToPXE } from '@mach-34/zimburse/dist/src/contract_drivers/notes';
import { toast } from 'react-toastify';
import { computeSecretHash, Fr, TxHash } from '@aztec/aztec.js';
import {
  fromUSDCDecimals,
} from '@mach-34/zimburse/dist/src/utils';
import { formatUSDC, fromU128, toUSDCDecimals } from "../utils";
import moment from "moment";
import { EmailDisplayData, extractLinodeData, extractUnitedData } from "../utils/emails";

const emailTypes: { [key: number]: string } = {
  2: 'Linode',
  5: 'United'
};

const MAX_CHUNK_SIZE = 2048;

type Entitlement = {
  id: string;
  acceptedDates: number[],
  destination: string;
  escrow: AztecAddress;
  paidOut: bigint;
  maxClaimmable: bigint;
  spot: boolean;
  verifier: number;
  title: string;
};

type UploadedFile = {
  data: EmailDisplayData;
  raw: Buffer
}

/**
 * Breaks u8 array into capsules
 * @param data - the data to break into capsules
 * @returns the capsules in order to insert
 */
export function breakIntoCapsules(data: number[], chunkSize?: number): Fr[][] {
    if (!chunkSize) chunkSize = MAX_CHUNK_SIZE;
    // pad to maxLength
    const chunks: Fr[][] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
        const endIndex = i + chunkSize <= data.length ? i + chunkSize : data.length;
        let chunk = data.slice(i, endIndex);
        if (chunk.length < chunkSize) {
            chunk = chunk.concat(Array(chunkSize - chunk.length).fill(0));
        }
        // chunks.push(data.slice(i, i + MAX_CHUNK_SIZE).map((x) => parseInt(x)));
        chunks.push(chunk.map(x => new Fr(x)));
    }
    return chunks.reverse();
}

const {
  VITE_APP_ESCROW_REGISTRY_CONTRACT: ESCROW_REGISTRY_CONTRACT,
  VITE_APP_USDC_CONTRACT: USDC_CONTRACT,
} = import.meta.env;

export default function ReimbursementsView(): JSX.Element {
  const { account, setTokenBalance, tokenContract } = useAztec();
  const registryContract = useRegistryContract(ESCROW_REGISTRY_CONTRACT);

  const [email, setEmail] = useState<UploadedFile | null>(null);
  const [entitlements, setEntitlements] = useState<Array<Entitlement>>([]);
  const [fetchingEscrows, setFetchingEscrows] = useState<boolean>(true);
  const [redeemingEntitlement, setRedeemingEntitlement] =
    useState<boolean>(false);
  const [selectedEntitlement, setSelectedEntitlement] = useState<number>(-1);

  const fetchEscrows = async () => {
    if (!account || !registryContract) return;

    const formattedEntitlements = [];

    // fetch participant escrows
    const participantEscrows = await registryContract.methods
      .get_participant_escrows(account.getAddress(), 0)
      .simulate();

    const { len, storage } = participantEscrows[0];
    for (let i = 0; i < len; i++) {
      const escrowContract = await ZImburseEscrowContract.at(
        storage[i],
        account
      );
      const entitlementsRes = await escrowContract.methods
        .view_entitlements(
          0,
          account.getAddress(),
          { _is_some: false, _value: AztecAddress.ZERO },
          { _is_some: false, _value: 0 },
          { _is_some: false, _value: false }
        )
        .simulate();

      const { len: entitlementsLen, storage: entitlementsStorage } =
        entitlementsRes[0];

      formattedEntitlements.push(
        ...entitlementsStorage
          .slice(0, Number(entitlementsLen))
          .map((entitlement: any, index: number) => {
            return {
              id: `${escrowContract.address.toString()}-${index}`,
              acceptedDates: entitlement.spot ? [Number(entitlement.date_start * 1000n), Number(entitlement.date_end * 1000n)] : [0, 0],
              escrow: escrowContract.address,
              paidOut: 0n,
              maxClaimmable: fromU128(entitlement.max_value),
              spot: entitlement.spot,
              verifier: Number(entitlement.verifier_id),
              title: ENTITLEMENT_TITLES[entitlement.verifier_id],
            };
          })
      );
      setEntitlements(formattedEntitlements);
    }
    setFetchingEscrows(false);
  };

  const claimLinode = async (escrow: ZImburseEscrowContract, secretHash: Fr, spot: boolean): Promise<TxHash> => {
    const inputs = await makeLinodeInputs(email!.raw);
    const formattedInputs = formatRedeemLinode(inputs);

    if(spot) {
      const { txHash } =  await escrow.methods
      .reimburse_linode_spot(formattedInputs, secretHash)
      .send()
      .wait();
      return txHash
    } else {
      const {txHash} = await escrow.methods
      .reimburse_linode_recurring(formattedInputs, secretHash)
      .send()
      .wait();
      return txHash;
    }
  }

  const claimUnited = async (escrow: ZImburseEscrowContract, secretHash: Fr): Promise<TxHash> => {
        const { deferred, inputs } = await makeUnitedInputs(email!.raw);
      const formattedInputs = toContractFriendly(inputs);

      const amountToDateLength: number = deferred.amountToDateBody.length;
      const remainingLength: number = deferred.remainingBody.length;

      let capsules = breakIntoCapsules(deferred.remainingBody.map((val: string) => parseInt(val)));
      for (const capsule of capsules)
          await account!.addCapsule(capsule);
      capsules = breakIntoCapsules(deferred.amountToDateBody.map((val: string) => parseInt(val)));
      for (const capsule of capsules)
          await account!.addCapsule(capsule);

      const { txHash } = await escrow.methods.reimburse_united_spot(
        formattedInputs,
        amountToDateLength,
        remainingLength,
        deferred.actualLength,
        secretHash
      ).send().wait();
      return txHash;
  }

  const submitClaim = async () => {
    if (!account || !email || !tokenContract) return;
    const { escrow: escrowAddress, spot, verifier } = entitlements[selectedEntitlement];
    try {
      setRedeemingEntitlement(true);
      const escrowContract = await ZImburseEscrowContract.at(
        escrowAddress,
        account
      );

      const secret = Fr.random();
      const secretHash = computeSecretHash(secret);

      let txHash = TxHash.ZERO;
      if(verifier === 2) {
        txHash = await claimLinode(escrowContract, secretHash, spot);
      } else {
        txHash = await claimUnited(escrowContract, secretHash);
      }

      const amount = email.data.amount;

      await addPendingShieldNoteToPXE(
        account,
        AztecAddress.fromString(USDC_CONTRACT),
        amount,
        secretHash,
        txHash
      );

      await tokenContract.methods
        .redeem_shield(account.getAddress(), amount, secret)
        .send()
        .wait();

      setTokenBalance((prev) => ({
        ...prev,
        private: prev.private + amount,
      }));

      toast.success(`Successfully redeemed ${emailTypes[verifier]} entitlement!`);
    } catch (err) {
      console.log('Error: ', err);
      toast.error(`Failed to redeem ${emailTypes[verifier]} entitlement`);
    } finally {
      setRedeemingEntitlement(false);
    }
  };

  const uploadEmail = async (file: File) => {
    const arrayBuff = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuff);
    // extract email info
    if(entitlements[selectedEntitlement].verifier === 5) {
      const extractedData = await extractUnitedData(buffer);
      setEmail({data: extractedData, raw: buffer})
    } else {
      const extractedData = await extractLinodeData(buffer);
      setEmail({data: extractedData, raw: buffer})
    }
  }

  useEffect(() => {
    (async () => {
      await fetchEscrows();
    })();
  }, [registryContract]);

  return (
    <AppLayout>
      <div className='text-center text-3xl'>Your Z-Imburse Escrows</div>
      {fetchingEscrows ? (
        <div className='flex gap-2 items-center justify-center h-full'>
          <div className='text-2xl'>Fetching escrows</div>
          <Loader size={24} />
        </div>
      ) : !!entitlements.length ? (
        <>
          <div className='flex flex-1 gap-16 min-h-0 mt-16 w-full'>
            <div className='flex flex-col w-[25%]'>
              <div className='text-xl'>Claimable Reimbursements</div>
              <div className='bg-zimburseGray flex-1 mt-4 overflow-y-auto px-4 py-6'>
                {entitlements.map((entitlement: Entitlement, index) => (
                  <div
                    className='bg-white cursor-pointer mb-4 p-4'
                    key={entitlement.id}
                    onClick={() => {
                      setEmail(null);
                      setSelectedEntitlement(index);
                    }}
                    style={{
                      border:
                        selectedEntitlement === index
                          ? '4px solid #00A3FF'
                          : '4px solid transparent',
                    }}
                  >
                    <div>{entitlement.title}</div>
                    <div className='flex justify-between mt-2 text-sm'>
                      <div>{entitlement.spot ? 'Spot' : 'Recurring'}</div>
                      <div>
                        Limit: $
                        {formatUSDC(entitlement.maxClaimmable)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div
              className='bg-zimburseGray flex flex-col p-4 w-[75%]'
              style={{
                alignItems: selectedEntitlement >= 0 ? 'flex-start' : 'center',
                justifyContent:
                  selectedEntitlement >= 0 ? 'space-between' : 'center',
              }}
            >
              {selectedEntitlement >= 0 ? (
                <>
                  <div>
                    <div className='mb-6 text-xl'>
                      {entitlements[selectedEntitlement].title}
                    </div>
                    {email ? (
                      <>
                        <div className='text-lg'>Claimed amount: ${formatUSDC(email.data.amount)}</div>
                        <div className='text-lg'>Receipt Date: {moment(email.data.date).format('LL')}</div>
                        <div className='text-lg'>
                          From: {email.data.from}
                        </div>
                        <div className='text-lg'>
                          To: {email.data.to}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className='text-lg'>
                          Max Claimmable: $
                          {formatUSDC(entitlements[selectedEntitlement].maxClaimmable)}
                        </div>
                        {entitlements[selectedEntitlement].spot &&
                        <div className='text-lg'>Accepted Dates: {moment(entitlements[selectedEntitlement].acceptedDates[0]).format('LL')} - {moment(entitlements[selectedEntitlement].acceptedDates[1]).format('LL')}
                        </div>}
                        <div className='text-lg'>Email type: {emailTypes[entitlements[selectedEntitlement].verifier]}</div>
                      </>
                    )}
                  </div>
                  <div className='flex flex-col items-center justify-center w-full'>
                    {email ? (
                      <button
                        className='bg-[#89B8FF] w-3/5'
                        onClick={() => submitClaim()}
                      >
                        {redeemingEntitlement
                          ? 'Submitting claim...'
                          : 'Submit Claim'}
                      </button>
                    ) : (
                      <div className='w-1/2'>
                        <button className='bg-[#89B8FF] flex items-center justify-between opacity-50 w-full' disabled={true}>
                          <img alt='Google' src={google} />
                          <div>Import from Gmail</div>
                          <div />
                        </button>
                        <FileInput
                          accept='.eml'
                          Icon={Upload}
                          id='Entitlement Claim'
                          onUpload={(e) => uploadEmail(e.target.files[0])}
                          style={{ marginTop: '32px', width: '100%' }}
                          text='Upload .eml'
                        />
                      </div>
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
        <div className='flex flex-col gap-8 items-center justify-center h-full'>
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
        </div>
      )}
    </AppLayout>
  );
}
