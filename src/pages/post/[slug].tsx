import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import common from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { Fragment, useState } from 'react';

import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';
import { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

const formatDate = function (date: string): string {
  return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
};

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const [readingTime] = useState(() => {
    const words = post.data.content.reduce((acc, e) => {
      const body = e.body.map(c => c.text.split(' ').length);
      body.forEach(i => (acc += i));

      acc += e.heading?.split(' ').length || 0;

      return acc;
    }, 0);

    return Math.ceil(words / 200);
  });

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <img
        src={post.data.banner.url}
        alt="banner"
        className={styles.bannerImg}
      />

      <main className={[common.container, styles.post].join(' ')}>
        <header>
          <h1>{post.data.title}</h1>
          <div>
            <span>
              <FiCalendar /> {formatDate(post.first_publication_date)}
            </span>
            <span>
              <FiUser /> {post.data.author}
            </span>
            <span>
              <FiClock /> {readingTime} min
            </span>
          </div>
        </header>

        <section>
          {post.data.content.map((item, i) => (
            <Fragment key={i}>
              <h2>{item.heading}</h2>
              <div
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(item.body) }}
              />
            </Fragment>
          ))}
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { fetch: [], pageSize: 2 }
  );

  const slugs = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths: slugs,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', slug?.toString(), {});

  const content = response.data.content.map(item => {
    return {
      heading: item.heading,
      body: [...item.body],
    };
  });

  const post = {
    first_publication_date: formatDate(response.first_publication_date),
    data: {
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content,
      title: response.data.title,
      subtitle: response.data.subtitle,
    },
    uid: response.uid,
  };

  return {
    props: {
      post,
    },
  };
};
