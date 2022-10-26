import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import dynamic from 'next/dynamic';

const pageTitle = 'DrawingPage';

const DynamicP5Wrapper = dynamic(() => import('../components/p5Canvasstroke'), {
    ssr: false,
});

const DrawingPage: NextPage = () => {

    return (
      <>
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content={'description of the ' + {pageTitle}}/>
          <link rel="icon" href="/favicon.ico" />
        </Head>
  
        <main className={styles.main}>

            <h1 className={styles.title}>
                This is the p5 drawing
            </h1>
            <DynamicP5Wrapper />

        </main>

      </>
    )
  }
  
  export default DrawingPage