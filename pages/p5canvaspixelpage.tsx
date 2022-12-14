import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import dynamic from 'next/dynamic';

const pageTitle = 'Drawing<pixel>Page';

const DynamicP5Wrapper = dynamic(() => import('../components/p5Canvas'), {
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
        <h1 className={styles.title}>
            This is the p5 drawing
        </h1>
        <DynamicP5Wrapper />
      </>
    )
  }
  
  export default DrawingPage