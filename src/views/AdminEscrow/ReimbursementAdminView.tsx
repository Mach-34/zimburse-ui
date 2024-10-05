import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddGroupModal from './components/AddGroupModal';
import AppLayout from '../../layouts/AppLayout';
import { ZImburseContract } from '../../artifacts';
import { useAztec } from '../../contexts/AztecContext';
import { toast } from 'react-toastify';

const {
  VITE_APP_ESCROW_GROUPS: ESCROW_GROUPS,
  VITE_APP_ESCROW_GROUP_TITLES: ESCROW_GROUP_TITLES,
  VITE_APP_USDC_CONTRACT: USDC_CONTRACT,
} = import.meta.env;

type EscrowGroup = {
  id: string;
  title: string;
};

export default function ReimbursementSetupView(): JSX.Element {
  const { wallet } = useAztec();

  const [addingGroup, setAddingGroup] = useState<boolean>(false);
  const [groups, setGroups] = useState<Array<EscrowGroup>>([]);
  const [selectedGroup, setSelectedGroup] = useState<EscrowGroup | null>(null);
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);

  const addEscrowGroup = async (name: string) => {
    if (!wallet) return;
    setAddingGroup(true);
    try {
      const escrow = await ZImburseContract.deploy(wallet, USDC_CONTRACT, name)
        .send()
        .deployed();
      setGroups((prev) => [
        ...prev,
        { id: escrow.address.toString(), title: name },
      ]);
      toast.success('Created escrow group!');
    } catch {
      toast.error('Error occurred creating group.');
    } finally {
      setAddingGroup(false);
      setShowGroupModal(false);
    }
  };

  const fetchInfo = async () => {
    if (!wallet) return;
    const groupArr = [];
    const parsedGroupAddresses = JSON.parse(ESCROW_GROUPS);
    const parsedGroupTitles = JSON.parse(ESCROW_GROUP_TITLES);
    for (let i = 0; i < parsedGroupAddresses.length; i++) {
      groupArr.push({
        id: parsedGroupAddresses[i],
        title: parsedGroupTitles[i],
      });
    }
    setGroups(groupArr);
    // const parsed = JSON.parse(ESCROW_GROUPS);
    // const groupInfo = [];
    // for (const group of parsed) {
    //   const contract = await ZImburseContract.at(group, wallet);
    //   const title = await contract.methods.get_title().send().wait();
    //   // console.log('Title: ', title);
    // }
  };

  useEffect(() => {
    if (!wallet) return;
    (async () => await fetchInfo())();
  }, [wallet]);

  return (
    <AppLayout>
      <div className='flex flex-col h-[80vh]'>
        <div className='text-center text-3xl'>You Z-Imburse Escrows</div>
        <button
          className='ml-auto mt-16'
          onClick={() => setShowGroupModal(true)}
        >
          + New Group
        </button>
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
                    <div className='text-lg'>Total reimbursed: $xxx,xxx.xx</div>
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
                onClick={() => setShowGroupModal(true)}
              >
                + New Group
              </button>
            )}
          </div>
        </div>
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
