import { config } from 'https://deno.land/x/dotenv/mod.ts';
import { walk } from 'https://deno.land/std/fs/mod.ts';
import { extract } from 'https://deno.land/std@0.196.0/front_matter/any.ts';
import { unified } from 'https://esm.sh/unified@11';
import remarkParse from 'https://esm.sh/remark-parse@11';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import remarkRehype from 'https://esm.sh/remark-rehype@11';
import remarkMath from 'https://esm.sh/remark-math@6';
import remarkMermaid from "https://esm.sh/remark-mermaid";
import rehypeRaw from 'https://esm.sh/rehype-raw@7';
import rehypeKatex from 'https://esm.sh/rehype-katex@7';
import rehypeSlug from 'https://esm.sh/rehype-slug@6';
import rehypeAutolinkHeadings from 'https://esm.sh/rehype-autolink-headings@7';
import rehypeHighlight from 'https://esm.sh/rehype-highlight@7';
import rehypeExternalLinks from 'https://esm.sh/rehype-external-links@3';
import rehypeStringify from 'https://esm.sh/rehype-stringify@10';

// @deno-types="./data.d.ts"
import TAGS from './tags.json' with { type: 'json' };
// @deno-types="./data.d.ts"
import FLAG from './flags.json' with { type: 'json' };
import remarkToc from './remarkToc.ts';
import solidity from './solidity.js';

const { PREFERRED_LANGUAGE, DATE_LOCALE } = config();

/**
 * @notice Article metadata extracted from blog post
 */
type Blog = {
  link: string; // 해당 아티클이 위치한 url
  filename: string; // 해당 파일의 이름
  title: string; // 글의 타이틀
  date: Date; // 글이 퍼블리싱된 시점
  language: string; // 번역된 글에 들어가는 메타데이터
  author: string; // 글 작성자
  desc: string; // 글 내용의 축약
  img: string; // 대표 이미지
  tags: string[]; // 글에 연계된 태그들
  revision: number; // 리비전
  publish: number; // 발행여부
  body: string; // 글 내용
};

/**
 * Reads an article from the blog directory and returns its metadata and content.
 * @param articlename The name of the article to read.
 * @returns A promise that resolves to an array of Blog objects.
 */
async function readArticle(articlename: string): Promise<Blog[]> {
  const blogPosts: Blog[] = new Array<Blog>();

  for await (const file of Deno.readDir(`blog/${articlename}`)) {
    // 파일명의 마지막이 `.md`가 아니면 건너뜀
    if (!file.name.includes('.md')) continue;

    try {
      // 파일 내용 읽기
      const markdownContent = await Deno.readTextFile(`blog/${articlename}/${file.name}`);
      const metadata = extract(markdownContent);
      const body = await unified()
        .use(remarkParse)
        .use(remarkMermaid, { simple: true })
        .use(remarkGfm)
        .use(remarkMath)
        .use(remarkToc, { heading: '목차|Contents?|indice' })
        .use(remarkRehype, { allowDangerousHtml: true, footnoteLabelProperties: {className: ''} })
        .use(rehypeRaw)
        .use(rehypeKatex, { output: 'mathml' })
        .use(rehypeSlug)
        .use(rehypeAutolinkHeadings, { behavior: 'wrap', content: '' })
        .use(rehypeHighlight, { languages: { solidity } })
        .use(rehypeExternalLinks, { rel: ['nofollow'] })
        .use(rehypeStringify)
        .process(metadata.body);

      blogPosts.push({ ...metadata.attrs, link: articlename, filename: file.name, body: body } as Blog);
    } catch (error) {
      console.error(`Failed to read article file: ${file.name}`, error);
      continue;
    }
  }

  return blogPosts;
}

/**
 * Injects translation links into the provided template.
 * @param template The template to inject translation links into.
 * @param languageCode An array of language codes to create translation links for.
 * @returns The template with translation links injected.
 */
