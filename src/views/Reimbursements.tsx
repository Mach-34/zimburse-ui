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
import { computeSecretHash, Fr } from '@aztec/aztec.js';
import {
  fromUSDCDecimals,
} from '@mach-34/zimburse/dist/src/utils';
import { formatUSDC, fromU128, toUSDCDecimals } from "../utils";

type Entitlement = {
  id: string;
  escrow: AztecAddress;
  paidOut: bigint;
  maxClaimmable: bigint;
  spot: boolean;
  title: string;
};

const emailTypes: { [key: number]: string } = {
  2: 'Linode',
  3: 'United'
};

const MAX_CHUNK_SIZE = 2048;

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

  const [emailFile, setEmailFile] = useState<File | null>(null);
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
              escrow: escrowContract.address,
              paidOut: 0,
              // TODO: Comibne hi and lo
              maxClaimmable: fromU128(entitlement.max_value),
              spot: entitlement.spot,
              title: ENTITLEMENT_TITLES[entitlement.verifier_id],
            };
          })
      );
      setEntitlements(formattedEntitlements);
    }
    setFetchingEscrows(false);
  };

  const submitClaim = async () => {
    if (!account || !emailFile || !tokenContract) return;
    const arrayBuff = await emailFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuff);
    try {
      setRedeemingEntitlement(true);
      const escrowAddress = entitlements[selectedEntitlement].escrow;
      const escrowContract = await ZImburseEscrowContract.at(
        escrowAddress,
        account
      );

      // const inputs = await makeLinodeInputs(buffer);
      // const formattedInputs = formatRedeemLinode(inputs);

      const { deferred, inputs } = await makeUnitedInputs(buffer);
      const formattedInputs = toContractFriendly(inputs);

      const amountToDateLength: number = deferred.amountToDateBody.length;
      console.log("amount to date length", amountToDateLength);
      const remainingLength: number = deferred.remainingBody.length;
      console.log("remaining length", remainingLength);

      const secret = Fr.random();
      const secretHash = computeSecretHash(secret);

      // hardcode amount to 22 for now
      const amount = toUSDCDecimals('1717.85');

      // const receipt = await escrowContract.methods
      //   .reimburse_linode_recurring(formattedInputs, secretHash)
      //   .send()
      //   .wait();

      let capsules = breakIntoCapsules(deferred.remainingBody.map((val: string) => parseInt(val)));
      for (const capsule of capsules)
          await account.addCapsule(capsule);
      capsules = breakIntoCapsules(deferred.amountToDateBody.map((val: string) => parseInt(val)));
      for (const capsule of capsules)
          await account.addCapsule(capsule);

      const receipt = await escrowContract.methods.reimburse_united_spot(
        formattedInputs,
        amountToDateLength,
        remainingLength,
        deferred.actualLength,
        secretHash
      ).send().wait();

      await addPendingShieldNoteToPXE(
        account,
        AztecAddress.fromString(USDC_CONTRACT),
        amount,
        secretHash,
        receipt.txHash
      );

      await tokenContract.methods
        .redeem_shield(account.getAddress(), amount, secret)
        .send()
        .wait();

      setTokenBalance((prev) => ({
        ...prev,
        private: prev.private + amount,
      }));

      toast.success('Successfully redeemed Linode entitlement!');
    } catch (err) {
      console.log('Error: ', err);
      toast.error('Failed to redeem linode entitlement');
    } finally {
      setRedeemingEntitlement(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchEscrows();
    })();
  }, [registryContract]);

  console.log('Entitlements: ', entitlements)

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
                    onClick={() => setSelectedEntitlement(index)}
                    style={{
                      border:
                        selectedEntitlement === index
                          ? '4px solid #00A3FF'
                          : '4px solid transparent',
                    }}
                  >
                    <div>{entitlement.title}</div>
                    <div className='flex justify-between mt-2 text-sm'>
                      <div>Org: TODO</div>
                      <div>
                        Amount: $
                        {/* {formatUSDC(entitlements[selectedEntitlement].maxClaimmable)} */}
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
                          Max Claimmable: $
                          {formatUSDC(entitlements[selectedEntitlement].maxClaimmable)}
                        </div>
                        <div className='text-lg'>Accepted Dates: TODO</div>
                        <div className='text-lg'>Email type: Linode</div>
                      </>
                    )}
                  </div>
                  <div className='flex flex-col items-center justify-center w-full'>
                    {emailFile ? (
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
                        <button className='bg-[#89B8FF] flex items-center justify-between w-full'>
                          <img alt='Google' src={google} />
                          <div>Import from Gmail</div>
                          <div />
                        </button>
                        <FileInput
                          accept='.eml'
                          Icon={Upload}
                          id='Entitlement Claim'
                          onUpload={(e) => setEmailFile(e.target.files[0])}
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
