import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AddGroupModal from './components/AddGroupModal';
import AppLayout from '../../layouts/AppLayout';

const GROUPS = new Array(5)
  .fill('Group')
  .map((group, index) => `${group} ${index + 1}`);

export default function ReimbursementSetupView(): JSX.Element {
  const [groups, setGroups] = useState<Array<string>>(GROUPS);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);

  const addEscrowGroup = (name: string) => {
    setGroups((prev) => [...prev, name]);
    setShowGroupModal(false);
  };

  return (
    <AppLayout>
      <div className='flex flex-col'>
        <div className='text-center text-3xl'>You Z-Imburse Escrows</div>
        <button
          className='ml-auto mt-16'
          onClick={() => setShowGroupModal(true)}
        >
          + New Group
        </button>
        <div className='flex flex-1 gap-16 min-h-0 justify-center mt-4 w-full'>
          <div className='flex-none overflow-auto'>
            {groups.map((group) => (
              <div
                className='bg-zimburseGray cursor-pointer mb-4 px-10 py-4'
                onClick={() => setSelectedGroup(group)}
                style={{
                  border:
                    selectedGroup === group
                      ? '4px solid #00A3FF'
                      : '4px solid transparent',
                }}
              >
                {group}
              </div>
            ))}
          </div>
          <div className='bg-zimburseGray flex flex-auto items-center justify-center p-4'>
            {selectedGroup ? (
              <div className='flex h-full items-end justify-between w-full'>
                <div className='flex flex-col justify-between h-full'>
                  <div className='text-xl'>{selectedGroup}</div>
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
                  to={`/reimbursement/manage/0x0123456789`}
                >
                  Manage <ArrowRight size={18} />
                </Link>
              </div>
            ) : (
              <div className='text-center'>
                Click on a group to manage it or create a new one
                <br />
                <br /> (if no groups place create button inside w/o this text)
              </div>
            )}
          </div>
        </div>
        <AddGroupModal
          onClose={() => setShowGroupModal(false)}
          onFinish={addEscrowGroup}
          open={showGroupModal}
        />
      </div>
    </AppLayout>
  );
}
