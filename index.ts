// @deno-types="./data.d.ts"
import TAGS from './tags.json' assert { type: 'json' };
// @deno-types="./data.d.ts"
import FLAG from './flags.json' assert { type: 'json' };

import { extract } from 'https://deno.land/std@0.196.0/front_matter/any.ts';
import { micromark } from 'https://esm.sh/micromark@3';
import { gfm, gfmHtml } from 'https://esm.sh/micromark-extension-gfm@3';
import { math, mathHtml } from 'https://esm.sh/micromark-extension-math@3';
import { rehype } from 'https://esm.sh/rehype@12';
import rehypeHighlight from 'https://esm.sh/rehype-highlight@5';
import solidity from './solidity.js';
import { config } from 'https://deno.land/x/dotenv/mod.ts';
import { walk } from "https://deno.land/std/fs/mod.ts";

/**
 * @notice 아티클에서 추출한 메타데이터
 */
type Blog = {
  filename: string; // 해당 파일의 이름
  title: string; // 글의 타이틀
  date: Date; // 글이 퍼블리싱된 시점
  language: string; // 번역된 글에 들어가는 메타데이터
  author: string; // 글 작성자
  desc: string; // 글 내용의 축약
  tags: string[]; // 글에 연계된 태그들
  revision: number; //글 업데이트
  body: string; // 글 내용
};

type articleElement = { link: string; title: string; date: Date; desc: string; tags: string[] };

/**
 * @notice blog 폴더에서 아티클 단위로 마크다운 파일과 메타데이터를 읽는
 * @param articlename
 * @returns 하나의 아티클에 해당하는 모든 정보
 */
/**
 * Reads an article from the blog directory and returns its metadata and content.
 * @param articlename The name of the article to read.
 * @returns A promise that resolves to an array of Blog objects.
 */
