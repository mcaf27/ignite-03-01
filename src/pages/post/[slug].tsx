import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';

import common from '../../styles/common.module.scss';
import styles from './post.module.scss';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { Fragment } from 'react';

interface Post {
  first_publication_date: string | null;
  reading_time: string;
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

export default function Post({ post }: PostProps) {
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
              <FiCalendar /> {post.first_publication_date}
            </span>
            <span>
              <FiUser /> {post.data.author}
            </span>
            <span>
              <FiClock /> {post.reading_time}
            </span>
          </div>
        </header>

        <section>
          {post.data.content.map((item, i) => {
            if (!item.heading) {
              return item.body.map((body, i) => (
                <div key={i} dangerouslySetInnerHTML={{ __html: body.text }} />
              ));
            } else {
              return (
                <Fragment key={i}>
                  <h2 dangerouslySetInnerHTML={{ __html: item.heading }} />
                  {item.body.map(body => (
                    <div dangerouslySetInnerHTML={{ __html: body.text }} />
                  ))}
                </Fragment>
              );
            }
          })}
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // const prismic = getPrismicClient();
  // const posts = await prismic.query(TODO);

  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', slug.toString(), {});

  let words = 0;

  const content = response.data.content.map(item => {
    return {
      heading: item.heading,
      body: item.body.map(body => {
        words += body.text.split(' ').length;
        return {
          text: RichText.asHtml([body]),
        };
      }),
    };
  });

  console.log(words);

  const post: Post = {
    first_publication_date: new Date(
      response.first_publication_date
    ).toLocaleDateString('pt-br', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    reading_time: `${Math.ceil(words / 200)} min`,
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
    },
  };
};
