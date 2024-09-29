import { ChevronDown } from 'lucide-react';
import {
  CSSProperties,
  Dispatch,
  SetStateAction,
  useMemo,
  useState,
} from 'react';

type SelectProps = {
  onChange: Dispatch<SetStateAction<string | undefined>>;
  options: string[];
  placeholder?: string;
  selected?: string;
  style?: CSSProperties;
};

export default function Select({
  onChange,
  options,
  placeholder,
  selected,
  style,
}: SelectProps): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);

  const filteredOptions = useMemo(() => {
    return options.filter((option) => option !== selected);
  }, [options, selected]);

  return (
    <div
      className='bg-zimburseGray cursor-pointer flex items-center gap-8 justify-between p-1 relative'
      onClick={() => setOpen(!open)}
      style={{ ...style }}
    >
      <div>{selected ?? placeholder ?? 'Select'}</div>
      <div className='bg-[#939393] p-0.5'>
        <ChevronDown color='white' />
      </div>
      {open && (
        <div className='absolute bg-zimburseGray top-[calc(100%+10px)] left-0 w-full'>
          {filteredOptions.map((option) => (
            <div
              className='hover:bg-[#939393] px-2 py-1'
              onClick={() => onChange(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
