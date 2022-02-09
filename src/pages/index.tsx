import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import common from '../styles/common.module.scss';
import styles from './home.module.scss';

import { FiCalendar, FiUser } from 'react-icons/fi';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home() {
  const post1: Post = {
    uid: '1',
    first_publication_date: '2022-02-08',
    data: {
      title: 'Como utilizar hooks',
      subtitle: 'Pensando em sincronização em vez de ciclos de vida.',
      author: 'Joseph Oliveira',
    },
  };

  const post2: Post = {
    uid: '2',
    first_publication_date: '2021-04-29',
    data: {
      title: 'Criando um app CRA do zero',
      subtitle:
        'Tudo sobre como criar a sua primeira aplicação utilizando Create React App',
      author: 'Danilo Vieira',
    },
  };

  const posts = [post1, post2];

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <Header />

      <main className={common.container}>
        {posts.map((post: Post) => (
          <Link key={post.uid} href={`/posts/${post.uid}`}>
            <a className={styles.post}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div>
                <time>
                  <FiCalendar /> {post.first_publication_date}
                </time>
                <span>
                  <FiUser /> {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        ))}

        <button className={styles.loadMore}>Carregar mais posts</button>
      </main>
    </>
  );
}

// export const getStaticProps = async () => {
//   // const prismic = getPrismicClient();
//   // const postsResponse = await prismic.query(TODO);

//   // TODO
// };