function injectTranslates(template: string, languageCode: string[]): string {
  if (languageCode.length == 1) return '';

  const transform = (template: string, languageCode: string): string => {
    if (languageCode === PREFERRED_LANGUAGE) return template.replace(/<!-- LINK -->/g, '.');
    if (Deno.env.get('DEV') === 'true') return template.replace(/<!-- LINK -->/g, `./${languageCode}.html`);
    return template.replace(/<!-- LINK -->/g, `./${languageCode}`);
  };

  const list: string[] = new Array<string>();

  for (const code of languageCode) {
    list.push(transform(template, code).replace(/<!-- NAME -->/g, FLAG[code]));
  }
  return list.join('\n');
}

/**
 * Injects content into the provided blog template.
 * @param template The blog template to inject content into.
 * @param title The title of the blog.
 * @param date The date the blog was published.
 * @param language The language the blog is written in.
 * @param body The body content of the blog.
 * @param translates The translation links for the blog.
 * @returns The blog template with content injected.
 */
function injectContents(
  template: string,
  { link, title, date, language, body, desc, img }: Blog,
  translates: string,
): string {
  const replacements = [
    { pattern: /<!-- LANGUAGE_CODE -->/g, value: language },
    { pattern: /<!-- LINK -->/g, value: link },
    { pattern: /<!-- TITLE -->/g, value: title },
    { pattern: /<!-- DESC -->/g, value: desc },
    { pattern: /<!-- IMAGE -->/g, value: img },
    { pattern: /<!-- TRANSLATE -->/g, value: translates },
    {
      pattern: /<!-- PUBLISH_DATE -->/g,
      value: new Intl.DateTimeFormat(language).format(date),
    },
    { pattern: /<!-- CONTENTS -->/g, value: body },
  ];

  return replacements.reduce((acc, { pattern, value }) => acc.replace(pattern, value), template);
}

/**
 * Injects article information into the provided template.
 * @param template The template to inject article information into.
 * @param link The link to the article.
 * @param title The title of the article.
 * @param date The date the article was published.
 * @param desc The description of the article.
 * @param tags The tags associated with the article.
 * @returns The template with article information injected.
 */
async function injectArticle(template: string, { link, title, date, desc, tags, img }: Blog): Promise<string> {
  const tagsTemplate = `<li><!-- LABEL --></li>`

  const taglist = tags.map((v) => {
    return tagsTemplate.replace(/<!-- LABEL -->/g, v).replace(/<!-- COLOR -->/g, TAGS[v]);
  });

  const imgTemplate = `<img class="h-48 w-full object-cover md:h-full md:w-48" src="/<!-- LINK -->/<!-- IMAGE -->" alt="" />`
  const image = img ? imgTemplate.replace(/<!-- LINK -->/g, `${link}`).replace(/<!-- IMAGE -->/g, img) : '';

  return template
    .replace(/<!-- LINK -->/g, `${link}`)
    .replace(/<!-- TITLE -->/g, title)
    .replace(/<!-- DATE -->/g, new Intl.DateTimeFormat(DATE_LOCALE).format(date))
    .replace(/<!-- DESC -->/g, desc)
    .replace(/<!-- TAGS -->/g, taglist.join(''))
    .replace(/<!-- IMAGE -->/g, image);
}

/**
 * Saves the provided contents as the article list in the 'dist' directory.
 * @param contents The contents to save as the article list.
 */
async function saveArticleList(contents: string) {
  await Deno.mkdir(`dist/`, { recursive: true });
  await Deno.writeTextFile(`dist/index.html`, contents);
}

/**
 * Saves the provided contents as an article file in the 'dist' directory.
 * @param articleTitle The title of the article.
 * @param language The language the article is written in.
 * @param contents The contents to save as the article.
 */
async function saveArticleFile(articleTitle: string, language: string, contents: string) {
  // 아티클 제목에 해당하는 디렉토리 생성
  await Deno.mkdir(`dist/${articleTitle}`, { recursive: true });
  // 아티클 제목 하위 언어별 파일 생성
  await Deno.writeTextFile(`dist/${articleTitle}/${language}.html`, contents);
}

/**
 * Moves resources associated with the provided article name from the 'blog' directory to the 'dist' directory.
 * @param articlename The name of the article to move resources for.
 */
