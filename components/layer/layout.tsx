import NavbarCustom from './navbar'
import FooterCustom from './footer'
import styles from '../../styles/Home.module.css';

export default function Layout({ children }: any): any {

  return (
    <>
      <NavbarCustom />
          <main className={styles.main}>{children}</main>
      <FooterCustom />
    </>
  )
}