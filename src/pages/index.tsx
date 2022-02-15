import { useState } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import common from '../styles/common.module.scss';
import styles from './home.module.scss';

import { FiCalendar, FiUser } from 'react-icons/fi';

import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';

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

const formatPosts = function (posts: any): Post[] {
  return posts.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    // format(
    //   new Date(post.first_publication_date),
    //   'dd MMM yyyy',
    //   { locale: ptBR }
    // ),
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  }));
};

export default function Home({ postsPagination }: HomeProps) {
  const [newPages, setNewPages] = useState([] as Post[]);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const fetchNextPage = async function (url: string) {
    if (!!url) {
      await fetch(url)
        .then(res => res.json())
        .then((res: PostPagination) => {
          setNewPages([...newPages, ...formatPosts(res.results)]);
          setNextPage(res.next_page);
        });
    }
  };

  const formatDate = function (date: string): string {
    return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
  };

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <main
        className={common.container}
        style={{ paddingBottom: !!nextPage ? 0 : '4rem' }}
      >
        {[...postsPagination.results, ...newPages].map((post: Post) => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a className={styles.post}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div>
                <time>
                  <FiCalendar /> {formatDate(post.first_publication_date)}
                </time>
                <span>
                  <FiUser /> {post.data.author}
                </span>
              </div>
            </a>
          </Link>
        ))}

        {!!nextPage && (
          <button
            onClick={() => fetchNextPage(nextPage)}
            className={styles.loadMore}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const nextPage = postsResponse.next_page;

  const posts = formatPosts(postsResponse.results);

  return {
    props: {
      postsPagination: {
        next_page: nextPage,
        results: posts,
      },
    },
  };
};
