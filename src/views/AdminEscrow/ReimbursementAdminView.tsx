import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddGroupModal from './components/AddGroupModal';
import AppLayout from '../../layouts/AppLayout';
import {
  ZImburseEscrowContract,
  ZImburseRegistryContract,
} from '../../artifacts';
import { useAztec } from '../../contexts/AztecContext';
import { toast } from 'react-toastify';
import { AztecAddress } from '@aztec/circuits.js';
import Loader from '../../components/Loader';

const {
  VITE_APP_ESCROW_REGISTRY_CONTRACT: ESCROW_REGISTRY_CONTRACT,
  VITE_APP_USDC_CONTRACT: USDC_CONTRACT,
} = import.meta.env;

type EscrowGroup = {
  id: string;
  title: string;
};

export default function ReimbursementSetupView(): JSX.Element {
  const { wallet } = useAztec();

  const [addingGroup, setAddingGroup] = useState<boolean>(false);
  const [fetchingGroups, setFetchingGroups] = useState<boolean>(true);
  const [groups, setGroups] = useState<Array<EscrowGroup>>([]);
  const [selectedGroup, setSelectedGroup] = useState<EscrowGroup | null>(null);
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);

  const addEscrowGroup = async (name: string) => {
    if (!wallet) return;
    setAddingGroup(true);
    try {
      const escrow = await ZImburseEscrowContract.deploy(
        wallet,
        AztecAddress.fromString(ESCROW_REGISTRY_CONTRACT),
        AztecAddress.fromString(USDC_CONTRACT),
        name
      )
        .send()
        .deployed();

      // registry contract
      const registry = await ZImburseRegistryContract.at(
        AztecAddress.fromString(ESCROW_REGISTRY_CONTRACT),
        wallet
      );

      // register deployed escrow into registry
      await registry
        .withWallet(wallet)
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
      setAddingGroup(false);
      setShowGroupModal(false);
    }
  };

  const fetchEscrowGroups = async () => {
    if (!wallet) return;
    const escrows: Array<EscrowGroup> = [];
    const registry = await ZImburseRegistryContract.at(
      AztecAddress.fromString(ESCROW_REGISTRY_CONTRACT),
      wallet
    );
    const escrowGroups = await registry.methods
      .get_managed_escrows(0)
      .simulate();

    const numEscrows = Number(escrowGroups[0].len);

    for (let i = 0; i < numEscrows; i++) {
      const escrowAddress = escrowGroups[0].storage[i];
      const escrowContract = await ZImburseEscrowContract.at(
        escrowAddress,
        wallet
      );
      const titleBytes = await escrowContract.methods.get_title().simulate();
      const title = Buffer.from(
        new Uint8Array(titleBytes.map(Number))
      ).toString('utf8');

      escrows.push({ id: escrowAddress, title });
    }
    setGroups(escrows);
  };

  useEffect(() => {
    if (!wallet) return;
    (async () => {
      await fetchEscrowGroups();
      setFetchingGroups(false);
    })();
  }, [wallet]);

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
          loading={addingGroup}
          onClose={() => setShowGroupModal(false)}
          onFinish={addEscrowGroup}
          open={showGroupModal}
        />
      </div>
    </AppLayout>
  );
}