async function readArticle(articlename: string): Promise<Blog[]> {
  const BlogArray: Blog[] = new Array<Blog>();

  for (const file of Deno.readDirSync(`blog/${articlename}`)) {
    if (!file.name.includes('.md')) continue;
    const str = await Deno.readTextFile(`blog/${articlename}/${file.name}`);
    const metadata = extract(str);
    const body = micromark(metadata.body, {
      allowDangerousHtml: true,
      extensions: [gfm(), math()],
      htmlExtensions: [gfmHtml(), mathHtml({ output: 'mathml' })],
    });

    const highlighedBody = await rehype()
      .data('settings', {fragment: true})
      .use(rehypeHighlight, {languages: {solidity}})
      .process(body);

    BlogArray.push({ ...metadata.attrs, filename: file.name, body: highlighedBody } as Blog);
  }

  return BlogArray.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * @notice 번역 목록, 링크 주입
 * @param template
 * @param translates
 * @returns
 */
/**
 * Injects translation links into the provided template.
 * @param template The template to inject translation links into.
 * @param languageCode An array of language codes to create translation links for.
 * @returns The template with translation links injected.
 */
function injectTranslates(template: string, languageCode: string[]): string {
  if (languageCode.length == 1) return '';

  const transform = (template: string, languageCode: string): string => {
    if (languageCode === config().PREFERRED_LANGUAGE) return template.replace(/<!-- LINK -->/g, '.');
    return template.replace(/<!-- LINK -->/g, `./${languageCode}.html`);
  };

  const list: string[] = new Array<string>();

  for (const code of languageCode) {
    list.push(transform(template, code).replace(/<!-- NAME -->/g, FLAG[code]));
  }
  return list.join('\n');
}

/**
 * @notice Blog 아티클에 실제 글데이터 주입
 * @param template
 * @param blog
 * @param translates
 * @returns
 */
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
function injectContents(template: string, { title, date, language, body }: Blog, translates: string): string {
  return template
    .replace(/<!-- LANGUAGE_CODE -->/g, language)
    .replace(/<!-- TITLE -->/g, title)
    .replace(/<!-- TRANSLATE -->/g, translates)
    .replace(/<!-- PUBLISH_DATE -->/g, new Intl.DateTimeFormat(language).format(date))
    .replace(/<!-- CONTENTS -->/g, body);
}

/**
 * @notice 아티클 목록 데이터 주입
 * @param template
 * @param param1
 * @returns
 */
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
function injectArticle(template: string, { link, title, date, desc, tags }: articleElement): string {
  const tagsTemplate = Deno.readTextFileSync(`template/tags.html`);

  const taglist = tags.map((v) => {
    return tagsTemplate.replace(/<!-- LABEL -->/g, v).replace(/<!-- COLOR -->/g, TAGS[v]);
  });

  return template
    .replace(/<!-- LINK -->/g, `${link}`)
    .replace(/<!-- TITLE -->/g, title)
    .replace(/<!-- DATE -->/g, new Intl.DateTimeFormat('ko-KR').format(date))
    .replace(/<!-- DESC -->/g, desc)
    .replace(/<!-- TAGS -->/g, taglist.join(''));
}

/**
 * @notice 블로그 글 목록 파일을 저장하는 함수
 * @param contents
 */
/**
 * Saves the provided contents as the article list in the 'dist' directory.
 * @param contents The contents to save as the article list.
 */
function saveArticleList(contents: string) {
  Deno.mkdirSync(`dist/`, { recursive: true });
  Deno.writeTextFileSync(`dist/index.html`, contents);
}

/**
 * @notice 블로그 글 하나 하나를 저장하는 함수
 * @param articleTitle
 * @param language
 * @param contents
 */
/**
 * Saves the provided contents as an article file in the 'dist' directory.
 * @param articleTitle The title of the article.
 * @param language The language the article is written in.
 * @param contents The contents to save as the article.
 */
function saveArticleFile(articleTitle: string, language: string, contents: string) {
  // 아티클 제목에 해당하는 디렉토리 생성
  Deno.mkdirSync(`dist/${articleTitle}`, { recursive: true });
  // 아티클 제목 하위 언어별 파일 생성
  Deno.writeTextFileSync(`dist/${articleTitle}/${language}.html`, contents);
}

/**
 * @notice 블로그 디렉토리 내부에 있는 리소스들을 dist의 아티클로 이동
 * @param articlename
 */
/**
 * Moves resources associated with the provided article name from the 'blog' directory to the 'dist' directory.
 * @param articlename The name of the article to move resources for.
 */
function resourceMove(articlename: string) {
  for (const file of Deno.readDirSync(`blog/${articlename}`)) {
    if (file.name.includes('.md')) continue;
    Deno.copyFileSync(`blog/${articlename}/${file.name}`, `dist/${articlename}/${file.name}`);
  }
}

// 블로그 아티클 읽고, 아티클 생성
/**
 * Reads all articles from the blog directory and returns their metadata and content.
 * @returns A promise that resolves to an object containing an array of article elements and an array of arrays of Blog objects.
 */
async function readBlog(): Promise<{articles: articleElement[], articleInfos: Blog[][]}> {
  const articlesArray: articleElement[] = [];
  const articleInfosArray: Blog[][] = [];

  // 블로그 디렉토리 아래에서 아티클 하나씩 이름 추출
  for (const articles of Deno.readDirSync('blog/')) {
    // 아티클 이름에서 추출된 포스트 정보
    const articleInfos: Blog[] = await readArticle(articles.name);
    articleInfosArray.push(articleInfos);

    // 아티클 정보 수집
    const article = articleInfos.map((v, i) => {
      if (v.language === config().PREFERRED_LANGUAGE) {
        return {
          link: articles.name,
          title: v.title,
          date: v.date,
          desc: v.desc,
          tags: v.tags,
        };
      }
    }).filter((elemeng) => elemeng !== undefined)[0] as articleElement;

    articlesArray.push(article);
  }

  return {articles: articlesArray, articleInfos: articleInfosArray};
}

/**
 * Updates the manifest.json and service-worker.js files in the 'dist' directory based on the current state of the 'dist' directory.
 */
async function updateManifestAndServiceWorker() {
  const files = [];
  for await (const entry of walk("dist")) {
    if (!entry.isDirectory) {
      files.push(`/${entry.path.replace('dist/', '')}`);
    }
  }

  // Update manifest.json
  const manifest = JSON.parse(await Deno.readTextFile("manifest.json"));
  manifest.start_url = files[0]; // Assuming the first file is the start_url
  await Deno.writeTextFile("./dist/manifest.json", JSON.stringify(manifest, null, 2));

  // Update service-worker.js
  const serviceWorker = await Deno.readTextFile("service-worker.js");
  const updatedServiceWorker = serviceWorker.replace(
    "// CACHELIST",
    files.join("',\n        '")
  );
  await Deno.writeTextFile("./dist/service-worker.js", updatedServiceWorker);
}

/**
 * Creates an RSS feed based on the articles in the blog directory and saves it as 'feed.xml' in the 'dist' directory.
 */
function generateXML(tag: string, content: string): string {
  return `<${tag}>${content}</${tag}>`;
}

async function createRSSFeed() {
  const articles = await readBlog();
  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n';

  for (const article of articles) {
    xmlContent += generateXML("item",
      generateXML("title", article.title) +
      generateXML("link", `https://yourwebsite.com/${article.link}`) +
      generateXML("description", article.desc) +
      generateXML("pubDate", article.date.toISOString())
    );
  }

  xmlContent += '</channel>\n</rss>';
  Deno.writeTextFileSync("dist/feed.xml", xmlContent);
}

/**
 * Generates HTML for each article in the provided articles array and saves them in the 'dist' directory.
 * @param articles An array of article elements to generate HTML for.
 * @param articleInfos An array of arrays of Blog objects containing metadata and content for each article.
 */
async function generateHTML({articles, articleInfos}: {articles: articleElement[], articleInfos: Blog[][]}) {
  const blogTemaplte = await Deno.readTextFile(`template/blog.html`);
  const translateTemplate = await Deno.readTextFile(`template/translate.html`);
  const articleTemplate = await Deno.readTextFile(`template/article.html`);
  const blogsTemplate = await Deno.readTextFile(`template/blogs.html`);
  const articleHTMLList: string[] = new Array<string>();

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const articleInfosForArticle = articleInfos[i];

    // 언어 코드 추출
    const languages: string[] = articleInfosForArticle.map((v) => {
      return v.language;
    });

    // 추출된 번역 코드에 따라, 번역 링크 생성
    const translateAnchor = injectTranslates(translateTemplate, languages);

    // 블로그 언어에 따라 글을 생성하여 저장
    for (const articleInfo of articleInfosForArticle) {
      saveArticleFile(
        article.link,
        config().PREFERRED_LANGUAGE === articleInfo.language ? 'index' : articleInfo.language,
        injectContents(blogTemaplte, articleInfo, translateAnchor),
      );
    }

    // 아티클 목록 HTML로 저장
    articleHTMLList.push(injectArticle(articleTemplate, article));

    // article 정보에 따라서, 리소스 이동
    resourceMove(article.link);
  }

  // 아티클 목록 생성
  saveArticleList(blogsTemplate.replace(/<!-- ARTICLES -->/g, articleHTMLList.join('\n')));
}

(async () => {
  const {articles, articleInfos} = await readBlog();
  await generateHTML({articles, articleInfos});
  // await createRSSFeed();
  await updateManifestAndServiceWorker();
})();
