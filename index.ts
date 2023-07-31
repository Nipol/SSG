import { extract } from 'https://deno.land/std@0.196.0/front_matter/any.ts';
import { micromark } from 'https://esm.sh/micromark@3';
import { gfm, gfmHtml } from 'https://esm.sh/micromark-extension-gfm@3';
import { math, mathHtml } from 'https://esm.sh/micromark-extension-math@3';

/**
 * @notice 아티클에서 추출한 메타데이터
 */
type Blog = {
  language: string; // 번역된 글에 들어가는 메타데이터
  title: string;    // 글의 타이틀
  author: string;   // 글 작성자
  dect: string;     // 글 내용의 축약
  date: Date;       // 글이 퍼블리싱된 시점
  tags: string[];   // 글에 연계된 태그들
  body: string;     // 글 내용
};

/**
 * @notice blog 폴더에서 아티클 단위로 마크다운 파일과 메타데이터를 읽는
 * @param articlename 
 * @returns 하나의 아티클에 해당하는 모든 정보
 */
async function readArticle(articlename: string): Promise<Blog[]> {
  const BlogArray: Blog[] = new Array<Blog>();

  for (const filename of Deno.readDirSync(`blog/${articlename}`)) {
    const str = await Deno.readTextFile(`blog/${articlename}/${filename.name}`);
    const language = filename.name.substring(0, filename.name.length - 3);
    const metadata = extract(str);
    const body = micromark(metadata.body, {
      allowDangerousHtml: true,
      extensions: [gfm(), math()],
      htmlExtensions: [gfmHtml(), mathHtml()],
    });

    BlogArray.push({ language, ...metadata.attrs, body: body } as Blog);
  }

  return BlogArray;
}

/**
 * @notice 
 * @param template 
 * @param translates 
 * @returns 
 */
function injectTranslates(template: string, translates: string[]): string {
  const transform = (template: string, translate: string): string => {
    if (translate === "index.html") return template.replace(/<!-- LINK -->/g, "~");
    return template.replace(/<!-- LINK -->/g, `~/${translate}`);
  }

  const list: string[] = new Array<string>();

  for (const translate of translates) {
    list.push(transform(template, translate).replace(/<!-- NAME -->/g, translate.substring(0, translate.length-5)));
  }
  return list.join("\n");
}

function injectContents(template: string, { title, date, body }: Blog, translates: string) {
  return template
    .replace(/<!-- TITLE -->/g, title)
    .replace(/<!-- TRANSLATE -->/g, translates)
    .replace(/<!-- PUBLISH_DATE -->/g, date.toString())
    .replace(/<!-- CONTENTS -->/g, body);
}

function saveFile(article: string, filename: string, contents: string) {
  Deno.mkdirSync(`dist/blog/${article}`, { recursive: true });
  Deno.writeTextFileSync(`dist/blog/${article}/${filename}.html`, contents);
}

// 블로그 아티클 읽고, 아티클 생성
async function readBlog() {
  const blogTemaplte = await Deno.readTextFile(`template/blog.html`);
  const translateTemaplte = await Deno.readTextFile(`template/translate.html`);

  for (const articles of Deno.readDirSync('blog/')) {
    const articleInfos: Blog[] = await readArticle(articles.name);
    const languages: string[] = articleInfos.map((v, i) => {
      return v.language + '.html';
    });
    for (const article of articleInfos) {
      saveFile(articles.name, article.language, injectContents(blogTemaplte, article, injectTranslates(translateTemaplte, languages)));
    }
  }
}

(async () => {
  await readBlog();
})();
