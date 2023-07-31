# Static Site Gen

기본적으로 블로그 탭만 있으며, 번역된 아티클이 자연스럽게 같은 페이지에서 보여야 함.

- /blog /[article name] /index.md /en.md /article_resource.svg /arg.jpg

이런 형태의 구조가 되어야 한다.

`index.md`는 블로그 사용자가 가장 편한 언어로 작성된 글이며, 해당 글의 번역은 `ISO 639-1` 명세에 따른 코드로 제공되면
된다.

도메인은

blog/article_name/ -> 기본 언어 blog/article_name/en.html -> 번역된 언어

처럼 되며, 각 아티클에서 언어에 해당하는 버튼을 누르면, 해당 글로 이동한다.