async function resourceMove(articlename: string) {
  const filePromises = [];

  for await (const file of Deno.readDir(`blog/${articlename}`)) {
    if (file.name.includes('.md')) continue;
    filePromises.push(
      Deno.copyFile(`blog/${articlename}/${file.name}`, `dist/${articlename}/${file.name}`)
    );
  }
  await Promise.all(filePromises);
}

/**
 * Reads all articles from the blog directory and returns their metadata and content.
 * @returns A promise that resolves to an object containing an array of article elements and an array of arrays of Blog objects.
 */
async function readBlog(): Promise<{ articleInfos: Blog[][] }> {
  const articleInfosArray: Blog[][] = [];

  // 블로그 디렉토리 아래에서 아티클 하나씩 이름 추출
  for await (const articles of Deno.readDir('blog/')) {
    if (articles.name.startsWith('.')) continue;
    // 아티클 이름에서 추출된 포스트 정보
    const articleInfos: Blog[] = await readArticle(articles.name);
    articleInfosArray.push(articleInfos);
  }

  // 정렬
  return {
    articleInfos: articleInfosArray.sort((a, b) => {
      return b[0].date.getTime() - a[0].date.getTime();
    }),
  };
}

/**
 * Updates the manifest.json and service-worker.js files in the 'dist' directory based on the current state of the 'dist' directory.
 */
async function updateManifestAndServiceWorker() {
  const hash = await getCommitHash();
  const files = [];
  for await (const entry of walk('dist')) {
    if (!entry.isDirectory) {
      if (entry.path.includes('service-worker.js')) continue;
      files.push(`/${entry.path.replace('dist/', '')}`);
    }
  }

  // Update manifest.json
  const manifest = JSON.parse(await Deno.readTextFile('manifest.json'));
  // manifest.start_url = "/"; // Assuming the first file is the start_url
  await Deno.writeTextFile('./dist/manifest.json', JSON.stringify(manifest, null, 2));

  // Update service-worker.js
  const serviceWorker = await Deno.readTextFile('service-worker.js');
  const updatedServiceWorker = serviceWorker.replace(
    '__CACHELIST__',
    files.join("',\n        '"),
  ).replace('__CACHE_VERSION__', hash);

  if (Deno.env.get('DEV') !== 'true') {
    await Deno.writeTextFile('./dist/service-worker.js', updatedServiceWorker);
  }
}

/**
 * Creates an XML element with the provided tag, content, property, and property value.
 * @param tag The tag for the XML element.
 * @param content The content for the XML element.
 * @param property An optional property for the XML element.
 * @param propValue An optional value for the property.
 * @returns The XML element as a string.
 */
function generateXML(tag: string, content: string, property = '', propValue = ''): string {
  return `<${tag}${property.length > 0 ? ' ' + property : ''}${
    property.length > 0 && propValue.length > 0 ? '="' + propValue + '"' : ''
  }>${content}</${tag}>\n`;
}

/**
 * Creates an RSS feed based on the articles in the blog directory and saves it as 'feed.xml' in the 'dist' directory.
 */
async function createRSSFeed(articles: Blog[][]) {
  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n';

  xmlContent += generateXML('title', 'yoonsung.eth') +
    generateXML('link', 'https://ysnim.ink/') +
    generateXML('description', '');

  for (const article of articles) {
    xmlContent += generateXML(
      'item',
      generateXML('title', article[0].title) +
        generateXML('description', article[0].desc) +
        generateXML('link', `https://ysnim.ink/${article[0].link}`) +
        generateXML('guid', article[0].link, 'isPermaLink', 'false') +
        generateXML('pubDate', article[0].date.toUTCString()),
    );
  }

  xmlContent += '</channel>\n</rss>';
  await Deno.writeTextFile('dist/feed.xml', xmlContent);
}

/**
 * Generates HTML for each article in the provided articles array and saves them in the 'dist' directory.
 * @param articleInfos An array of arrays of Blog objects containing metadata and content for each article.
 */
