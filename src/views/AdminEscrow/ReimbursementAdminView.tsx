import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddGroupModal from './components/AddGroupModal';
import AppLayout from '../../layouts/AppLayout';
import { ZImburseEscrowContract } from '../../artifacts';
import { useAztec } from '../../contexts/AztecContext';
import { toast } from 'react-toastify';
import { AztecAddress } from '@aztec/circuits.js';
import Loader from '../../components/Loader';
import useRegistryContract from '../../hooks/useRegistryContract';

const {
  VITE_APP_ESCROW_REGISTRY_CONTRACT: ESCROW_REGISTRY_CONTRACT,
  VITE_APP_USDC_CONTRACT: USDC_CONTRACT,
} = import.meta.env;

type EscrowGroup = {
  id: string;
  title: string;
};

export default function ReimbursementSetupView(): JSX.Element {
  const { account, viewOnlyAccount } = useAztec();
  const registryContract = useRegistryContract(ESCROW_REGISTRY_CONTRACT);

  const [addingGroup, setAddingGroup] = useState<number>(0);
  const [fetchingGroups, setFetchingGroups] = useState<boolean>(true);
  const [groups, setGroups] = useState<Array<EscrowGroup>>([]);
  const [selectedGroup, setSelectedGroup] = useState<EscrowGroup | null>(null);
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);

  const addEscrowGroup = async (name: string) => {
    if (!account || !registryContract) return;
    setAddingGroup(1);
    try {
      const escrow = await ZImburseEscrowContract.deploy(
        account,
        AztecAddress.fromString(ESCROW_REGISTRY_CONTRACT),
        AztecAddress.fromString(USDC_CONTRACT),
        name
      )
        .send()
        .deployed();

      setAddingGroup(2);

      // register deployed escrow into registry
      await registryContract
        .withWallet(account)
        .methods.register_escrow(escrow.address)
        .send()
        .wait();

      setGroups((prev: any) => [
        ...prev,
        { id: escrow.address.toString(), title: name },
      ]);
      toast.success('Created escrow group!');
    } catch (err) {
      console.log('Error: ', err);
      toast.error('Error occurred creating group.');
    } finally {
      setAddingGroup(0);
      setShowGroupModal(false);
    }
  };

  const fetchEscrowGroups = async () => {
    if (!account || !registryContract || !viewOnlyAccount) return;
    try {
      const escrows: Array<EscrowGroup> = [];
      const escrowGroups = await registryContract.methods
        .get_managed_escrows(0)
        .simulate();

      const numEscrows = Number(escrowGroups[0].len);
      for (let i = 0; i < numEscrows; i++) {
        const escrowAddress = escrowGroups[0].storage[i];
        const escrowContract = await ZImburseEscrowContract.at(
          escrowAddress,
          account
        );
        const titleBytes = await escrowContract
          .withWallet(viewOnlyAccount)
          .methods.get_title()
          .simulate();
        const title = Buffer.from(
          new Uint8Array(titleBytes.map(Number))
        ).toString('utf8');
        escrows.push({
          id: escrowAddress,
          title,
        });
      }
      setGroups(escrows);
      setFetchingGroups(false);
    } catch (err) {
      console.log('Error: ', err);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchEscrowGroups();
    })();
  }, [account, registryContract]);

  return (
    <AppLayout>
      <div className='flex flex-col h-[80vh]'>
        <div className='text-center text-3xl'>You Z-Imburse Escrows</div>
        {!fetchingGroups && (
          <button
            className='ml-auto mt-16'
            onClick={() => setShowGroupModal(true)}
          >
            + New Group
          </button>
        )}
        {fetchingGroups ? (
          <div className='flex gap-4 justify-center items-center h-full'>
            <div className='text-2xl'>Fetching Groups</div>
            <Loader size={24} />
          </div>
        ) : (
          <div className='flex flex-1 gap-16 min-h-0 justify-center mt-4 w-full'>
            {!!groups.length && (
              <div className='flex-none overflow-auto'>
                {groups.map((group) => (
                  <div
                    className='bg-zimburseGray cursor-pointer mb-4 px-10 py-4'
                    onClick={() => setSelectedGroup(group)}
                    key={group.id}
                    style={{
                      border:
                        selectedGroup === group
                          ? '4px solid #00A3FF'
                          : '4px solid transparent',
                    }}
                  >
                    {group.title}
                  </div>
                ))}
              </div>
            )}
            <div className='bg-zimburseGray flex flex-auto items-center justify-center p-4'>
              {selectedGroup ? (
                <div className='flex h-full items-end justify-between w-full'>
                  <div className='flex flex-col justify-between h-full'>
                    <div className='text-xl'>{selectedGroup.title}</div>
                    <div>
                      <div className='text-lg'>
                        Total reimbursed: $xxx,xxx.xx
                      </div>
                      <div className='text-lg'>Escrowed: $xx,xxx.xx</div>
                      <div className='text-lg'>
                        Active Monthly Entitlements: $xx,xxx.xx
                      </div>
                      <div className='text-lg'>
                        Active Spot Entitlements: $xx,xxx.xx
                      </div>
                    </div>
                  </div>
                  <Link
                    className='bg-[#9492F5] flex gap-2 items-center p-4 text-black'
                    to={`/reimbursement/manage/${selectedGroup.id}`}
                  >
                    Manage <ArrowRight size={18} />
                  </Link>
                </div>
              ) : groups.length ? (
                <div className='text-center'>
                  Click on a group to manage it or create a new one
                </div>
              ) : (
                <button
                  className='bg-[#A8A6A6]'
                  // onClick={() => setShowGroupModal(true)}
                  onClick={() => setShowGroupModal(true)}
                >
                  + New Group
                </button>
              )}
            </div>
          </div>
        )}
        <AddGroupModal
          addingGroup={addingGroup}
          onClose={() => setShowGroupModal(false)}
          onFinish={addEscrowGroup}
          open={showGroupModal}
        />
      </div>
    </AppLayout>
  );
}
