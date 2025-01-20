import { LucideIcon } from 'lucide-react';
import { ChangeEventHandler, CSSProperties, useRef } from 'react';

type FileInputProps = {
  accept: string;
  Icon?: LucideIcon;
  id: string;
  onUpload: (e: ChangeEventHandler<HTMLInputElement>) => void;
  style?: CSSProperties;
  text: string;
};

export default function FileInput({
  accept,
  Icon,
  id,
  onUpload,
  style,
  text,
}: FileInputProps): JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (fileRef.current) {
      fileRef.current.click();
    }
  };

  return (
    <>
      <button
        className='bg-[#89B8FF] flex justify-between'
        onClick={handleButtonClick}
        style={{ ...style }}
      >
        {Icon ? <Icon /> : <div />}
        <div>{text || 'Upload file'}</div>
        <div />
      </button>
      <input
        accept={accept}
        id={id}
        type='file'
        ref={fileRef}
        style={{ display: 'none' }}
        onChange={onUpload}
      />
    </>
  );
}
