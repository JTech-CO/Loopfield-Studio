# 정적 배포와 도메인

[English](DEPLOYMENT.md) · **한국어**

## GitHub Pages / 권장

압축을 풀고 Loopfield-Studio 폴더의 내용물을 저장소 루트에 올린다. 최상위에 index.html, js/, css/, assets/가 있어야 한다. 프로젝트 폴더가 한 번 더 중첩되지 않도록 확인한다.

Settings → Pages → Build and deployment → Source를 GitHub Actions로 선택한다. 포함된 `.github/workflows/pages.yml`은 main push 또는 수동 실행으로 정적 파일을 배포한다. 처음 Source를 변경했다면 Actions 탭에서 Deploy Loopfield Studio를 수동 실행한다. main이 아닌 기본 브랜치를 쓰면 워크플로 branches 항목을 바꾼다. 조직 저장소에서는 Pages 배포 권한이나 승인이 필요할 수 있다.

빌드·서버·DB·npm 의존성 설치는 없다. workflow는 Node 단위 테스트 후 정적 파일을 Pages artifact로 묶는다. 루트 .nojekyll을 포함한다. 배포 URL의 /저장소명/ 아래에서 동작하도록 정적 경로는 상대 경로이다.

## 브랜치 방식 대안

GitHub Actions 워크플로를 비활성화하거나 pages.yml을 제거한 뒤, Settings → Pages → Deploy from a branch → main / (root)를 선택할 수도 있다. 두 배포 방법을 동시에 운영하지 않는다. 내용물은 동일한 정적 파일이다.

## 사용자 도메인

도메인은 정해져 있지 않아 임의 CNAME을 넣지 않았다. 소유 도메인을 준비하고 Pages의 Custom domain을 설정한 후 도메인 업체의 DNS를 GitHub 공식 가이드에 맞춘다. 루트 도메인과 서브도메인의 레코드 방식이 다르므로 기록된 IP를 이 문서에서 복제하지 않는다. 인증서가 준비되면 Enforce HTTPS를 켠다. DNS 전파와 인증서 발급은 앱 코드가 처리하는 부분이 아니다.

브라우저 저장소는 origin별이므로 기존 github.io 주소에서 새 도메인으로 이전하면 자동 저장 작업이 따라오지 않는다. 이전 주소에서 JSON을 저장하고 새 도메인에서 가져온다.

## localhost

```sh
python -m http.server 8000
```

`http://localhost:8000`에서 연다. file:// 더블클릭은 ES module과 인코더 보안 조건 때문에 지원 대상이 아니다. `http://192.168.x.x`처럼 다른 장치 IP로 열린 평문 HTTP는 localhost 예외가 아니다. 휴대폰 원격 확인은 HTTPS 정적 배포로 한다.

## 공개 전 점검

`tests/browser.html`에서 그래픽 검사를 실행한 뒤 1080p부터 실제 네이티브 MP4 생성·디코딩을 확인한다. QHD·DCI 2K·UHD도 목표 기기에서 각각 확인한다. Studio에서 파일 직접 저장·취소·JSON 보관·복원을 별도로 확인한다. 60fps와 60초는 짧은 30fps 시험과 별개로 확인한다.

개인 사용용 정적 서비스와 로그인·결제·공개 갤러리 서비스를 구분한다. 현재 코드에는 회원 기능이나 콘텐츠 서버가 없으며 GitHub Pages가 영상 렌더 서버 역할을 하는 것도 아니다. 각 방문자의 장치 자원을 사용한다.

공식 참조: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages).

## 공유 미리보기 이미지

사이트 OG/Twitter 메타데이터는 `assets/presets/og-site.png`의 절대 URL을 사용합니다. 도메인이나 저장소 이름을 바꾸면 canonical 및 이미지 URL도 함께 갱신하세요. 저장소용 `assets/presets/og-repository.png`는 GitHub의 Settings → General → Social preview에서 직접 등록합니다. 파일을 커밋하는 것만으로 저장소 설정이 바뀌지는 않습니다.

두 이미지는 사용자가 제공한 줄리아 집합을 참고해 생성한 홍보용 이미지이며, 셰이더의 실제 출력 캡처는 아닙니다. 이번 작업은 로컬 커밋까지만 진행하며 원격 푸시와 배포는 하지 않습니다.