async function generateHTML({ articleInfos }: { articleInfos: Blog[][] }) {
  const navTemplate = await Deno.readTextFile(`template/nav.html`);
  const titleNavTemplate = navTemplate.replace('<!-- TITLE -->', 'yoonsung.eth');
  const backNavTemplate = navTemplate.replace('<!-- TITLE -->', '목록으로');
  const aboutTemplate = (await Deno.readTextFile(`template/about.html`)).replace('<!-- NavBar -->', titleNavTemplate);
  const blogTemplate = (await Deno.readTextFile(`template/blog.html`)).replace('<!-- NavBar -->', backNavTemplate);
  const translateTemplate = await Deno.readTextFile(`template/translate.html`);
  const articleTemplate = await Deno.readTextFile(`template/article.html`);
  const indexTemplate = (await Deno.readTextFile(`template/blogs.html`)).replace('<!-- NavBar -->', titleNavTemplate);
  const articleHTMLList: string[] = new Array<string>();

  for (let i = 0; i < articleInfos.length; i++) {
    const articleInfosForArticle = articleInfos[i];

    // 퍼블리시 상태가 아니라면 글 내보내지 말 것
    const isPublish = articleInfosForArticle.map((v) => {
      return v.publish;
    });
    if (isPublish[0] == 0) continue;

    // 언어 코드 추출
    const languages: string[] = articleInfosForArticle.map((v) => {
      return v.language;
    });

    // 추출된 번역 코드에 따라, 번역 링크 생성
    const translateAnchor = injectTranslates(translateTemplate, languages);

    // 블로그 언어에 따라 글을 생성하여 저장
    for (const articleInfo of articleInfosForArticle) {
      await saveArticleFile(
        articleInfo.link,
        (PREFERRED_LANGUAGE === articleInfo.language) ? 'index' : articleInfo.language,
        injectContents(blogTemplate, articleInfo, translateAnchor),
      );
    }

    // 블로그 언어에 따라 글을 생성하여 저장
    const articlePromises = articleInfosForArticle.map(articleInfo => 
      saveArticleFile(
        articleInfo.link,
        (PREFERRED_LANGUAGE === articleInfo.language) ? 'index' : articleInfo.language,
        injectContents(blogTemplate, articleInfo, translateAnchor)
      )
    );

    await Promise.all(articlePromises);

    // article 정보에 따라서, 리소스 이동
    await resourceMove(articleInfosForArticle[0].link);

    const preferredLang = articleInfosForArticle.find((blog) => blog.language == PREFERRED_LANGUAGE) as Blog;

    // HTML 아티클 목록 생성
    articleHTMLList.push(await injectArticle(articleTemplate, preferredLang));
  }

  // about 정보 이동
  await Deno.mkdir(`dist/about`, { recursive: true });
  await Deno.writeTextFile(`dist/about/index.html`, aboutTemplate);

  // about resource 이동
  for await (const file of Deno.readDir(`about/`)) {
    await Deno.copyFile(`about/${file.name}`, `dist/about/${file.name}`);
  }

  // 생성된 HTML 아티클 목록 주입
  saveArticleList(indexTemplate.replace(/<!-- ARTICLES -->/g, articleHTMLList.join('\n')));
}

async function getCommitHash(): Promise<string> {
  const td = new TextDecoder();
  const command = new Deno.Command('git', {
    args: [
      'rev-parse',
      'HEAD',
    ],
    stdin: 'piped',
    stdout: 'piped',
  });

  const process = (await command.spawn().output()).stdout;
  const out = td.decode(process).trim();

  return out + "1";
}

async function getPrevCommitHash(): Promise<string> {
  const td = new TextDecoder();
  const command = new Deno.Command('git', {
    args: [
      'rev-parse',
      'HEAD~1',
    ],
    stdin: 'piped',
    stdout: 'piped',
  });

  const process = (await command.spawn().output()).stdout;
  const out = td.decode(process).trim();

  return out;
}

(async () => {
  const { articleInfos } = await readBlog();
  await generateHTML({ articleInfos });
  await createRSSFeed(articleInfos);
  await updateManifestAndServiceWorker();
})();
