import { extract } from 'https://deno.land/std@0.196.0/front_matter/any.ts';
import { micromark } from 'https://esm.sh/micromark@3';
import { gfm, gfmHtml } from 'https://esm.sh/micromark-extension-gfm@3';
import { math, mathHtml } from 'https://esm.sh/micromark-extension-math@3';
import { config } from 'https://deno.land/x/dotenv/mod.ts';

const FLAG: {
  [key: string]: string;
} = {
  'ko-KR': '🇰🇷',
  'en-GB': '🇬🇧',
  'en-US': '🇺🇸',
};

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

type articleElement = { link: string; title: string; date: Date; desc: string };

/**
 * @notice blog 폴더에서 아티클 단위로 마크다운 파일과 메타데이터를 읽는
 * @param articlename
 * @returns 하나의 아티클에 해당하는 모든 정보
 */
async function readArticle(articlename: string): Promise<Blog[]> {
  const BlogArray: Blog[] = new Array<Blog>();

  for (const filename of Deno.readDirSync(`blog/${articlename}`)) {
    const str = await Deno.readTextFile(`blog/${articlename}/${filename.name}`);
    const metadata = extract(str);
    const body = micromark(metadata.body, {
      allowDangerousHtml: true,
      extensions: [gfm(), math()],
      htmlExtensions: [gfmHtml(), mathHtml()],
    });

    BlogArray.push({ ...metadata.attrs, filename: filename.name, body: body } as Blog);
  }

  return BlogArray;
}

/**
 * @notice 번역 목록, 링크 주입
 * @param template
 * @param translates
 * @returns
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
function injectContents(template: string, { title, date, language, body }: Blog, translates: string): string {
  return template
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
function injectArticle(template: string, { link, title, date, desc }: articleElement): string {
  return template
    .replace(/<!-- LINK -->/g, `${link}`)
    .replace(/<!-- TITLE -->/g, title)
    .replace(/<!-- DATE -->/g, new Intl.DateTimeFormat('ko-KR').format(date))
    .replace(/<!-- DESC -->/g, desc);
}

/**
 * @notice 블로그 글 목록 파일을 저장하는 함수
 * @param contents
 */
function saveArticleList(contents: string) {
  Deno.mkdirSync(`dist/blog`, { recursive: true });
  Deno.writeTextFileSync(`dist/blog/index.html`, contents);
}

/**
 * @notice 블로그 글 하나 하나를 저장하는 함수
 * @param articleTitle
 * @param language
 * @param contents
 */
function saveArticleFile(articleTitle: string, language: string, contents: string) {
  // 아티클 제목에 해당하는 디렉토리 생성
  Deno.mkdirSync(`dist/blog/${articleTitle}`, { recursive: true });
  // 아티클 제목 하위 언어별 파일 생성
  Deno.writeTextFileSync(`dist/blog/${articleTitle}/${language}.html`, contents);
}

// 블로그 아티클 읽고, 아티클 생성
async function readBlog() {
  const blogTemaplte = await Deno.readTextFile(`template/blog.html`);
  const translateTemplate = await Deno.readTextFile(`template/translate.html`);
  const articleTemplate = await Deno.readTextFile(`template/article.html`);
  const blogsTemplate = await Deno.readTextFile(`template/blogs.html`);

  const articleHTMLList: string[] = new Array<string>();

  for (const articles of Deno.readDirSync('blog/')) {
    const articleInfos: Blog[] = await readArticle(articles.name);
    // 언어 코드 추출
    const languages: string[] = articleInfos.map((v) => {
      return v.language;
    });

    const translateAnchor = injectTranslates(translateTemplate, languages);

    // 블로그 언어마다 글 저장
    for (const article of articleInfos) {
      saveArticleFile(
        articles.name,
        config().PREFERRED_LANGUAGE === article.language ? 'index' : article.language,
        injectContents(blogTemaplte, article, translateAnchor),
      );
    }

    // 아티클 정보 수집
    const article = articleInfos.map((v, i) => {
      if (v.language === config().PREFERRED_LANGUAGE) {
        return {
          link: articles.name,
          title: v.title,
          date: v.date,
          desc: v.desc,
        };
      }
    }).filter((elemeng) => elemeng !== undefined)[0] as articleElement;

    // 아티클 목록 HTML로 저장
    articleHTMLList.push(injectArticle(articleTemplate, article));
  }

  // 아티클 목록 생성
  saveArticleList(blogsTemplate.replace(/<!-- ARTICLES -->/g, articleHTMLList.join('\n')));
}

(async () => {
  await readBlog();
})();
