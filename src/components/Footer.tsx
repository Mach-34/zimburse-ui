import logo from '../assets/logo.png';

export default function Footer(): JSX.Element {
  return (
    <div className='bg-zimburseGray flex h-[42px] items-center justify-between px-4'>
      <div className='w-[100px]' />
      <div>
        By:{' '}
        <a href='https://mach34.space/' rel='noreferrer' target='_blank'>
          Mach 34
        </a>
      </div>
      <img alt='Logo' className='h-8 rounded-full w-8' src={logo} />
    </div>
  );
}
