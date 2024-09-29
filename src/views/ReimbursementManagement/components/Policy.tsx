import { CSSProperties, useMemo } from 'react';

type PolicyProps = {
  activeY: string;
  from?: string;
  limit?: string;
  paidOut: string;
  style?: CSSProperties;
  title: string;
  to?: string;
  twoWay?: string;
  type: string;
};

export default function Policy({
  activeY,
  from,
  limit,
  paidOut,
  style,
  title,
  to,
  twoWay,
  type,
}: PolicyProps): JSX.Element {
  const isSpot = useMemo(() => {
    return type.includes('Spot');
  }, [type]);

  return (
    <div className='bg-white p-1' style={{ ...style }}>
      <div className='text-xl'>{title}</div>
      <div className='text-xs'>{type}</div>
      <div className='flex items-end justify-between'>
        {isSpot ? (
          <div className='text-xs'>
            <div>{from}</div>
            <div>{to}</div>
            <div>{twoWay}</div>
          </div>
        ) : (
          <div />
        )}
        <div>
          {limit && <div>{limit}</div>}
          <div>{activeY}</div>
          <div>{paidOut}</div>
        </div>
      </div>
    </div>
  );
}
