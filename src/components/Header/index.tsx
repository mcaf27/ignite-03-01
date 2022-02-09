import common from '../../styles/common.module.scss';
import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={[common.container, styles.header].join(' ')}>
      <img src="/logo.svg" alt="logo" />
    </header>
  );
}
