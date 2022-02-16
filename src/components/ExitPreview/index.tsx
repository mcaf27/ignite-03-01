import Link from 'next/link';
import common from '../../styles/common.module.scss';

export const ExitPreview = ({ preview }: { preview: boolean }) => {
  if (preview) {
    return (
      <aside>
        <Link href="/api/exit-preview">
          <a className={common.exitPreview}>Sair do modo Preview</a>
        </Link>
      </aside>
    );
  } else {
    return <></>;
  }
};
