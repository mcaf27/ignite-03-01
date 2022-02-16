import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Fragment, useState } from 'react';

import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import common from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import ptBR from 'date-fns/locale/pt-BR';
import { format } from 'date-fns';
import Comments from '../../components/Comments';
import { ExitPreview } from '../../components/ExitPreview';

interface Post {
  first_publication_date: string | null;
  editedText: string;
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

interface PostNavigation {
  previous: {
    slug: string;
    title: string;
  };
  next: {
    slug: string;
    title: string;
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  navigation: PostNavigation;
}

const formatDate = function (date: string): string {
  return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
};

export default function Post({ post, preview, navigation }: PostProps) {
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
          <span>{post.editedText}</span>
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

        <hr />

        <div>
          {!!navigation.previous && (
            <Link href={`/post/${navigation.previous.slug}`}>
              <a className={styles.previous}>
                {navigation.previous.title}
                <span>Post anterior</span>
              </a>
            </Link>
          )}

          {!!navigation.next && (
            <Link href={`/post/${navigation.next.slug}`}>
              <a className={styles.next}>
                {navigation.next.title}
                <span>Próximo post</span>
              </a>
            </Link>
          )}
        </div>

        <ExitPreview preview={preview} />

        <Comments />
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', slug?.toString(), {
    ref: previewData?.ref || null,
  });

  console.log(response);

  const previous = await prismic.query(
    Prismic.predicates.dateBefore(
      'document.first_publication_date',
      response.first_publication_date
    ),
    {
      pageSize: 1,
    }
  );

  const next = await prismic.query(
    Prismic.predicates.dateAfter(
      'document.first_publication_date',
      response.first_publication_date
    ),
    {
      pageSize: 1,
    }
  );

  const navigation: PostNavigation = {
    previous:
      previous.results_size === 0
        ? null
        : {
            slug: previous.results[0].uid,
            title: previous.results[0].data.title,
          },
    next:
      next.results_size === 0
        ? null
        : {
            slug: next.results[0].uid,
            title: next.results[0].data.title,
          },
  };

  const content = response.data.content.map(item => {
    return {
      heading: item.heading,
      body: [...item.body],
    };
  });

  const editedText =
    response.first_publication_date === response.last_publication_date
      ? ''
      : format(
          new Date(response.last_publication_date),
          "'* editado em' dd MMM yyyy', às' HH':'mm"
        );

  const post = {
    first_publication_date: response.first_publication_date,
    editedText,
    data: {
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content,
      title: response.data.title,
    },
  };

  return {
    props: {
      post,
      preview,
      navigation,
    },
  };
};
